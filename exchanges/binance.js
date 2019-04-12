const { promisify } = require('es6-promisify');
const Binance = require('node-binance-api');
const exchange = {};
exchange.id = '0xb17a7ce00000000000000';
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
    if (report.x === 'TRADE') {
      let trade = {
        id: report.i,
        symbol: report.s,
        side: report.S,
        quantity: report.q,
        price: report.p,
      };
      // To wait database save order before if it is market order
      setTimeout(callback.bind(null, exchange, leaderAddress, trade), 200);
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

exchange.getPriceInUSD = async function newOrder (asset) {
  let binance = new Binance();
  let prices = promisify(binance.prices);
  let usds = [
    'USDT',
    'PAX',
    'TUSD',
    'USDC',
    'USDS',
  ];

  // USD base at same price.
  if (usds.includes(asset)) {
    return 1.0;
  }

  // Use USDT base first if available.
  try {
    let usdPair = `${asset}${usds[0]}`;
    let price = await prices(usdPair);
    return price[usdPair];
  } catch (e) {
    // console.log(e.body);
  }

  // Converse from BTC pair.
  let priceBTCUSCT = await prices('BTCUSDT');
  let priceASSETBTC = await prices(`${asset}BTC`);
  let price = priceBTCUSCT.BTCUSDT * priceASSETBTC[`${asset}BTC`];
  return price;
};

module.exports = exchange;
