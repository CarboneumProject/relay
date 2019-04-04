const mysql = require('./mysql');
const trade = {};

trade.getAvailableTrade = async function getAvailableTrade (token, owner) {
  return mysql.query(`
    SELECT *
    FROM carboneum.trade
    WHERE  maker_token = ? AND follower = ? AND amount_left != '0'
    ORDER BY order_time ASC
  `, [token, owner]);
};

trade.updateAmountLeft = async function updateAmountLeft (amountLeft, id) {
  return mysql.query(`
    UPDATE carboneum.trade SET amount_left = ? WHERE id = ?
  `, [amountLeft, id]);
};

trade.insertNewTrade = async function insertNewTrade (trade) {
  return mysql.query(`
    INSERT INTO carboneum.trade (order_time,
                                 leader,
                                 follower,
                                 maker_token,
                                 taker_token,
                                 amount_maker,
                                 amount_taker,
                                 amount_left,
                                 order_hash,
                                 tx_hash,
                                 leader_tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [trade.order_time,
    trade.leader,
    trade.follower,
    trade.makerToken,
    trade.takerToken,
    trade.amountMaker,
    trade.amountTaker,
    trade.amountLeft,
    trade.orderHash,
    trade.txHash,
    trade.leaderTxhash,
  ]);
};

module.exports = trade;
