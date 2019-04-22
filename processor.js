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
const feeProcessor = require('./models/feeProcessor');
const socialTrading = require('./models/socialTradingContract');

const onTrade = async function (exchange, leader, trade) {
  let txHash = utils.tradeTx(exchange.id, trade.id);
  let order = await Order.find(txHash);
  if (order !== undefined) {
    // Trade from this relay.
    let exchangeInfo = await exchange.listAllSymbol();
    let asset = exchangeInfo[trade.symbol].baseAsset;
    let base = exchangeInfo[trade.symbol].quoteAsset;
    let precision = exchangeInfo[trade.symbol].baseAssetPrecision;
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
      leaderTxhash: order.leaderTxHash,
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
      if (rewardAndFees.sumFee > new BigNumber(0)) {
        let totalFee = numeral(rewardAndFees.sumFee).format(`0,0.[${repeatDecimalC8}]`);
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
          if (user !== null) {
            let exchangeInfo = await exchange.listAllSymbol();
            let asset = exchangeInfo[trade.symbol].baseAsset;
            let base = exchangeInfo[trade.symbol].quoteAsset;
            let baseAmount = utils.decimalFormat(8, trade.quantity * trade.price * Math.pow(10, 8));
            let msg = `Order: ${trade.side} ${trade.quantity} ${asset} by ${baseAmount} ${base}`;
            let title = 'Leader Transaction';
            try {
              let order = await exchange.newOrder(crypt.decrypt(user.apiKey), crypt.decrypt(user.apiSecret), trade);
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
              console.log(e);
              msg += `\nYour balance of ${asset} in your ${exchange.name.toUpperCase()} account is not enough.`;
              push.sendMsgToUser(follower, title, msg);
            }
          } else {
            // Notify user to register API KEY.
          }
        });
      }
    });
  }
};

const exchanges = ['binance'];
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
