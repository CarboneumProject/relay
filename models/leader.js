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

module.exports = leader;
