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
                                       order_time,
                                       exchange)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [log.txHash,
    log.trader,
    log.asset,
    log.currency,
    log.side,
    log.quantity,
    log.price,
    log.cost,
    log.orderTime,
    log.exchange,
  ]);
};

tradeLog.findLog = async function findLog (trader, exchange, days) {
  let extraQuery = ` AND order_time BETWEEN NOW() - INTERVAL ${days} DAY AND NOW()`;
  if (days === 0) { // All time
    extraQuery = '';
  }
  return mysql.query(`
      SELECT *
      FROM carboneum.trade_log
      WHERE trader = ? AND exchange = ?
        ${extraQuery}
      ORDER BY order_time ASC
  `, [trader, exchange]);
};

module.exports = tradeLog;
