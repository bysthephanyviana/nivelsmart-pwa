const db = require('./src/config/db');

async function checkIndices() {
    try {
        console.log('Checking SENSORES indices...');
        const [rows] = await db.execute('SHOW INDEX FROM sensores');
        console.log(rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkIndices();
