require('dotenv').config();
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

(async () => {
    try {
        console.log('Criando usuário Admin...');

        const nome = 'Administrador';
        const email = 'admin@nivelsmart.com';
        const senha = 'admin'; // Senha simples para começar
        const role = 'admin';

        // 1. Verificar se já existe
        const [existing] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('⚠️ Usuário admin@nivelsmart.com já existe!');
            process.exit(0);
        }

        // 2. Hash da senha
        const hashedPassword = await bcrypt.hash(senha, 8);

        // 3. Inserir
        await db.execute(
            'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)',
            [nome, email, hashedPassword, role]
        );

        console.log('✅ Usuário Admin criado com sucesso!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Senha: ${senha}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        process.exit(1);
    }
})();
