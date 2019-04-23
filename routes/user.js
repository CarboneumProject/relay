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

router.get('/balance', async (req, res, next) => {
  try {
    const exchange = req.query.exchange;
    const address = req.query.address.toLowerCase();
    const exchangeModel = require(`../exchanges/${exchange}`);
    let userDetail = await User.findLeader(address, exchange, 'leader');
    if (userDetail === undefined) {
      res.status(404);
      return res.send({ 'status': 'no', 'message': 'Wallet not found' });
    }
    let balance = await exchangeModel.balance(crypt.decrypt(userDetail.apiKey), crypt.decrypt(userDetail.apiSecret));
    res.send(balance);
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

module.exports = router;
