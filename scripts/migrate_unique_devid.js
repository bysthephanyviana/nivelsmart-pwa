const db = require('../src/config/db');

async function migrate() {
    console.log('🔄 Aplicando UNIQUE constraint em devId...');
    try {
        // First drop the old index if it exists (idx_devId is standard non-unique)
        // We'll wrap in try/catch in case it has a different name or doesn't exist, 
        // but 'SHOW INDEX' showed 'idx_devId'.
        try {
            await db.execute("DROP INDEX idx_devId ON sensores");
            console.log('✅ Index antigo removido.');
        } catch (e) {
            console.log('⚠️ Index antigo não encontrado ou já removido.');
        }

        // Now add UNIQUE constraint
        await db.execute("ALTER TABLE sensores ADD UNIQUE (devId)");
        console.log('✅ UNIQUE constraint aplicada com sucesso!');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.error('❌ ERRO: Existem devIds duplicados no banco. Corrija manualmente antes de migrar.');
        } else {
            console.error('❌ Erro na migração:', error);
        }
        process.exit(1);
    }
}

migrate();
