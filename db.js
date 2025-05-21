const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Admin@123',
    database: 'workplace',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = db;
