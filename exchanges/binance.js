const { promisify } = require('es6-promisify');
const Binance = require('node-binance-api');
const BigNumber = require('bignumber.js');
const rp = require('request-promise');
const exchange = {};
exchange.id = '0xb17a7ce00000000000000';
exchange.name = 'binance';
exchange.info = undefined;

exchange.subscribe = function subscribe (apiKey, apiSecret, leaderAddress, callback) {
  let binance = new Binance();
  binance.options({
    APIKEY: apiKey,
    APISECRET: apiSecret,
    useServerTime: true,
  });
  binance.websockets.userData((account) => {
  }, (report) => {
    if (report.x === 'TRADE' && report.z === report.q) { // Is trade event and all filled.
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

exchange.getAssetsBySymbol = async function getAssetsBySymbol (symbol) {
  let exchangeInfo = await exchange.listAllSymbol();
  let asset = exchangeInfo[symbol].baseAsset;
  let base = exchangeInfo[symbol].quoteAsset;
  let precision = exchangeInfo[symbol].baseAssetPrecision;
  let stepSize = 0;
  for (let f of exchangeInfo[symbol].filters) {
    if (f.filterType === 'LOT_SIZE') {
      stepSize = parseFloat(f.stepSize);
    }
  }
  return { asset: asset, base: base, precision: precision, stepSize: stepSize };
};

exchange.listAllSymbol = async function listAllSymbol () {
  if (exchange.info === undefined) {
    let binance = new Binance();
    let exchangeInfo = promisify(binance.exchangeInfo);
    let data = await exchangeInfo();
    let symbols = {};
    for (let obj of data.symbols) {
      if (obj.status === 'TRADING') {
        symbols[obj.symbol] = obj;
      }
    }
    exchange.info = symbols;
    return symbols;
  } else {
    return exchange.info;
  }
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

exchange.getPriceInUSD = async function getPriceInUSD (asset) {
  try {
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
  } catch (e) {
    return null;
  }
};

exchange.getC8LastPrice = async function getC8LastPrice () { // TODO use exchange's C8 price when it listed.
  const lastPrice = await {
    method: 'POST',
    url: 'https://api.idex.market/returnTicker',
    json:
      {
        'market': 'ETH_C8',
      },
  };
  let ticker = await rp(lastPrice);
  let ethUSD = await exchange.getPriceInUSD('ETH');
  return new BigNumber((ticker.last * ethUSD).toFixed(8));
};

exchange.validateKey = async function validateKey (apiKey, apiSecret, userType) {
  try {
    let binance = new Binance();
    binance.options({
      APIKEY: apiKey,
      APISECRET: apiSecret,
      useServerTime: true,
      test: true, // TEST CAN TRADE
    });
    if (userType === 'leader') {
      let balance = promisify(binance.balance);
      await balance();
      return false;
    } else {
      let order = promisify(binance.order);
      await order('BUY', 'ETHBTC', 0.04600000, 0.032821, {});
      return false;
    }
  } catch (e) {
    if ('message' in e) {
      return e.message;
    }
    return JSON.parse(e.body).msg;
  }
};

exchange.balance = async function balance (apiKey, apiSecret) {
  try {
    let binance = new Binance();
    binance.options({
      APIKEY: apiKey,
      APISECRET: apiSecret,
      useServerTime: true,
    });
    let balance = promisify(binance.balance);
    let balances = await balance();
    const balanceNoZero = {};
    let valuesPromises = [];
    let coins = [];
    for (let coin in balances) {
      if (balances.hasOwnProperty(coin)) {
        let all = parseFloat(balances[coin].available) + parseFloat(balances[coin].onOrder);
        if (all > 0.0) {
          balanceNoZero[coin] = {
            available: balances[coin].available,
            onOrder: balances[coin].onOrder,
            all: all,
          };
          coins.push(coin);
          valuesPromises.push(exchange.getPriceInUSD(coin));
        }
      }
    }
    let values = await Promise.all(valuesPromises);
    for (let i = 0; i < coins.length; i++) {
      balanceNoZero[coins[i]].valueUSD = (values[i] * balanceNoZero[coins[i]].all).toFixed(8);
      delete balanceNoZero[coins[i]].all;
    }
    return balanceNoZero;
  } catch (e) {
    if ('message' in e) {
      return e.message;
    }
    return JSON.parse(e.body).msg;
  }
};

module.exports = exchange;
