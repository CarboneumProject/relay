const Web3 = require('web3');
const config = require('../config');
const network = config.getNetwork();
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(network.wsUrl),
);

module.exports = (signature) => {
  let recover = web3.eth.accounts.recover('Sign into carboneum', signature).toLowerCase();
  web3.currentProvider.connection.close();

  return recover;
};
