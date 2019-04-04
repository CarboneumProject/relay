const BigNumber = require('bignumber.js');
const redis = require('redis');
const client = redis.createClient();
const config = require('./config');
const network = config.getNetwork();
client.select(network.redisDB);

const Order = require('./models/order');
const User = require('./models/user');
const erc20 = require('./models/erc20');
const push = require('./models/push');
const socialTrading = require('./models/socialTradingContract');
const HDWalletProvider = require('truffle-hdwallet-provider');
const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);
const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || config.mnemonic,
  process.env.RPC_URL || `https://${network.name}.infura.io/v3/${process.env.INFURA_API_KEY}`,
);

const BENCHMARK_ALLOWANCE_C8 = new BigNumber(10 ** 18).mul(10000);
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
          let provider = infuraProvider(process.env.NETWORK || network.name);
          let allowance = await erc20.allowance(
            provider,
            network.carboneum,
            follower,
            network.socialtrading,
          );
          let c8Balance = await erc20.balance(provider, network.carboneum, follower);
          provider.engine.stop();
          if ((new BigNumber(c8Balance)).gt(0)) {
            if ((new BigNumber(allowance)).gt(BENCHMARK_ALLOWANCE_C8)) {
              let user = await User.find(follower, exchange.name);
              if (user !== null) {
                try {
                  let order = await exchange.newOrder(user.apiKey, user.apiSecret, trade);
                  let copyOrder = {
                    leader: leader,
                    follower: follower,
                    leaderTxHash: txHash,
                    orderHash: exchange.id + order.orderId,
                  };
                  await Order.insertNewOrder(copyOrder);
                  let msg = '\nFollowing your leader, your order is placing.';
                  let title = 'Leader Transaction';
                  push.sendMsgToUser(follower, title, msg);
                } catch (e) {
                  let asset = trade.symbol.substring(0, 3);
                  let base = trade.symbol.substring(3, 6);
                  if (trade.side === 'BUY') {
                    asset = base;
                  }
                  let title = 'Leader Transaction';
                  let msg = `\nYour balance of ${asset} in your ${exchange.name.toUpperCase()} account is not enough.`;
                  push.sendMsgToUser(follower, title, msg);
                }
              } else {
                // Notify user to register API KEY.
              }
            } else {
              // Inform user to Adjust allowance
              let msg = 'Please adjust allowance of C8 for be able to transfer a token.';
              push.sendAdjustC8Allowance(follower, msg);
            }
          } else {
            let msg = 'To start Copytrading, please deposit C8 to your Ethereum Wallet.';
            let title = 'Insufficient C8 token';
            push.sendMsgToUser(follower, title, msg);
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
