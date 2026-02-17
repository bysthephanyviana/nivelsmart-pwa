const db = require('../src/config/db');

// Test Sensor ID requested by user
const DEV_ID = 'eb5961daada3fea21cvjau';

async function seed() {
    console.log('🌱 Seeding Test Environment...');

    try {
        // 1. Get Admin User
        const [users] = await db.execute('SELECT id FROM usuarios WHERE email = ?', ['admin@nivelsmart.com']);
        if (users.length === 0) {
            console.error('❌ Admin user not found.');
            process.exit(1);
        }
        const adminId = users[0].id;

        // 2. Create/Get Test Condo
        let condoId;
        const [condos] = await db.execute('SELECT id FROM condominios WHERE nome = ? AND usuario_id = ?', ['Condomínio Tech', adminId]);
        if (condos.length > 0) {
            condoId = condos[0].id;
        } else {
            const [res] = await db.execute('INSERT INTO condominios (nome, endereco, usuario_id) VALUES (?, ?, ?)', ['Condomínio Tech', 'Rua da Tecnologia, 100', adminId]);
            condoId = res.insertId;
            console.log('✅ Condomínio de Teste criado.');
        }

        // 3. Create/Get Test Reservoir
        let resId;
        const [reservs] = await db.execute('SELECT id FROM reservatorios WHERE nome = ? AND condominio_id = ?', ['Caixa Principal', condoId]);
        if (reservs.length > 0) {
            resId = reservs[0].id;
        } else {
            const [res] = await db.execute('INSERT INTO reservatorios (condominio_id, nome, capacidade_litros) VALUES (?, ?, ?)', [condoId, 'Caixa Principal', 10000]);
            resId = res.insertId;
            console.log('✅ Reservatório de Teste criado.');
        }

        // 4. Link Sensor
        const [sensors] = await db.execute('SELECT id FROM sensores WHERE devId = ?', [DEV_ID]);
        if (sensors.length === 0) {
            await db.execute('INSERT INTO sensores (reservatorio_id, devId, nome) VALUES (?, ?, ?)', [resId, DEV_ID, 'Sensor Nível 1']);
            console.log(`✅ Sensor ${DEV_ID} vinculado com sucesso!`);
        } else {
            // Update to point to our test reservoir just in case
            await db.execute('UPDATE sensores SET reservatorio_id = ? WHERE devId = ?', [resId, DEV_ID]);
            console.log(`✅ Sensor ${DEV_ID} re-vinculado ao reservatório de teste.`);
        }

        // 5. Inject Fake Data for Instant Visualization (Optional but good for UX)
        // We'll let the user fetch real data, but we can init cache
        /*
        await db.execute('UPDATE sensores SET cache_nivel = ?, cache_status = ? WHERE devId = ?', 
            [50, JSON.stringify({ current_level: 50, bomba_ligada: true }), DEV_ID]);
        */

        console.log('🏁 Setup concluído! O sensor deve aparecer no painel do Admin.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

seed();
