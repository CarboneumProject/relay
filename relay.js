const Web3 = require('web3');
const abi = require('./abi/socialtrading/SocialTrading.json');
const config = require('./config');
const network = config.getNetwork();

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(network.ws_url),
);

const c8Contract = new web3.eth.Contract(
  abi,
  network.socialtrading,
);

c8Contract.events.Follow({}, (error, event) => {
  const redis = require('redis');
  const client = redis.createClient();
  client.select(network.redis_db);
  if (error) return console.error(error);

  if (event.event === 'Follow' && event.removed === false) {
    let leader = event.returnValues.leader.toLowerCase();
    let follower = event.returnValues.follower.toLowerCase();
    let percentage = event.returnValues.percentage / 10 ** 18;
    console.log('Successfully followed!', { leader, follower, percentage });
    client.hset('leader:' + leader, follower, percentage);
    client.hset('lastBlock', 'eventFollow', event.blockNumber);
    client.quit();
  }
}).on('error', function (error) {
  console.log('error: ', error);
  process.exit();
});

c8Contract.events.UnFollow({}, (error, event) => {
  const redis = require('redis');
  const client = redis.createClient();
  client.select(network.redis_db);
  if (error) return console.error(error, 'sad');
  if (event.event === 'UnFollow' && event.removed === false) {
    let leader = event.returnValues.leader.toLowerCase();
    let follower = event.returnValues.follower.toLowerCase();
    console.log('Successfully unfollowed!', { leader, follower });
    client.hdel('leader:' + leader, follower);
    client.hset('lastBlock', 'eventUnfollow', event.blockNumber);
    client.quit();
  }
}).on('error', function (error) {
  console.log('error: ', error);
  process.exit();
});
