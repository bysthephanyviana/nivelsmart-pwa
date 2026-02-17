const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

const email = 'sindico@teste.com';
const newPass = '123456';

async function resetPass() {
    console.log(`🔒 Resetando senha para: ${email}...`);
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPass, salt);

        const [result] = await db.execute(
            'UPDATE usuarios SET senha_hash = ? WHERE email = ?',
            [hash, email]
        );

        if (result.affectedRows > 0) {
            console.log('✅ Senha atualizada para: 123456');
        } else {
            console.log('❌ Usuário não encontrado.');
        }
        process.exit(0);

    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

resetPass();
