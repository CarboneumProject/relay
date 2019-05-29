const mysql = require('./mysql');
const tradeLog = {};

tradeLog.insertLog = async function insertLog (log) {
  return mysql.query(`
      INSERT INTO carboneum.trade_log (tx_hash,
                                       trader,
                                       pair,
                                       side,
                                       quantity,
                                       price,
                                       cost,
                                       order_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [log.txHash,
    log.trader,
    log.pair,
    log.side,
    log.quantity,
    log.price,
    log.cost,
    log.orderTime,
  ]);
};

module.exports = tradeLog;
