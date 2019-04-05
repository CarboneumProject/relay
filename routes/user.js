const express = require('express');
const validateSignature = require('../models/validate-signature');
const leaderModel = require('../models/user');
const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const body = req.body;
    const addressSigner = validateSignature(body.signature);
    if (addressSigner !== body.address.toLowerCase()) {
      res.status(400);
      return res.send({ 'status': 'no', 'message': 'Invalid signature.' });
    }
    leaderModel.register(body.address, body.exchange, body.apiKey, body.apiSecret, body.type);
    return res.send({ 'status': 'ok' });
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

module.exports = router;
