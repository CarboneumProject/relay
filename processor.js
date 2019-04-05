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
const socialTrading = require('./models/socialTradingContract');

const onTrade = async function (exchange, leader, trade) {
  let txHash = utils.tradeTx(exchange.id, trade.id);
  let order = await Order.find(txHash);
  if (order !== undefined) {
    // Trade from this relay.
    // Distribute reward and fee.
    // TODO change to profit share model.
    await socialTrading.distributeRewardOne(
      order.leader,
      order.follower,
      network.REWARD,
      network.FEE,
      [order.leader_tx_hash, '0x', order.order_hash, '0x'],
    );
    let c8Decimals = 18;
    let repeatDecimalC8 = '0'.repeat(c8Decimals - 4);
    // push msg to user
    let sumFee = new BigNumber(network.FEE).add(new BigNumber(network.REWARD));
    let ext = '';
    if (sumFee.gt(0)) {
      sumFee = sumFee.div(10 ** c8Decimals);
      let totalFee = numeral(sumFee).format(`0,0.0000[${repeatDecimalC8}]`);
      ext = `\nFee ${totalFee} C8`;
    }
    let asset = trade.symbol.substring(0, 3);
    let base = trade.symbol.substring(3, 6);
    let baseAmount = utils.decimalFormat(8, trade.quantity * trade.price * Math.pow(10, 8));
    let msg = `Order: ${trade.side} ${trade.quantity} ${asset} for ${baseAmount} ${base} ${ext}`;
    push.sendTradeNotification(asset, base, trade.quantity, baseAmount, order.leader, order.follower, msg);
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
            let asset = trade.symbol.substring(0, 3);
            let base = trade.symbol.substring(3, 6);
            let baseAmount = utils.decimalFormat(8, trade.quantity * trade.price * Math.pow(10, 8));
            let msg = `Order: ${trade.side} ${trade.quantity} ${asset} by ${baseAmount} ${base}`;
            let title = 'Leader Transaction';
            try {
              let order = await exchange.newOrder(user.apiKey, user.apiSecret, trade);
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
        ex.subscribe(user.apiKey, user.apiSecret, user.address, onTrade);
        subscribedUsers[userKey] = true;
      }
    }
  }
  setTimeout(subscribe, subscriptionDelay);
}

subscribe();
