const db = require('./src/config/db');

async function checkSchema() {
    try {
        console.log('Checking SENSORES columns...');
        const [rows] = await db.execute('DESCRIBE sensores');
        console.log(rows.map(r => r.Field));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
