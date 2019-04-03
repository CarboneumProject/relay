const utils = {};
const numeral = require('numeral');

utils.decimalFormat = function decimalFormat (decimal, amount) {
  if (decimal <= 4) {
    return numeral(amount / Math.pow(10, decimal)).format('0,0.0000');
  } else {
    let repeatDecimal = '0'.repeat(decimal - 4);
    return numeral(amount / Math.pow(10, decimal)).format(`0,0.0000[${repeatDecimal}]`);
  }
};

module.exports = utils;
