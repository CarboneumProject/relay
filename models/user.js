const mysql = require('./mysql');
const user = {};

user.register = async function register (address, exchange, apiKey, apiSecret, userType) {
  return mysql.query(`
    REPLACE INTO carboneum.user (address,
                                 exchange,
                                 apiKey,
                                 apiSecret,
                                 type)
    VALUES (?, ?, ?, ?, ?)
  `, [address, exchange, apiKey, apiSecret, userType]);
};

user.find = async function find (address, exchange) {
  return (await mysql.query(`
    SELECT * FROM carboneum.user WHERE address = ? AND exchange = ?
  `, [address, exchange]))[0];
};

user.findAllInExchange = async function findAllInExchange (exchange) {
  return mysql.query(`
    SELECT * FROM carboneum.user WHERE exchange = ?
  `, [exchange]);
};

module.exports = user;
