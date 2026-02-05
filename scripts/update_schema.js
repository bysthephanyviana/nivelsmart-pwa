const db = require('../src/config/db');

async function updateSchema() {
    console.log('🔄 Iniciando atualização do esquema do banco de dados...');

    try {
        // 1. Adicionar colunas na tabela sensores se não existirem
        console.log('📦 Verificando tabela sensores...');

        try {
            await db.execute(`
                ALTER TABLE sensores 
                ADD COLUMN cache_nivel INT DEFAULT NULL,
                ADD COLUMN cache_status JSON DEFAULT NULL,
                ADD COLUMN last_sync TIMESTAMP DEFAULT NULL;
            `);
            console.log('✅ Colunas de cache adicionadas com sucesso.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ Colunas já existem, pulando...');
            } else {
                throw err;
            }
        }

        // 2. Adicionar índices
        console.log('⚡ Criando índices de performance...');

        const createIndex = async (query, name) => {
            try {
                await db.execute(query);
                console.log(`✅ Índice ${name} criado.`);
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log(`⚠️ Índice ${name} já existe.`);
                } else {
                    console.warn(`⚠️ Erro ao criar índice ${name}: ${err.message}`);
                }
            }
        };

        await createIndex('ALTER TABLE sensores ADD INDEX idx_devId (devId)', 'idx_devId');
        await createIndex('ALTER TABLE sensores ADD INDEX idx_reservatorio (reservatorio_id)', 'idx_reservatorio');
        await createIndex('CREATE INDEX idx_usuarios_email ON usuarios(email)', 'idx_usuarios_email');
        await createIndex('CREATE INDEX idx_reservatorios_condominio ON reservatorios(condominio_id)', 'idx_reservatorios_condominio');

        console.log('🎉 Atualização de esquema concluída!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro fatal ao atualizar esquema:', error.message);
        process.exit(1);
    }
}

updateSchema();
