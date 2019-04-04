const erc20 = {};

const Web3 = require('web3');
const erc20ABI = require('../abi/ERC20/token.json');

erc20.transfer = async function transfer (provider, tokenAddress, to, value) {
  let web3Sign = new Web3(provider);
  let erc20ContractSign = new web3Sign.eth.Contract(
    erc20ABI,
    tokenAddress,
  );
  let gasPrice = await web3Sign.eth.getGasPrice();
  return erc20ContractSign.methods.transfer(to, value).send({
    from: provider.addresses[0],
    value: 0,
    gasLimit: 210000,
    gasPrice: gasPrice,
  });
};

erc20.approve = async function approve (provider, tokenAddress, spender, value) {
  try {
    let web3Sign = new Web3(provider);
    let erc20ContractSign = new web3Sign.eth.Contract(
      erc20ABI,
      tokenAddress,
    );
    let gasPrice = await web3Sign.eth.getGasPrice();
    return await erc20ContractSign.methods.approve(spender, value).send({
      from: provider.addresses[0],
      value: 0,
      gasLimit: 210000,
      gasPrice: gasPrice,
    });
  } catch (error) {
    console.log(error, ' error');
    return error.message;
  }
};

erc20.allowance = async function allowance (provider, tokenAddress, owner, spender) {
  try {
    let web3Sign = new Web3(provider);
    let erc20ContractSign = new web3Sign.eth.Contract(
      erc20ABI,
      tokenAddress,
    );
    return await erc20ContractSign.methods.allowance(owner, spender).call();
  } catch (error) {
    console.log(error, ' error');
    return error;
  }
};

erc20.balance = async function balance (provider, tokenAddress, owner) {
  try {
    let web3Sign = new Web3(provider);
    let erc20ContractSign = new web3Sign.eth.Contract(
      erc20ABI,
      tokenAddress,
    );
    return await erc20ContractSign.methods.balanceOf(owner).call();
  } catch (error) {
    console.log(error, ' error');
    return 0;
  }
};

erc20.etherTokenAddress = '0x0000000000000000000000000000000000000000';

module.exports = erc20;
