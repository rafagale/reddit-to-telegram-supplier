require('dotenv').config();
const mysql = require('mysql');
var db_config = {
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

var pool = mysql.createPool(db_config);

pool.getConnection(function (err, connection) {
    console.log("connected");
});

pool.on('error', function (err) {
    console.log(err.code); // 'ER_BAD_DB_ERROR' 
    // https://www.npmjs.com/package/mysql#error-handling
});

module.exports = pool;
