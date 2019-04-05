const { promisify } = require('es6-promisify');
const Binance = require('node-binance-api');
const exchange = {};
exchange.id = '0xb17a7ce00000000';
exchange.name = 'binance';

exchange.subscribe = function subscribe (apiKey, apiSecret, leaderAddress, callback) {
  let binance = new Binance();
  binance.options({
    APIKEY: apiKey,
    APISECRET: apiSecret,
    useServerTime: true,
  });
  binance.websockets.userData((account) => {
  }, (report) => {
    if (report.x === 'NEW') { // TODO Change this to 'TRADE' status.
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
  let binance = new Binance();
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
  let binance = new Binance();
  binance.options({
    APIKEY: apiKey,
    APISECRET: apiSecret,
    useServerTime: true,
  });
  let orderPromise = promisify(binance.order);
  return orderPromise(order.side, order.symbol, order.quantity, order.price, {});
};

module.exports = exchange;
