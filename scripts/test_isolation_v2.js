const axios = require('axios');
const jwt = require('jsonwebtoken');

// Config
const API_URL = 'http://localhost:3000';
const JWT_SECRET = 'seusecretomuitoseguro'; // Matches .env

// Mock Tokens
const adminToken = jwt.sign({ id: 1, role: 'admin' }, JWT_SECRET);
const userToken = jwt.sign({ id: 2, role: 'sindico' }, JWT_SECRET); // Sindico Teste

async function checkIsolation() {
    try {
        console.log('--- TESTE DE ISOLAMENTO DE DADOS ---');

        // 1. Admin Request
        console.log('\n[ADMIN] Buscando Condomínios...');
        const resAdmin = await axios.get(`${API_URL}/condominios`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Admin vê ${resAdmin.data.length} condomínios.`);

        // 2. User Request
        console.log('\n[USER] Buscando Condomínios...');
        const resUser = await axios.get(`${API_URL}/condominios`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log(`✅ Usuário vê ${resUser.data.length} condomínios.`);

        if (resAdmin.data.length > resUser.data.length) {
            console.log('\nSUCCESS: Isolamento Funcionando! Admin vê mais que o usuário.');
        } else if (resUser.data.length === 0) {
            console.log('\nSUCCESS: Usuário não vê nada (se não tiver condomínios).');
        } else {
            console.log('\nWARNING: Admin e Usuário veem a mesma quantidade. Verifique se o usuário realmente tem dados ou se o filtro falhou.');
        }

    } catch (error) {
        console.error('Erro no teste:', error.response ? error.response.data : error.message);
    }
}

checkIsolation();
