const db = require('../src/config/db');

async function migrate() {
    console.log('🔄 Adicionando colunas de Reset de Senha...');
    try {
        await db.execute("ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL");
        await db.execute("ALTER TABLE usuarios ADD COLUMN reset_expires TIMESTAMP DEFAULT NULL");
        console.log('✅ Colunas criadas com sucesso!');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Colunas já existem.');
            process.exit(0);
        }
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

migrate();
