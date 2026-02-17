const db = require('./src/config/db');

async function checkData() {
    console.log('🔍 Verificando dados...');

    try {
        // 1. Check Admin User
        const [users] = await db.execute('SELECT id, email, role FROM usuarios WHERE email = ?', ['admin@nivelsmart.com']);
        if (users.length === 0) {
            console.log('❌ Usuário admin não encontrado.');
        } else {
            console.log(`✅ Admin encontrado: ID ${users[0].id}`);
        }

        // 2. Check Reservoirs and Sensors
        const [rows] = await db.execute(`
            SELECT r.id as res_id, r.nome as res_nome, s.devId, s.nome as sens_nome 
            FROM reservatorios r
            LEFT JOIN sensores s ON r.id = s.reservatorio_id
        `);

        if (rows.length === 0) {
            console.log('❌ Nenhum reservatório/sensor encontrado.');
        } else {
            console.log('📋 Reservatórios e Sensores:');
            console.table(rows);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
