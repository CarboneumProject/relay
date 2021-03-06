const BigNumber = require('bignumber.js');
const numeral = require('numeral');
const redis = require('redis');
const client = redis.createClient();
const config = require('./config');
const network = config.getNetwork();
client.select(network.redisDB);

const Order = require('./models/order');
const User = require('./models/user');
const push = require('./models/push');
const utils = require('./models/utils');
const crypt = require('./models/crypt');
const Trade = require('./models/trade');
const TradeLog = require('./models/tradeLog');
const feeProcessor = require('./models/feeProcessor');
const socialTrading = require('./models/socialTradingContract');
const processed = {};

function isProcessed (tradeKey) {
  if (tradeKey in processed) {
    return true;
  } else {
    processed[tradeKey] = true;
    return false;
  }
}

const onTrade = async function (exchange, leader, trade) {
  let txHash = utils.tradeTx(exchange.id, trade.id);
  let { asset, base, precision, stepSize, minNotional } = await exchange.getAssetsBySymbol(trade.symbol);
  let trader = leader;
  // Prevent same trade and same trader.
  let tradeKey = `${exchange}:${trader}:${txHash}`;
  if (isProcessed(tradeKey)) {
    return;
  }
  let order = await Order.find(txHash);
  if (order !== undefined) {
    // Trade from this relay.
    trader = order.follower;
    let tradeKey = `${exchange}:${trader}:${txHash}`;
    if (isProcessed(tradeKey)) {
      return;
    }
    let assetPrice = await exchange.getPriceInUSD(asset);
    let costBase = (trade.price * trade.quantity).toFixed(precision);
    let costUsd = (assetPrice * trade.quantity).toFixed(precision);
    let tradeComplete = {
      orderTime: order.orderTime,
      leader: order.leader,
      follower: order.follower,
      makerToken: asset,
      takerToken: base,
      amountMaker: trade.quantity,
      amountTaker: costBase,
      amountLeft: trade.quantity,
      orderHash: order.orderHash,
      txHash: order.orderHash,
      leaderTxHash: order.leaderTxHash,
      cost: costUsd,
    };
    if (trade.side === 'BUY') {
      // Save buy order to database and wait for sell order.
      await Trade.insertNewTrade(tradeComplete);
    } else {
      // Sell order process fee.
      let openTrades = await Trade.getAvailableTrade(asset, order.follower);
      let c8LastPrice = await exchange.getC8LastPrice();
      c8LastPrice = new BigNumber(c8LastPrice);
      let rewardAndFees = await feeProcessor.percentageFee(openTrades, tradeComplete, c8LastPrice);

      // update db
      let updateAmounts = rewardAndFees.updateAmounts;
      updateAmounts.forEach(async function (order) {
        await Trade.updateAmountLeft(order.amountLeft, order.orderId);
      });

      // call social contract's distribute reward
      let processedFees = rewardAndFees.processedFees;
      await socialTrading.distributeRewardAll(processedFees);

      let ext = '';
      let c8Decimals = 18;
      let repeatDecimalC8 = '0'.repeat(c8Decimals);
      let sumFee = rewardAndFees.sumFee;
      if (rewardAndFees.sumFee > new BigNumber(0)) {
        sumFee = sumFee.div(10 ** c8Decimals);
        let totalFee = numeral(sumFee).format(`0,0.[${repeatDecimalC8}]`);
        ext = `\nReward + Fee ${totalFee} C8`;
      }

      let msg = `Order: SELL ${tradeComplete.amountMaker} ${tradeComplete.makerToken} `;
      msg += `for ${tradeComplete.amountTaker} ${tradeComplete.takerToken} ${ext}`;
      push.sendTradeNotification(tradeComplete.makerToken, tradeComplete.takerToken, tradeComplete.amountMaker,
        tradeComplete.amountTaker, tradeComplete.leader, tradeComplete.follower, msg);
    }
  } else {
    // Trade from real user.
    client.hgetall('leader:' + leader, async function (err, followDict) {
      if (err) {
        return;
      }
      if (followDict !== null) {
        await Object.keys(followDict).forEach(async function (follower) {
          let user = await User.find(follower, exchange.name);
          if (user !== undefined) {
            let leaderUser = await User.find(leader, exchange.name);
            let leaderBalance = await exchange.balance(
              crypt.decrypt(leaderUser.apiKey),
              crypt.decrypt(leaderUser.apiSecret),
            );
            let followerBalance = await exchange.balance(crypt.decrypt(user.apiKey), crypt.decrypt(user.apiSecret));
            let followerTrade = { ...trade };
            let tradeAsset = asset;
            if (trade.side === 'SELL') {
              tradeAsset = asset;
              if (!(tradeAsset in followerBalance) || parseFloat(followerBalance[tradeAsset].available) === 0) {
                followerTrade.quantity = NaN;
              } else {
                let fundFraction = parseFloat(trade.quantity) /
                  (parseFloat(leaderBalance[tradeAsset].available) + parseFloat(trade.quantity));
                followerTrade.quantity = fundFraction * parseFloat(followerBalance[tradeAsset].available);
              }
            } else {
              tradeAsset = base;
              if (!(tradeAsset in followerBalance) || parseFloat(followerBalance[tradeAsset].available) === 0) {
                followerTrade.quantity = NaN;
              } else {
                let cost = parseFloat(trade.quantity) * parseFloat(trade.price);
                let fundFraction = cost / (cost + parseFloat(leaderBalance[tradeAsset].available));
                let costFollower = fundFraction * parseFloat(followerBalance[tradeAsset].available);
                followerTrade.quantity = (costFollower / trade.price);
              }
            }
            let title = `Leader Transaction @ ${exchange.name.toUpperCase()}`;
            let msg = '';
            msg += `Leader Order: ${trade.side} ${trade.quantity} ${asset} Price ${utils.decimalFormat(
              precision, followerTrade.price * Math.pow(10, precision),
            )} ${base}\n`;
            if (isNaN(followerTrade.quantity)) {
              msg += `Not enough ${tradeAsset} available`;
              push.sendMsgToUser(follower, title, msg);
              return;
            }
            // Adjust quantity step for exchange.
            followerTrade.quantity = (followerTrade.quantity - (followerTrade.quantity % stepSize)).toFixed(precision);
            let baseAmount = utils.decimalFormat(
              precision,
              followerTrade.quantity * followerTrade.price * Math.pow(10, precision),
            );
            msg += `Your Order: ${followerTrade.side} ${followerTrade.quantity} ${asset} by ${baseAmount} ${base}`;
            try {
              let order = await exchange.newOrder(
                crypt.decrypt(user.apiKey),
                crypt.decrypt(user.apiSecret),
                followerTrade,
              );
              let orderHash = utils.tradeTx(exchange.id, order.orderId);
              let copyOrder = {
                leader: leader,
                follower: follower,
                leaderTxHash: txHash,
                orderHash: orderHash,
                orderTime: new Date(order.transactTime),
              };
              await Order.insertNewOrder(copyOrder);
              msg += '\nFollowing your leader, your order is placing.';
              push.sendMsgToUser(follower, title, msg);
            } catch (e) {
              let errMsg = '';
              if ('message' in e) {
                errMsg += e.message;
              } else {
                errMsg += JSON.parse(e.body).msg;
              }
              if (errMsg === 'Filter failure: MIN_NOTIONAL') {
                errMsg = `Order failed: Total value must be at least ${minNotional.toFixed(precision - 4)} ${base}`;
              }
              msg += `\n${errMsg}`;
              push.sendMsgToUser(follower, title, msg);
            }
          } else {
            // Notify user to register API KEY.
          }
        });
      }
    });
  }
  // Add trade log for performance measure
  let log = {
    txHash: txHash,
    trader: trader,
    asset: asset,
    currency: base,
    side: trade.side,
    quantity: trade.quantity,
    price: trade.price,
    cost: (trade.quantity * (await exchange.getPriceInUSD(asset))).toFixed(4),
    orderTime: new Date(trade.time),
  };
  await TradeLog.insertLog(log);
};

const exchanges = ['binance', 'binanceDEX'];
const tradeExchange = [];
for (let i = 0; i < exchanges.length; i++) {
  tradeExchange.push(require(`./exchanges/${exchanges[i]}`));
}
const subscribedUsers = {};
const subscriptionDelay = 30000; // Delay each 30 seconds for subscribe new users.
async function subscribe () {
  for (let ex of tradeExchange) {
    let users = await User.findAllInExchange(ex.name);
    for (let user of users) {
      let userKey = `${user.exchange}:${user.address}:${user.apiKey}`;
      if (!(userKey in subscribedUsers)) {
        ex.subscribe(crypt.decrypt(user.apiKey), crypt.decrypt(user.apiSecret), user.address, onTrade);
        subscribedUsers[userKey] = true;
      }
    }
  }
  setTimeout(subscribe, subscriptionDelay);
}

subscribe();
