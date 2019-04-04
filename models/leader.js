const mysql = require('./mysql');
const leader = {};

leader.register = async function register (address, exchange, apiKey, apiSecret) {
  return mysql.query(`
    REPLACE INTO carboneum.leader (address,
                                   exchange,
                                   apiKey,
                                   apiSecret)
    VALUES (?, ?, ?, ?)
  `, [address, exchange, apiKey, apiSecret,
  ]);
};

leader.find = async function find (address) {
  return (await mysql.query(`
    SELECT * FROM carboneum.leader WHERE address = ?
  `, [address]))[0];
};

leader.findAllInExchange = async function findAllInExchange (exchange) {
  return mysql.query(`
    SELECT * FROM carboneum.leader WHERE exchange = ?
  `, [exchange]);
};

module.exports = leader;
