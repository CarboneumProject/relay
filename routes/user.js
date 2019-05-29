const express = require('express');
const validateSignature = require('../models/validate-signature');
const crypt = require('../models/crypt');
const User = require('../models/user');
const router = express.Router();
const redis = require('redis');
const client = redis.createClient();
const config = require('../config');
const network = config.getNetwork();
client.select(network.redisDB);
const util = require('util');
const TradeLog = require('../models/tradeLog');

router.post('/register', async (req, res, next) => {
  try {
    const user = req.body;
    const addressSigner = validateSignature(user.signature);
    if (addressSigner !== user.address.toLowerCase()) {
      res.status(400);
      return res.send({ 'status': 'no', 'message': 'Invalid signature.' });
    }
    if (!('type' in user) || (user.type !== 'follower' && user.type !== 'leader')) {
      res.status(400);
      return res.send({ 'status': 'no', 'message': 'Invalid user type.' });
    }
    const exchange = require(`../exchanges/${user.exchange}`);
    let error = await exchange.validateKey(user.apiKey, user.apiSecret, user.type);
    if (error) {
      res.status(400);
      return res.send({ 'status': 'no', 'message': error });
    }
    await User.register(
      user.address.toLowerCase(),
      user.exchange,
      crypt.encrypt(user.apiKey),
      crypt.encrypt(user.apiSecret),
      user.type,
      user.fullname,
      user.email,
      user.asset,
    );
    const re = res.send({ 'status': 'ok' });
    if (user.type === 'follower') {
      await User.checkAvailableC8(user.address);
    }
    return re;
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

router.get('/show', async (req, res, next) => {
  try {
    const exchange = req.query.exchange;
    const address = req.query.address.toLowerCase();
    let userDetail = await User.find(address, exchange);
    if (userDetail === undefined) {
      res.status(404);
      return res.send({ 'status': 'no', 'message': 'User not found' });
    }
    let hgetall = util.promisify(client.hgetall).bind(client);
    let fw = await hgetall('leader:' + address);
    if (fw === null) {
      userDetail.follower = '0';
    } else {
      userDetail.follower = Object.keys(fw).length.toFixed(0);
    }
    delete userDetail.apiKey;
    delete userDetail.apiSecret;
    res.send(userDetail);
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

function geometricMean (data) {
  let sum = data[0];
  for (let i = 1; i < data.length; i++) {
    sum *= data[i];
  }
  return Math.pow(sum, 1.0 / data.length);
}

router.get('/performance', async (req, res, next) => {
  try {
    const exchange = req.query.exchange;
    const address = req.query.address.toLowerCase();
    let userDetail = await User.find(address, exchange);
    if (userDetail === undefined) {
      res.status(404);
      return res.send({ 'status': 'no', 'message': 'User not found' });
    }
    let trades = await TradeLog.findLog(address);
    let buyTrade = {};
    let profits = {};
    let profitAll = 0;
    let profitPercentAll = [];
    for (let t of trades) {
      if (t.side === 'BUY') {
        if (!(t.asset in buyTrade)) {
          buyTrade[t.asset] = [];
        }
        t.balance = parseFloat(t.quantity);
        buyTrade[t.asset].push(t);
      } else { // Sell
        if (t.asset in buyTrade) {
          let subAmountLeft = parseFloat(t.quantity);
          let sellPrice = parseFloat(t.cost) / parseFloat(t.quantity);
          for (let b of buyTrade[t.asset]) {
            let lastAmount = parseFloat(b.quantity);
            subAmountLeft = subAmountLeft / parseFloat(b.quantity);
            let profit;
            if (subAmountLeft > 0.0) {
              let buyPrice = parseFloat(b.cost) / lastAmount;
              if (subAmountLeft > 0) {
                b.balance = 0;
                profit = (sellPrice - buyPrice) * lastAmount;
                profitPercentAll.push((profit / (buyPrice * lastAmount)) * 100);
              } else {
                b.balance = Math.abs(subAmountLeft);
                profit = (sellPrice - buyPrice) * (lastAmount + subAmountLeft);
                profitPercentAll.push((profit / (buyPrice * lastAmount)) * 100);
              }
              profitAll += profit;
              if (!(t.asset in profits)) {
                profits[t.asset] = 0;
              }
              profits[t.asset] += profit;
            }
          }
        } else {
          // NO buy
        }
      }
    }
    const mean = arr => arr.reduce((p, c) => p + c, 0) / arr.length;
    return res.send({
      'profit': profitAll.toFixed(2),
      'mean': mean(profitPercentAll).toFixed(2),
      'geometricMean': geometricMean(profitPercentAll).toFixed(2),
      profits: profits,
    });
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

router.get('/balance', async (req, res, next) => {
  try {
    const exchange = req.query.exchange;
    const address = req.query.address.toLowerCase();
    const signature = req.query.signature;
    const exchangeModel = require(`../exchanges/${exchange}`);
    let userDetail;
    if (signature !== undefined) {
      const addressSigner = validateSignature(signature);
      if (addressSigner === address) {
        userDetail = await User.find(address, exchange);
      } else {
        res.status(400);
        return res.send({ 'status': 'no', 'message': 'Invalid signature.' });
      }
    } else {
      userDetail = await User.findLeader(address, exchange);
    }
    if (userDetail === undefined) {
      res.status(404);
      return res.send({ 'status': 'no', 'message': 'Wallet not found' });
    }
    let balance = await exchangeModel.balance(crypt.decrypt(userDetail.apiKey), crypt.decrypt(userDetail.apiSecret));
    if (typeof balance === 'string') {
      res.status(403);
      return res.send({ 'status': 'no', 'message': balance });
    } else {
      res.send(balance);
    }
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

module.exports = router;
