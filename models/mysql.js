const mysql = require('mysql');
const util = require('util');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_SCHEMA || '',
  connectionLimit: 10,
  port: process.env.DB_PORT || 3306,

});

pool.query = util.promisify(pool.query); // Magic happens here.

module.exports = pool;
