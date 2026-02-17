const db = require('../src/config/db');

async function migrate() {
    try {
        console.log('Checking if foto_url column exists...');
        const [columns] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'foto_url'");

        if (columns.length === 0) {
            console.log('Adding foto_url column to usuarios table...');
            await db.query("ALTER TABLE usuarios ADD COLUMN foto_url VARCHAR(255) DEFAULT NULL");
            console.log('Column added successfully.');
        } else {
            console.log('Column foto_url already exists.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
