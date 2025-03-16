const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
})

const createTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS orders
        (
            orderID
            TEXT
            PRIMARY
            KEY,
            products
            JSONB,
            orderWorth
            REAL,
            orderDate
            TIMESTAMP
            DEFAULT
            CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(query);
    } catch (error) {
        console.error("Error creating table:", error);
    }
};

createTable();

module.exports = pool;
