const HDWalletProvider = require('truffle-hdwallet-provider');
const SocialTradingABI = require('../abi/socialtrading/SocialTrading');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');
const config = require('../config');
const network = config.getNetwork();
const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);
const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || config.mnemonic,
  process.env.RPC_URL || `https://${network.name}.infura.io/${process.env.INFURA_API_KEY}`,
);

const contractAddress = network.socialtrading;
const socialTrading = {};

socialTrading.distributeRewardAll = async function (rewards) {
  const provider = infuraProvider(process.env.NETWORK || network.name);
  let w3 = new Web3(provider);
  let socialTradingContract = new w3.eth.Contract(
    SocialTradingABI,
    contractAddress,
  );
  let gasPrice = await w3.eth.getGasPrice();
  for (let i = 0; i < rewards.length; i++) {
    if (rewards[i].C8FEE.eq(new BigNumber(0))) { // No fee to distribute
      continue;
    }
    try {
      await socialTradingContract.methods.distributeReward(
        rewards[i].leader,
        rewards[i].follower,
        rewards[i].reward,
        rewards[i].relayFee,
        rewards[i].orderHashes,
      ).send({
        from: provider.addresses[0],
        value: 0,
        gasLimit: 310000,
        gasPrice: gasPrice,
      });
    } catch (error) {
      console.log(error.message, ' error!!');
    }
  }
};

socialTrading.distributeRewardOne = async function (
  leader,
  follower,
  reward,
  relayFee,
  orderHashes,
) {
  const provider = infuraProvider(process.env.NETWORK || network.name);
  let w3 = new Web3(provider);
  let socialTradingContract = new w3.eth.Contract(
    SocialTradingABI,
    contractAddress,
  );
  let gasPrice = await w3.eth.getGasPrice();
  try {
    await socialTradingContract.methods.distributeReward(
      leader,
      follower,
      reward,
      relayFee,
      orderHashes,
    ).send({
      from: provider.addresses[0],
      value: 0,
      gasLimit: 310000,
      gasPrice: gasPrice,
    });
  } catch (error) {
    console.log(error.message, ' error!!');
  }
};

module.exports = socialTrading;
