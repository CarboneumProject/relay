const mysql = require('./mysql');
const trade = {};

trade.getAvailableTrade = async function getAvailableTrade (token, owner, exchange) {
  return mysql.query(`
    SELECT id,
        order_time AS orderTime,
        leader,
        follower,
        maker_token AS makerToken,
        taker_token AS takerToken,
        amount_maker AS amountMaker,
        amount_taker AS amountTaker,
        amount_left AS amountLeft,
        order_hash AS orderHash,
        tx_hash AS txHash,
        leader_tx_hash AS leaderTxHash,
        cost
    FROM carboneum.trade
    WHERE  maker_token = ? AND follower = ? AND amount_left != '0' AND exchange = ?
    ORDER BY order_time ASC
  `, [token, owner, exchange]);
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
                                 leader_tx_hash,
                                 cost,
                                 exchange)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [trade.orderTime,
    trade.leader,
    trade.follower,
    trade.makerToken,
    trade.takerToken,
    trade.amountMaker,
    trade.amountTaker,
    trade.amountLeft,
    trade.orderHash,
    trade.txHash,
    trade.leaderTxHash,
    trade.cost,
    trade.exchange,
  ]);
};

module.exports = trade;
