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
    let error = await exchange.validateKey(user.apiKey, user.apiSecret, user.type, user.passphrase);
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
      user.passphrase,
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
    delete userDetail.passphrase;
    res.send(userDetail);
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

async function getTradeRealized (address, exchange, days) {
  const secInDay = 24 * 60 * 60;
  let trades = await TradeLog.findLog(address, exchange, days);
  let buyTrade = {};
  let profits = {};
  let profitAll = 0;
  let costAll = 0;
  let profitPercentAll = [];
  let win = 0;
  let lost = 0;
  for (let t of trades) {
    t.time = t.order_time.getTime() / 1000;
    if (t.side === 'BUY') {
      if (!(t.asset in buyTrade)) {
        buyTrade[t.asset] = [];
      }
      t.balance = parseFloat(t.quantity);
      buyTrade[t.asset].push(t);
    } else { // Sell
      if (t.asset in buyTrade) {
        for (let b of buyTrade[t.asset]) {
          let subAmountLeft = parseFloat(b.balance);
          let sellPrice = parseFloat(t.cost) / parseFloat(t.quantity);
          let lastAmount = parseFloat(b.quantity);
          subAmountLeft = subAmountLeft / parseFloat(b.quantity);
          let profit;
          if (subAmountLeft > 0.0) {
            let buyPrice = parseFloat(b.cost) / lastAmount;
            let dayToTrade = (t.time - b.time) / secInDay;
            if (dayToTrade < 1.0) {
              dayToTrade = 1;
            }
            let profitPerDay = 0;
            if (subAmountLeft > 0) {
              b.balance = 0;
              profit = (sellPrice - buyPrice) * lastAmount;
            } else {
              b.balance = Math.abs(subAmountLeft);
              profit = (sellPrice - buyPrice) * (lastAmount + subAmountLeft);
            }
            costAll += buyPrice * lastAmount;
            profitPerDay = (profit / (buyPrice * lastAmount)) / dayToTrade;
            profitPercentAll.push(profitPerDay);
            if (profit > 0) {
              win += 1;
            } else {
              lost += 1;
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
  let winRate = 'N/A';
  if (lost > 0) {
    winRate = (win / lost).toFixed(2);
  }
  let percentRealized = ((profitAll / costAll) * 100).toFixed(2);
  return { percentRealized: percentRealized, winRate: winRate, win: win.toFixed(0), lost: lost.toFixed(0) };
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
    let perf1d = await getTradeRealized(address, exchange, 1);
    let perf7D = await getTradeRealized(address, exchange, 7);
    let perf30D = await getTradeRealized(address, exchange, 30);
    let perf90D = await getTradeRealized(address, exchange, 90);
    let perfAll = await getTradeRealized(address, exchange, 0);
    return res.send({
      'performance': {
        '1d': perf1d.percentRealized,
        '7d': perf7D.percentRealized,
        '30d': perf30D.percentRealized,
        '90d': perf90D.percentRealized,
        'all': perfAll.percentRealized,
      },
      'win': perfAll.win,
      'lost': perfAll.lost,
      'winRate': perfAll.winRate,
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
    let balance = await exchangeModel.balance(
      crypt.decrypt(userDetail.apiKey),
      crypt.decrypt(userDetail.apiSecret),
      userDetail.passphrase,
    );
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
