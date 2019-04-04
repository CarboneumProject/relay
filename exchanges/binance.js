const { promisify } = require('es6-promisify');

const exchange = {};
exchange.id = '0xb17a7ce00000000';
exchange.name = 'binance';

exchange.subscribe = function subscribe (apiKey, apiSecret, leaderAddress, callback) {
  const binance = require('node-binance-api')().options({
    APIKEY: apiKey,
    APISECRET: apiSecret,
    useServerTime: true,
  });
  binance.websockets.userData((account) => {
  }, (report) => {
    if (report.x === 'NEW') {
      let trade = {
        id: report.i,
        symbol: report.s,
        side: report.S,
        quantity: report.q,
        price: report.p,
      };
      callback(exchange, leaderAddress, trade);
    }
  });
};

exchange.listAllSymbol = async function listAllSymbol () {
  const binance = require('node-binance-api')();
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

exchange.newOrder = async function newOrder (apiKey, apiSecret, order) {
  const binance = require('node-binance-api')().options({
    APIKEY: apiKey,
    APISECRET: apiSecret,
    useServerTime: true,
  });
  let buy = promisify(binance.buy);
  let sell = promisify(binance.sell);
  let data = '';
  if (order.side === 'BUY') {
    data = await buy(order.symbol, order.quantity, order.price);
  } else {
    data = await sell(order.symbol, order.quantity, order.price);
  }
  return data;
};

module.exports = exchange;
