const okex = {};
const CryptoJS = require('crypto-js');
const axios = require('axios');
let apiURL = 'https://www.okex.com';

okex.getServerTime = function (type = 'iso') {
  return axios({
    method: 'get',
    url: apiURL + '/api/general/v3/time',
    headers: {},
  })
    .then(function (response) {
      return response.data[type];
    }).catch((err) => {
      return [];
    });
};

okex.instruments = function () {
  return axios({
    method: 'get',
    url: apiURL + '/api/spot/v3/instruments',
    headers: {},
  })
    .then(function (response) {
      return response.data;
    }).catch((err) => {
      return [];
    });
};

okex.tradingPair = function (pair) {
  return axios({
    method: 'get',
    url: apiURL + `/api/spot/v3/instruments/${pair}/ticker`,
    headers: {},
  })
    .then(function (response) {
      return response.data;
    }).catch((err) => {
      return null;
    });
};

okex.generateSign = function (method = 'GET', requestPath, body = '{}', apiSecret, timestamp) {
  // console.log(timestamp + method + requestPath + body);
  return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(timestamp + method + requestPath + body, apiSecret));
};

okex.accountInformation = async function (apiKey, apiSecret, passphrase) {
  let timestamp = await okex.getServerTime();
  let method = 'GET';
  let requestPath = '/api/spot/v3/accounts';
  let body = '{}';
  let signed = okex.generateSign(method, requestPath, body, apiSecret, timestamp);

  return axios({
    method: method,
    url: apiURL + requestPath,
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signed,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
    },
    data: JSON.parse(body),
  })
    .then(function (response) {
      return response.data;
    }).catch((err) => {
      console.log(err.response.status);
      console.log(err.response.data);
      switch (err.response.data.code) {
      case 30001:
      case 30006:
        throw new Error('API-key format invalid.');
      case 30002:
      case 30013:
        throw new Error('Signature for this request is not valid.');
      case 30004:
      case 30015:
        throw new Error('Invalid OK_ACCESS_PASSPHRASE');
      default:
        throw new Error(err.response.data.message);
      }
    });
};

okex.getCurrency = async function (apiKey, apiSecret, passphrase) {
  let timestamp = await okex.getServerTime();
  let method = 'GET';
  let requestPath = '/api/spot/v3/accounts/btc';
  let body = '{}';

  let signed = okex.generateSign(method, requestPath, body, apiSecret, timestamp);
  return axios({
    method: method,
    url: apiURL + requestPath,
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signed,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
    },
    data: JSON.parse(body),
  })
    .then(function (response) {
      return response.data;
    }).catch((err) => {
      console.log(err.response.status);
      console.log(err.response.data);
      return [];
    });
};

okex.placeOrder = async function (params, apiKey, apiSecret, passphrase) {
  let timestamp = await okex.getServerTime();
  let method = 'POST';
  let requestPath = '/api/spot/v3/orders';
  let body = `{"type":"limit","side":"${params.side}","instrument_id":"${params.pair}","size":${params.volume},"price":"${params.price}","order_type":"0"}`;

  let signed = okex.generateSign(method, requestPath, body, apiSecret, timestamp);
  return axios({
    method: method,
    url: apiURL + requestPath,
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signed,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
    },
    data: JSON.parse(body),
  })
    .then(function (response) {
      return response.data;
    }).catch((err) => {
      console.log(err.response.status);
      console.log(err.response.data);
      return false;
    });
};

okex.cancelOrder = async function (params, apiKey, apiSecret, passphrase) {
  let timestamp = await okex.getServerTime();
  let method = 'POST';
  let requestPath = `/api/spot/v3/cancel_orders/${params.orderId}`;
  let body = `{"instrument_id":"${params.pair}"}`;

  let signed = okex.generateSign(method, requestPath, body, apiSecret, timestamp);
  return axios({
    method: method,
    url: apiURL + requestPath,
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signed,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
    },
    data: JSON.parse(body),
  })
    .then(function (response) {
      return response.data;
    }).catch((err) => {
      console.log(err.response.status);
      console.log(err.response.data);
      return [];
    });
};

module.exports = okex;
