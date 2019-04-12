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
const socialTrading = require('./models/socialTradingContract');

const onTrade = async function (exchange, leader, trade) {
  console.dir(trade);
  let txHash = utils.tradeTx(exchange.id, trade.id);
  let order = await Order.find(txHash);
  if (order !== undefined) {
    // Trade from this relay.
    if (trade.side === 'BUY') {
      // Get cost of trade by USD
      let exchangeInfo = await exchange.listAllSymbol();
      let asset = exchangeInfo[trade.symbol].baseAsset;
      let base = exchangeInfo[trade.symbol].quoteAsset;
      let assetPrice = await exchange.getPriceInUSD(asset);
      let costBase = trade.price * trade.quantity;
      let costUsd = assetPrice * trade.quantity;
      let tradeComplete = {
        orderTime: order.order_time,
        leader: order.leader,
        follower: order.follower,
        makerToken: asset,
        takerToken: base,
        amountMaker: trade.quantity,
        amountTaker: costBase,
        amountLeft: trade.quantity,
        orderHash: order.order_hash,
        txHash: order.order_hash,
        leaderTxhash: order.leader_tx_hash,
        cost: costUsd,
      };
      // Save trade to DB
      await Trade.insertNewTrade(tradeComplete);
    } else {
      // Reduce amount of purchased token from our trade in database.

      // Calc profit of the trade.

      // Distribute reward if needed.
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
              console.log(e.message());
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
