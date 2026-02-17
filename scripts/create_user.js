const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);
const nome = args[0] || 'Usuario Teste';
const email = args[1] || 'teste@nivelsmart.com';
const senha = args[2] || '123456';
const role = args[3] || 'sindico';

async function createUser() {
    console.log(`👤 Criando usuário: ${nome} (${email})...`);

    try {
        // Check exists
        const [existing] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('❌ Usuário já existe.');
            process.exit(1);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(senha, salt);

        // Insert
        const [result] = await db.execute(
            'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)',
            [nome, email, hash, role]
        );

        console.log(`✅ Usuário criado com Sucesso! ID: ${result.insertId}`);
        console.log(`🔑 Login: ${email}`);
        console.log(`🔑 Senha: ${senha}`);

        process.exit(0);

    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

createUser();
