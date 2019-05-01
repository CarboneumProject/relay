const rp = require('request-promise');
const NanoCache = require('nano-cache');
const WebSocket = require('ws');
const binance = require('./binance');
const exchange = {};
exchange.id = '0xb17a7ce0dec00000000000';
exchange.name = 'binance_dex';
exchange.info = undefined;

exchange.subscribe = function subscribe (apiKey, apiSecret, leaderAddress, callback) {
  function connect () {
    const conn = new WebSocket('wss://dex.binance.org/api/ws/' + apiKey);
    conn.onmessage = onEvent;
    conn.onerror = onError;
  }

  function onEvent (evt) {
    if (evt.stream === 'orders') {
      for (let report of evt.data) {
        if (report.e === 'executionReport' && report.z === report.q) { // Is trade event and all filled.
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
      }
    }
  }

  function onError (evt) {
    console.error('an error occurred', evt.data);
    // Reconnect
    connect();
  }

  connect();
};

exchange.getAssetsBySymbol = async function getAssetsBySymbol (symbol) {
  let assets = symbol.split('_');
  const DEX_PRECISION = 8;
  return { asset: assets[0], base: assets[1], precision: DEX_PRECISION };
};

exchange.newOrder = async function newOrder (apiKey, apiSecret, order) {
  // TODO sign and send order.
};

exchange.getPriceInUSD = async function getPriceInUSD (asset) {
  const request = {
    method: 'GET',
    url: 'https://dex.binance.org/api/v1/ticker/24hr',
    transform: function (body, response, resolveWithFullResponse) {
      return JSON.parse(body);// Manual Transform Content-Type: application/json;charset=UTF-8
    },
  };
  let ticker = NanoCache.get('ticker');
  if (ticker === null) {
    ticker = await rp(request);
    NanoCache.set(ticker, 1000);
  }
  let last = 0;
  if (asset === 'BNB') {
    last = 1;
  } else {
    for (let tick of ticker) {
      if (tick.symbol === `${asset}_BNB`) {
        last = parseFloat(tick.lastPrice);
      }
    }
  }

  let bnbPriceInUSD = await binance.getPriceInUSD('BNB');
  let price = last * bnbPriceInUSD;
  return price;
};

exchange.getC8LastPrice = async function getC8LastPrice () { // TODO use exchange's C8 price when it listed.
  return binance.getC8LastPrice();
};

exchange.validateKey = async function validateKey (apiKey, apiSecret) {
  return false;
};

exchange.balance = async function balance (apiKey, apiSecret) {
  try {
    let address = apiKey;
    const request = {
      method: 'GET',
      url: `https://dex.binance.org/api/v1/account/${address}`,
      transform: function (body, response, resolveWithFullResponse) {
        return JSON.parse(body);// Manual Transform Content-Type: application/json;charset=UTF-8
      },
    };
    let response = await rp(request);
    let balanceNoZero = {};
    for (let coin of response.balances) {
      let all = parseFloat(coin.free) + parseFloat(coin.locked) + parseFloat(coin.frozen);
      balanceNoZero[coin.symbol] = {
        available: coin.free,
        onOrder: coin.locked,
        frozen: coin.frozen,
        valueUSD: ((await exchange.getPriceInUSD(coin.symbol)) * all).toFixed(8),
      };
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
