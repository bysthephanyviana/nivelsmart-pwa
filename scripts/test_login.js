const axios = require('axios'); // Assuming axios is not in root, I'll use http standard lib if needed, but let's try fetch first as it's standard in newer node.

async function testLogin() {
    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'sindico@teste.com',
                senha: '123456'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ LOGIN SUCESSO!');
            console.log('Token:', data.token ? 'Recebido' : 'Ausente');
            console.log('User Role:', data.user.role);
        } else {
            console.log('❌ LOGIN FALHOU:', response.status);
            console.log('Msg:', data);
        }

    } catch (error) {
        console.error('Erro de conexão:', error.message);
    }
}

testLogin();
