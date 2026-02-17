const axios = require('axios');
require('dotenv').config();

async function testBackend() {
    console.log('--- DIAGNOSTICO BACKEND ---');
    console.log('1. Verificando Variáveis de Ambiente...');
    const required = ['DB_HOST', 'DB_USER', 'JWT_SECRET', 'PORT'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
        console.error('❌ Faltando: ', missing.join(', '));
    } else {
        console.log('✅ Variáveis presentes.');
    }

    console.log('\n2. Testando rota Health Check (/) ...');
    try {
        const port = process.env.PORT || 3000;
        const res = await axios.get(`http://localhost:${port}/`);
        console.log('✅ Status:', res.status);
        console.log('✅ Resposta:', res.data);
    } catch (error) {
        console.error('❌ Falha ao conectar no Health Check:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('⚠️  O SERVIDOR NÃO PARECE ESTAR RODANDO.');
        }
    }

    console.log('\n3. Testando Conexão com Banco de Dados...');
    try {
        const db = require('../src/config/db');
        const [rows] = await db.execute('SELECT 1 as val');
        console.log('✅ Conexão DB OK. Resultado:', rows[0].val);
    } catch (error) {
        console.error('❌ Erro no Banco de Dados:', error.message);
    }
}

testBackend();
