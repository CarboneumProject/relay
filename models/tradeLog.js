const mysql = require('./mysql');
const tradeLog = {};

tradeLog.insertLog = async function insertLog (log) {
  return mysql.query(`
      INSERT INTO carboneum.trade_log (tx_hash,
                                       trader,
                                       asset,
                                       currency,
                                       side,
                                       quantity,
                                       price,
                                       cost,
                                       order_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [log.txHash,
    log.trader,
    log.asset,
    log.currency,
    log.side,
    log.quantity,
    log.price,
    log.cost,
    log.orderTime,
  ]);
};

tradeLog.findLog = async function findLog (trader) {
  return mysql.query(`
      SELECT *
      FROM carboneum.trade_log
      WHERE trader = ?
      ORDER BY order_time ASC
  `, [trader]);
};

module.exports = tradeLog;
