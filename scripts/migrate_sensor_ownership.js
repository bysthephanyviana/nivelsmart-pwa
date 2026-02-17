const db = require('../src/config/db');

async function migrate() {
    console.log('🚀 Iniciando migração para Multi-Sensor Ownership...');

    try {
        // 1. Add usuario_id column if not exists
        console.log('1️⃣ Adicionando coluna usuario_id em sensores...');
        await db.execute(`
            ALTER TABLE sensores 
            ADD COLUMN usuario_id INT,
            ADD CONSTRAINT fk_sensor_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        `).catch(err => {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('   ⚠️ Coluna usuario_id já existe.');
            } else {
                throw err;
            }
        });

        // 2. Link existing sensors to Admin (ID 1)
        console.log('2️⃣ Vinculando sensores existentes ao Admin (ID 1)...');
        const [result] = await db.execute(`
            UPDATE sensores SET usuario_id = 1 WHERE usuario_id IS NULL
        `);
        console.log(`   ✅ ${result.affectedRows} sensores vinculados ao Admin.`);

        // 3. Add Index
        console.log('3️⃣ Criando índice de performance...');
        await db.execute(`
            CREATE INDEX idx_sensores_usuario ON sensores (usuario_id)
        `).catch(err => {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('   ⚠️ Índice já existe.');
            } else {
                throw err;
            }
        });

        console.log('🏁 Migração concluída com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

migrate();
