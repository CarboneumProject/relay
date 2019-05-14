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
      user.firstname,
      user.lastname,
      user.email,
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
    delete userDetail.apiKey;
    delete userDetail.apiSecret;
    res.send(userDetail);
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
