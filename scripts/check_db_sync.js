require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSync() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await pool.execute('SELECT id, devId, nome, last_sync, cache_nivel FROM sensores');
        console.table(rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkSync();
