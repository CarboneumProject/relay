const exchange = {};
const BigNumber = require('bignumber.js');
const rp = require('request-promise');
const okex = require('../models/okex');
const pako = require('pako');
const WebSocket = require('ws');

exchange.id = '0x014ec0000000000000000';
exchange.name = 'okex';
exchange.info = undefined;
const OKEX_WS_URL = 'wss://real.okex.com:8443/ws/v3';

async function connect (apiKey, apiSecret, leaderAddress, passphrase, callback) {
  const ws = new WebSocket(OKEX_WS_URL);
  let timestamp = await okex.getServerTime('epoch');
  let signed = okex.generateSign('GET', '/users/self/verify', '', apiSecret, timestamp);

  ws.onopen = function () {
    ws.send(`{"op":"login","args":["${apiKey}","${passphrase}","${timestamp}","${signed}"]}`, (x) => {
      setTimeout(() => ws.send('{"op": "subscribe", "args": ["spot/order:*"]}'), 80);
    });
  };

  ws.onmessage = function (e) {
    if (e.data instanceof String) {} else {
      try {
        let reports = JSON.parse(pako.inflateRaw(e.data, { to: 'string' }));
        if (reports.data) {
          let report = (reports.data)[0];
          if (report.state === '1' || report.state === '2') {
            let trade = {
              id: report.order_id,
              symbol: report.instrument_id,
              side: (report.side).toUpperCase(),
              quantity: report.last_fill_qty * 1,
              price: report.last_fill_px * 1,
              time: report.timestamp,
            };

            setTimeout(callback.bind(null, exchange, leaderAddress, trade), 200);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
    console.log();
  };

  ws.onclose = function (e) {
    console.log('Socket is closed. Reconnect will be attempted in 0.01 second.\n', e.reason);
    setTimeout(function () {
      connect(apiKey, apiSecret, leaderAddress, passphrase, callback);
    }, 10);
  };

  ws.onerror = function (err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    ws.close();
  };
}

exchange.subscribe = function subscribe (apiKey, apiSecret, leaderAddress, passphrase, callback) {
  connect(apiKey, apiSecret, leaderAddress, passphrase, callback);
};

exchange.getAssetsBySymbol = async function getAssetsBySymbol (symbol) {
  let exchangeInfo = await exchange.listAllSymbol();
  let asset = exchangeInfo[symbol].base_currency;
  let base = exchangeInfo[symbol].quote_currency;
  let precision = 8;
  let stepSize = exchangeInfo[symbol].size_increment * 1;
  let minNotional = exchangeInfo[symbol].min_size * 1;
  return { asset: asset, base: base, precision: precision, stepSize: stepSize, minNotional: minNotional };
};

exchange.listAllSymbol = async function listAllSymbol () {
  if (exchange.info === undefined) {
    let data = await okex.instruments();
    let symbols = {};
    for (let obj of data) {
      symbols[obj.instrument_id] = obj;
    }
    exchange.info = symbols;
    return symbols;
  } else {
    return exchange.info;
  }
};

exchange.newOrder = async function newOrder (apiKey, apiSecret, order, passphrase) {
  let params = {
    pair: order.symbol, // 'BTC-USDT',
    side: (order.side).toLowerCase(), // 'buy',
    volume: order.quantity * 1, // 0.001,
    price: order.price * 1, // 0.1,
  };

  let orderSent = await okex.placeOrder(params, apiKey, apiSecret, passphrase);
  if (orderSent) {
    if (orderSent.result === true) {
      return {
        orderId: orderSent.order_id,
        transactTime: new Date(),
      };
    } else {
      throw new Error(orderSent.error_message);
    }
  } else {
    throw new Error('unknown error');
  }
};

exchange.getPriceInUSD = async function getPriceInUSD (asset) {
  try {
    let usds = [
      'USDT',
      'PAX',
      'TUSD',
      'USDC',
      'USDS',
    ];

    // USD base at same price.
    if (usds.includes(asset.toUpperCase())) {
      return 1.0;
    }

    if (asset.includes('-')) {
      let [, base] = asset.split('-');
      if (usds.includes(base.toUpperCase())) {
        return (await okex.tradingPair(asset)).last;
      } else {
        let pairPrice = (await okex.tradingPair(asset)).last;
        let basePrice = (await okex.tradingPair(`${base}-${usds[0]}`)).last;
        return pairPrice * basePrice;
      }
    } else {
      return (await okex.tradingPair(`${asset}-${usds[0]}`)).last;
    }
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

exchange.validateKey = async function validateKey (apiKey, apiSecret, userType, passphrase) {
  let params = {
    pair: 'BTC-USDT',
    price: 0.1,
    volume: 0.001,
    side: 'buy',
  };
  let order = await okex.placeOrder(params, apiKey, apiSecret, passphrase);
  if (order) {
    if (order.result === true) {
      params.orderId = order.order_id;
      okex.cancelOrder(params, apiKey, apiSecret, passphrase).then();
    }
    return false;
  } else {
    return true;
  }
};

exchange.balance = async function balance (apiKey, apiSecret, passphrase) {
  try {
    let balancesTemp = await okex.accountInformation(apiKey, apiSecret, passphrase);
    let balances = {};
    const balanceNoZero = {};
    let valuesPromises = [];
    let coins = [];
    Object.keys(balancesTemp).forEach(function (base) {
      balances[balancesTemp[base].currency] = {
        available: balancesTemp[base].available,
        onOrder: balancesTemp[base].hold,
      };
    });

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
