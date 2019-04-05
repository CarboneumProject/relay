const utils = {};
const numeral = require('numeral');
const util = require('ethereumjs-util');

utils.decimalFormat = function decimalFormat (decimal, amount) {
  if (decimal <= 4) {
    return numeral(amount / Math.pow(10, decimal)).format('0,0.0000');
  } else {
    let repeatDecimal = '0'.repeat(decimal - 4);
    return numeral(amount / Math.pow(10, decimal)).format(`0,0.0000[${repeatDecimal}]`);
  }
};

utils.tradeTx = function tradeTx (id, orderID) {
  return util.bufferToHex(util.setLengthLeft(id + orderID, 32));
};

module.exports = utils;
