require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m"
};

const clientId = (process.env.TUYA_CLIENT_ID || '').trim();
const clientSecret = (process.env.TUYA_CLIENT_SECRET || '').trim();

console.log(colors.blue + "=== DIAGNÓSTICO TUYA ===" + colors.reset);
console.log(`Node Version: ${process.version}`);
console.log(`Data/Hora Local: ${new Date().toISOString()}`);
console.log(`ClientID: ${clientId ? clientId.substring(0, 6) + '...' : 'NÃO ENCONTRADO'}`);
console.log(`Secret: ${clientSecret ? clientSecret.substring(0, 6) + '...' : 'NÃO ENCONTRADO'}`);

if (!clientId || !clientSecret) {
    console.log(colors.red + "ERRO: Credenciais não encontradas no .env" + colors.reset);
    process.exit(1);
}

const endpoints = [
    { name: 'Western America', url: 'https://openapi.tuyaus.com' },
    { name: 'Eastern America', url: 'https://openapi-ueaz.tuyaus.com' },
    { name: 'Europe', url: 'https://openapi.tuyaeu.com' },
    { name: 'China', url: 'https://openapi.tuyacn.com' },
    { name: 'India', url: 'https://openapi.tuyain.com' }
];


async function testEndpoint(endpoint, mode = 'simple') {
    const now = new Date().getTime();
    const timestamp = now.toString();
    const nonce = '';

    let sign;
    let signMethodName;

    if (mode === 'simple') {
        // Mode 1: Simple (Client ID + Timestamp)
        // Used by most IoT Core projects for Token
        signMethodName = 'Simple Mode (clientId + t)';
        const signStr = clientId + timestamp;
        sign = crypto.createHmac('sha256', clientSecret)
            .update(signStr)
            .digest('hex')
            .toUpperCase();
    } else {
        // Mode 2: Business/Complex (For some specific legacy or strict projects)
        // Str = clientId + t + nonce + stringToSign
        // stringToSign = Method + \n + Content-Hash + \n + Headers + \n + Url
        signMethodName = 'Business Mode (Complex Signature)';

        const contentHash = crypto.createHash('sha256').update('').digest('hex'); // Empty body
        const stringToSign = ['GET', contentHash, '', '/v1.0/token?grant_type=1'].join('\n');
        const str = clientId + timestamp + nonce + stringToSign;

        sign = crypto.createHmac('sha256', clientSecret)
            .update(str)
            .digest('hex')
            .toUpperCase();
    }

    console.log(`\nTestando: ${endpoint.name} [${signMethodName}]`);

    try {
        const response = await axios.get(`${endpoint.url}/v1.0/token?grant_type=1`, {
            headers: {
                'client_id': clientId,
                'sign': sign,
                't': timestamp,
                'sign_method': 'HMAC-SHA256',
                'nonce': nonce,
                'stringToSign': '' // Not a real header, just internal
            },
            timeout: 5000
        });

        if (response.data.success) {
            console.log(colors.green + "✅ SUCESSO!" + colors.reset);
            console.log(`Token: ${response.data.result.access_token}`);
            console.log(`Endpoint: ${endpoint.url}`);
            console.log(`Modo: ${signMethodName}`);
            return true;
        } else {
            console.log(colors.red + `❌ FALHA: ${response.data.msg} (Code: ${response.data.code})` + colors.reset);
            return false;
        }
    } catch (error) {
        console.log(colors.red + `❌ ERRO DE REDE: ${error.message}` + colors.reset);
        return false;
    }
}

async function run() {
    console.log("\nIniciando varredura de Data Centers e Modos de Assinatura...");

    for (const ep of endpoints) {
        // Try Simple Mode
        if (await testEndpoint(ep, 'simple')) return;
        // Try Business Mode
        if (await testEndpoint(ep, 'business')) return;
    }

    console.log(colors.red + "\n\nFALHA GERAL." + colors.reset);
    console.log("Se ambos os modos falharam em todos os datacenters, as credenciais estão 100% incorretas.");
}


run();
