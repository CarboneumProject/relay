const express = require('express');
const validateSignature = require('../models/validate-signature');
const crypt = require('../models/crypt');
const User = require('../models/user');
const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const user = req.body;
    const addressSigner = validateSignature(user.signature);
    if (addressSigner !== user.address.toLowerCase()) {
      res.status(400);
      return res.send({ 'status': 'no', 'message': 'Invalid signature.' });
    }
    const exchange = require(`../exchanges/${user.exchange}`);
    let error = await exchange.validateKey(user.apiKey, user.apiSecret);
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

router.get('/balances', async (req, res, next) => {
  try {
    const exchange = req.query.exchange;
    const wallet = req.query.wallet;
    const user = req.query.user;
    const signature = req.query.signature;
    const addressSigner = validateSignature(signature);
    if (addressSigner !== user.toLowerCase()) {
      res.status(400);
      return res.send({ 'status': 'no', 'message': 'Invalid signature.' });
    }
    const exchangeModel = require(`../exchanges/${exchange}`);
    let userDetail = await User.find(wallet, exchange);
    if (userDetail === null) {
      res.status(400);
      return res.send({ 'status': 'no', 'message': 'Invalid signature.' });
    }
    let balances = await exchangeModel.balances(crypt.decrypt(userDetail.apiKey), crypt.decrypt(userDetail.apiSecret));
    res.send(balances);
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

module.exports = router;
