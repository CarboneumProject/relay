const mysql = require('./mysql');
const config = require('../config');
const erc20 = require('../models/erc20');
const push = require('../models/push');
const BigNumber = require('bignumber.js');
const network = config.getNetwork();
const HDWalletProvider = require('truffle-hdwallet-provider');
const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);
const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || config.mnemonic,
  process.env.RPC_URL || `https://${network.name}.infura.io/v3/${process.env.INFURA_API_KEY}`,
);
const BENCHMARK_ALLOWANCE_C8 = new BigNumber(10 ** 18).mul(10000);
const user = {};

user.register = async function register (address, exchange, apiKey, apiSecret, userType, fullname, email) {
  return mysql.query(`
      REPLACE INTO carboneum.user (address,
                                   exchange,
                                   apiKey,
                                   apiSecret,
                                   type,
                                   fullname,
                                   email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [address, exchange, apiKey, apiSecret, userType, fullname, email]);
};

user.find = async function find (address, exchange) {
  return (await mysql.query(`
      SELECT *
      FROM carboneum.user
      WHERE address = ?
        AND exchange = ?
  `, [address, exchange]))[0];
};

user.findLeader = async function find (address, exchange) {
  return (await mysql.query(`
      SELECT *
      FROM carboneum.user
      WHERE address = ?
        AND exchange = ?
        AND type = 'leader'
  `, [address, exchange]))[0];
};

user.findAllInExchange = async function findAllInExchange (exchange) {
  return mysql.query(`
      SELECT *
      FROM carboneum.user
      WHERE exchange = ?
  `, [exchange]);
};

user.findAllFollowInExchange = async function findAllFollowInExchange (exchange, followers) {
  return mysql.query(`
      SELECT *
      FROM carboneum.user
      WHERE exchange = ? AND address IN (?)
  `, [exchange, followers]);
};

user.availableC8 = async function availableC8 (address) {
  let provider = infuraProvider(process.env.NETWORK || network.name);
  let allowance = await erc20.allowance(
    provider,
    network.carboneum,
    address,
    network.socialtrading,
  );
  let c8Balance = await erc20.balance(provider, network.carboneum, address);
  provider.engine.stop();
  return { balance: new BigNumber(c8Balance), allowance: new BigNumber(allowance) };
};

user.checkAvailableC8 = async function checkAvailableC8 (address) {
  let c8Available = await user.availableC8(address);
  if (c8Available.balance.gt(0)) {
    if (!c8Available.allowance.gt(BENCHMARK_ALLOWANCE_C8)) {
      // Inform user to Adjust allowance
      let msg = 'Please adjust allowance of C8 for be able to transfer a token.';
      push.sendAdjustC8Allowance(address, msg);
    }
  } else {
    let msg = 'To start Copytrading, please deposit C8 to your Ethereum Wallet.';
    let title = 'Insufficient C8 token';
    push.sendMsgToUser(address, title, msg);
  }
};

module.exports = user;
