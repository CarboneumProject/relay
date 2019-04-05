const mysql = require('./mysql');
const order = {};

order.insertNewOrder = async function insertNewOrder (order) {
  return mysql.query(`
    INSERT INTO carboneum.sent_order (
        leader,
        follower,
        leader_tx_hash,
        order_hash,
        order_time
    )
    VALUES (?, ?, ?, ?, ?)
  `, [order.leader,
    order.follower,
    order.leaderTxHash,
    order.orderHash,
    order.orderTime,
  ]);
};

order.find = async function find (orderHash) {
  return (await mysql.query(`
    SELECT * FROM carboneum.sent_order WHERE order_hash = ?
  `, [orderHash]))[0];
};

order.getOrderhashForCancel = async function getOrderhashForCancel () {
  return mysql.query(`
    SELECT id, follower, order_hash, isCancel
    FROM carboneum.sent_order
    WHERE TIMESTAMPDIFF(HOUR, order_time,now()) >= 1
      AND isCancel is NULL;
  `);
};

order.updateCancelOrder = async function updateCancelOrder (isCancel, id, filled, initialAmount) {
  return mysql.query(`
    UPDATE carboneum.sent_order SET isCancel = ?, filled = ?, initialAmount = ?  WHERE id = ?
  `, [isCancel, filled, initialAmount, id]);
};

module.exports = order;
