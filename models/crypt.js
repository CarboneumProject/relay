const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const password = 'SET_THIS_ON_ENV_MASTER_PASSWORD' || process.env.MASTER_PASSWORD; // Memorable password no limit size
const salt = '!@#DW@=08-3Y890YH()FH*)'; // Salt to hash password to fixed size key, do not change.
const ivTxt = '6105936d417628cc'; // Random iv must be size 16, do not change.
const iv = Buffer.from(ivTxt, 'utf8'); // Initialization vector.
const key = crypto.scryptSync(Buffer.from(password, 'utf8'), salt, 32);
const crypt = {};

crypt.encrypt = function encrypt (text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

crypt.decrypt = function decrypt (text) {
  let decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = crypt;
