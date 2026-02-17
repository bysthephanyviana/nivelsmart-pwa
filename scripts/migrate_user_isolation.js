const db = require('../src/config/db');

async function migrate() {
    console.log('🚀 Iniciando migração para Multi-User Isolation...');

    try {
        // 1. Add usuario_id column if not exists
        console.log('1️⃣ Adicionando coluna usuario_id em condominios...');
        try {
            await db.execute('ALTER TABLE condominios ADD COLUMN usuario_id INT');
            console.log('   ✅ Coluna adicionada.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('   ⚠️ Coluna já existe.');
            } else {
                throw e;
            }
        }

        // 2. Assign all existing condos to Admin (ID 1)
        // Assuming ID 1 is the admin created initially. If not sure, we search by email.
        console.log('2️⃣ Vinculando condomínios existentes ao Admin...');
        const [users] = await db.execute('SELECT id FROM usuarios WHERE email = ?', ['admin@nivelsmart.com']);

        if (users.length > 0) {
            const adminId = users[0].id;
            await db.execute('UPDATE condominios SET usuario_id = ? WHERE usuario_id IS NULL', [adminId]);
            console.log(`   ✅ Condomínios vinculados ao Admin ID ${adminId}.`);

            // 3. Add Foreign Key Constraint
            console.log('3️⃣ Adicionando Foreign Key...');
            try {
                await db.execute('ALTER TABLE condominios ADD CONSTRAINT fk_condominio_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE');
                console.log('   ✅ FK criada.');
            } catch (e) {
                if (e.code === 'ER_DUP_KEY' || e.message.includes('duplicate')) {
                    console.log('   ⚠️ FK já existe.');
                } else {
                    // Ignore if already exists with specific error
                    console.log('   ⚠️ FK pode já existir ou erro:', e.message);
                }
            }

            // 4. Create Index
            console.log('4️⃣ Criando índice de performance...');
            try {
                await db.execute('CREATE INDEX idx_condominios_usuario ON condominios (usuario_id)');
                console.log('   ✅ Índice criado.');
            } catch (e) {
                if (e.code === 'ER_DUP_KEYNAME') console.log('   ⚠️ Índice já existe.');
                else console.log('   ⚠️ Erro índice:', e.message);
            }

        } else {
            console.error('❌ ERRO CRÍTICO: Usuário Admin não encontrado para migração.');
            process.exit(1);
        }

        console.log('🏁 Migração concluída com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

migrate();
