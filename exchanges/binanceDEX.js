const rp = require('request-promise');
const NanoCache = require('nano-cache');
const WebSocket = require('ws');
const BnbApiClient = require('@binance-chain/javascript-sdk');
const binance = require('./binance');

const exchange = {};
exchange.id = '0xb17a7ce0dec00000000000';
exchange.name = 'binance_dex';
exchange.info = undefined;

const mainnet = true;
let baseURL = 'https://dex.binance.org/'; /// api string
let baseURLWS = 'wss://dex.binance.org/api/ws/';
let prefix = 'bnb';
if (!mainnet) {
  baseURL = 'https://testnet-dex.binance.org/'; /// api string
  baseURLWS = 'wss://testnet-dex.binance.org/api/ws/';
  prefix = 'tbnb';
}

exchange.subscribe = function subscribe (apiKey, apiSecret, leaderAddress, callback) {
  function connect () {
    const conn = new WebSocket(baseURLWS + apiKey);
    conn.onmessage = onEvent;
    conn.onerror = onError;
    conn.onclose = connect; // Reconnect
  }

  function onEvent (evt) {
    console.log(evt.data);
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
  return { asset: assets[0], base: assets[1], precision: DEX_PRECISION, stepSize: 0.00000001, minNotional: 0 };
};

exchange.newOrder = async function newOrder (apiKey, apiSecret, order) {
  let privateKey = getPrivateKey(apiSecret);
  const addressFrom = BnbApiClient.crypto.getAddressFromPrivateKey(privateKey, prefix);
  const bnbClient = new BnbApiClient(baseURL);
  bnbClient.setPrivateKey(privateKey);
  bnbClient.initChain();

  let side = 0; // (1-Buy, 2-Sell)
  if (order.side === 'BUY') {
    side = 1;
  } else if (order.side === 'SELL') {
    side = 2;
  }
  const request = {
    method: 'GET',
    url: `${baseURL}api/v1/account/${addressFrom}/sequence`,
    transform: function (body, response, resolveWithFullResponse) {
      return JSON.parse(body);// Manual Transform Content-Type: application/json;charset=UTF-8
    },
  };
  const sequence = (await rp(request)).sequence;
  const timeInForce = 1; // GTC(Good Till Expire)
  const result = await bnbClient.placeOrder(
    addressFrom,
    order.symbol,
    side,
    order.price,
    order.quantity,
    sequence,
    timeInForce,
  );
  if (result.status === 200) {
    console.log('success', result.result[0].hash);
  } else {
    console.error('error', result);
    throw new Error(result);
  }
};

exchange.getPriceInUSD = async function getPriceInUSD (asset) {
  const request = {
    method: 'GET',
    url: `${baseURL}api/v1/ticker/24hr`,
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

exchange.validateKey = async function validateKey (apiKey, apiSecret, userType) {
  const addressFrom = BnbApiClient.crypto.getAddressFromPrivateKey(getPrivateKey(apiSecret), prefix);
  let error = addressFrom !== apiKey;
  return error;
};

exchange.balance = async function balance (apiKey, apiSecret) {
  try {
    let address = apiKey;
    const request = {
      method: 'GET',
      url: `${baseURL}api/v1/account/${address}`,
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

function getPrivateKey (apiSecret) {
  let words = apiSecret.split(' ');
  const mnemonicWords = 24;
  let privateKey = apiSecret;
  if (words.length === mnemonicWords) {
    privateKey = BnbApiClient.crypto.getPrivateKeyFromMnemonic(apiSecret); // From mneomnic
  }
  return privateKey;
}

module.exports = exchange;
