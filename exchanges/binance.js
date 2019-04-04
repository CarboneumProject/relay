const { promisify } = require('es6-promisify');

const exchange = {};
exchange.name = 'binance';

exchange.subscribe = function subscribe (apiKey, apiSecret, leaderAddress, callback) {
  let binance = require('node-binance-api')().options({
    APIKEY: apiKey,
    APISECRET: apiSecret,
    useServerTime: true,
  });
  binance.websockets.userData((account) => {
  }, (report) => {
    if (report.x === 'TRADE') {
      let trade = {
        id: report.i,
        symbol: report.s,
        side: report.S,
        amount: report.q,
        price: report.p,
      };
      callback(leaderAddress, trade);
    }
  });
};

exchange.listAllSymbol = async function listAllSymbol () {
  let binance = require('node-binance-api')();
  let exchangeInfo = promisify(binance.exchangeInfo);
  let data = await exchangeInfo();
  let symbols = [];
  for (let obj of data.symbols) {
    if (obj.status === 'TRADING') {
      symbols.push(obj.symbol);
    }
  }
  return symbols;
};

exchange.newOrder = async function newOrder (order) {
  let binance = require('node-binance-api')();
  let exchangeInfo = promisify(binance.exchangeInfo);
  let data = await exchangeInfo();
  let symbols = [];
  for (let obj of data.symbols) {
    if (obj.status === 'TRADING') {
      symbols.push(obj.symbol);
    }
  }
  return symbols;
};

module.exports = exchange;
