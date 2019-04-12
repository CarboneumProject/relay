const Web3 = require('web3');
const abi = require('./abi/socialtrading/SocialTrading.json');
const config = require('./config');
const network = config.getNetwork();

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(network.wsUrl),
);

const c8Contract = new web3.eth.Contract(
  abi,
  network.socialtrading,
);

// block number when contract created. (rinkeby:3706658)
c8Contract.getPastEvents({
  fromBlock: 3706658,
  toBlock: 'latest',
}, (error, eventResult) => {
  if (error) {
    console.log('Error in myEvent event handler: ' + error);
  }
  const redis = require('redis');
  const client = redis.createClient();
  client.select(network.redisDB);

  for (let i = 0; i < eventResult.length; i++) {
    let event = eventResult[i];
    if (event.event === 'Follow' && event.removed === false) {
      let leader = event.returnValues.leader.toLowerCase();
      let follower = event.returnValues.follower.toLowerCase();
      let percentage = event.returnValues.percentage / 10 ** 18;
      client.hset('leader:' + leader, follower, percentage);
      console.log('[add] leader:' + leader, follower, percentage, i);
    } else if (event.event === 'UnFollow' && event.removed === false) {
      let leader = event.returnValues.leader.toLowerCase();
      let follower = event.returnValues.follower.toLowerCase();
      client.hdel('leader:' + leader, follower);
      console.log('[delete] leader:' + leader, follower, i);
    }
  }
  let lastBlockNumber = '0';
  for (let i = 0; i < eventResult.length; i++) {
    lastBlockNumber = (++eventResult[i].blockNumber).toString();
  }
  console.log('lastBlockNumber', lastBlockNumber);
});
