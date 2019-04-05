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

const exchanges = ['binance'];
const tradeExchange = [];
for (let i = 0; i < exchanges.length; i++) {
  tradeExchange.push(require(`./exchanges/${exchanges[i]}`));
}

const onTrade = async function (exchange, leader, trade) {
  let txHash = exchange.id + trade.id;
  let order = await Order.find(txHash);
  if (order !== undefined) {
    // Trade from this relay.
    if (trade.side === 'BUY') {
      // TODO Save our trade
    } else {
      // TODO deduct amount of asset when
    }

    // Distribute reward and fee.
    // TODO change to profit share model.
    socialTrading.distributeRewardOne(
      order.leader,
      order.follower,
      network.REWARD,
      network.FEE,
      [order.leader_tx_hash, '0x', order.tx_hash, '0x'],
    );
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
            if (trade.side === 'BUY') {
              asset = base;
            }
            let baseAmount = utils.decimalFormat(8, trade.quantity * trade.price * Math.pow(10, 8));
            let msg = `Order: ${trade.side} ${trade.quantity} ${asset} by ${baseAmount} ${base}`;
            let title = 'Leader Transaction';
            try {
              let order = await exchange.newOrder(user.apiKey, user.apiSecret, trade);
              let copyOrder = {
                leader: leader,
                follower: follower,
                leaderTxHash: txHash,
                orderHash: exchange.id + order.orderId,
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

async function run () {
  for (let ex of tradeExchange) {
    let users = await User.findAllInExchange(ex.name);
    for (let user of users) {
      ex.subscribe(user.apiKey, user.apiSecret, user.address, onTrade);
    }
  }
}

run();
