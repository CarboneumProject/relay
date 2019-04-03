const express = require('express');
const validateSignature = require('../models/validate-signature');
const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const walletAddress = req.body.walletAddress;
    const signature = req.body.signature;
    const addressSigner = validateSignature(signature);
    if (addressSigner !== walletAddress.toLowerCase()) {
      res.status(400);
      return res.send({ 'status': 'no', 'message': 'Invalid signature.' });
    }
    // TODO Save API key and secrete to DB.
    return res.send({ 'status': 'ok' });
  } catch (e) {
    console.error(e);
    res.status(500);
    return res.send({ 'status': 'no', 'message': e.message });
  }
});

module.exports = router;
