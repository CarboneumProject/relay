const express = require('express');
const validateSignature = require('../models/validate-signature');
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
    User.register(user.address.toLowerCase(), user.exchange, user.apiKey, user.apiSecret, user.type);
    if (user.type === 'follower') {
      await User.checkAvailableC8(user.address);
    }
    return res.send({ 'status': 'ok' });
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

module.exports = router;
