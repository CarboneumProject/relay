const BigNumber = require('bignumber.js');
const redis = require('redis');
const client = redis.createClient();
const config = require('./config');
const network = config.getNetwork();
client.select(network.redisDB);

const Leader = require('./models/user');
const erc20 = require('./models/erc20');
const push = require('./models/push');
const HDWalletProvider = require('truffle-hdwallet-provider');
const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);
const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || config.mnemonic,
  process.env.RPC_URL || `https://${network.name}.infura.io/${process.env.INFURA_API_KEY}`,
);

const BENCHMARK_ALLOWANCE_C8 = new BigNumber(10 ** 18).mul(10000);
const exchanges = ['binance'];
const tradeExchange = [];
for (let i = 0; i < exchanges.length; i++) {
  tradeExchange.push(require(`./exchanges/${exchanges[i]}`));
}

const onTrade = async function (leader, trade) {
  console.log(leader, trade);
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
            // TODO process trade order.
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
};

async function run () {
  for (let ex of tradeExchange) {
    let leaders = await Leader.findAllInExchange(ex.name);
    for (let leader of leaders) {
      ex.subscribe(leader.apiKey, leader.apiSecret, leader.address, onTrade);
    }
  }
}

run();
