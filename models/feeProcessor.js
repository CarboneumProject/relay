const BigNumber = require('bignumber.js');
const config = require('../config');
const network = config.getNetwork();
const PROFIT_PERCENTAGE = network.PROFIT_PERCENTAGE;

const feeProcessor = {};
feeProcessor.percentageFee = async function (openTrades, closeTrade, c8LastPrice) {
  let subAmountLeft = new BigNumber(closeTrade.amountMaker);
  let tokenSellLastPrice = new BigNumber(closeTrade.cost).div(closeTrade.amountMaker);
  let sumC8FEE = new BigNumber(0);
  let processedFees = [];
  let updateAmounts = [];

  // If openTrades.length === 0 (Start with short-sales token)
  let openedPosition = openTrades.length;
  if (openedPosition > 0) {
    for (let i = 0; i < openedPosition && subAmountLeft.gt(0); i++) {
      let openOrder = openTrades[i];
      let lastAmount = new BigNumber(openOrder.amountLeft);
      subAmountLeft = subAmountLeft.sub(lastAmount);
      let openPrice = new BigNumber(openOrder.cost).div(openOrder.amountMaker);
      const etherDecimals = 10 ** 18;
      let profit = new BigNumber(0);
      if (subAmountLeft.gte(0)) {
        updateAmounts.push({ 'amountLeft': '0', 'orderId': openOrder.id });
        profit = (tokenSellLastPrice.sub(openPrice)).mul(PROFIT_PERCENTAGE).mul(lastAmount);
      } else {
        updateAmounts.push({ 'amountLeft': subAmountLeft.abs().toFixed(18), 'orderId': openOrder.id });
        profit = (tokenSellLastPrice.sub(openPrice)).mul(PROFIT_PERCENTAGE).mul(lastAmount.add(subAmountLeft));
      }
      if (openPrice.lt(tokenSellLastPrice)) { // Has profit
        let reward = profit.div(c8LastPrice).mul(network.LEADER_REWARD_PERCENT).mul(etherDecimals).toFixed(0);
        let fee = profit.div(c8LastPrice).mul(network.SYSTEM_FEE_PERCENT).mul(etherDecimals).toFixed(0);
        let C8FEE = profit.div(c8LastPrice).mul(etherDecimals);
        sumC8FEE = sumC8FEE.add(C8FEE);
        processedFees.push({
          'C8FEE': C8FEE,
          'leader': closeTrade.leader,
          'follower': closeTrade.follower,
          'reward': reward,
          'relayFee': fee,
          'orderHashes': [openOrder.leaderTxHash,
            closeTrade.leaderTxHash,
            openOrder.txHash,
            closeTrade.txHash],
          'orderID': openOrder.id,
        });
      } else {
        processedFees.push({
          'C8FEE': new BigNumber(0),
          'leader': closeTrade.leader,
          'follower': closeTrade.follower,
          'reward': 0,
          'relayFee': 0,
          'orderHashes': [
            openOrder.leaderTxHash,
            closeTrade.leaderTxHash,
            openOrder.txHash,
            closeTrade.txHash,
          ],
          'orderID': openOrder.id,
        });
      }
    }
  } else {
    let reward = new BigNumber(network.REWARD);
    let fee = new BigNumber(network.FEE);
    let C8FEE = reward.add(fee);
    sumC8FEE = sumC8FEE.add(C8FEE);
    processedFees.push({
      'C8FEE': C8FEE,
      'leader': closeTrade.leader,
      'follower': closeTrade.follower,
      'reward': network.REWARD,
      'relayFee': network.FEE,
      'orderHashes': ['0x',
        closeTrade.leaderTxHash,
        '0x',
        closeTrade.txHash],
    });
  }
  return { 'processedFees': processedFees, 'updateAmounts': updateAmounts, 'sumFee': sumC8FEE };
};

feeProcessor.withdrawToken = async function (openTrades, withdrawAmount) {
  let subAmountLeft = new BigNumber(withdrawAmount);// withdraw token
  let updateAmounts = [];

  let openedPosition = openTrades.length;
  if (openedPosition > 0) {
    for (let i = 0; i < openedPosition && subAmountLeft.gt(0); i++) {
      let openOrder = openTrades[i];
      let lastAmount = new BigNumber(openOrder.amountLeft);
      subAmountLeft = subAmountLeft.sub(lastAmount);

      if (subAmountLeft.gte(0)) {
        updateAmounts.push({ 'amountLeft': '0', 'orderId': openOrder.id });
      } else {
        updateAmounts.push({ 'amountLeft': subAmountLeft.abs().toFixed(0), 'orderId': openOrder.id });
      }
    }
  }
  return { 'updateAmounts': updateAmounts };
};

module.exports = feeProcessor;
