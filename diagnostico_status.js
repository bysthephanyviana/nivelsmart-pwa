require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const clientId = (process.env.TUYA_CLIENT_ID || '').trim();
const clientSecret = (process.env.TUYA_CLIENT_SECRET || '').trim();
const baseUrl = 'https://openapi.tuyaus.com'; // Western America

console.log(`\n=== DIAGNÓSTICO DE ROTA (STATUS) ===`);
console.log(`ClientID: ${clientId}`);
console.log(`BaseURL: ${baseUrl}`);

if (process.argv.length < 3) {
    console.log("USO: node diagnostico_status.js <DEVICE_ID_REAL>");
    process.exit(1);
}

const deviceId = process.argv[2].trim();
console.log(`Testando Device ID: '${deviceId}'`);

async function run() {
    // 1. Pegar Token
    const now = new Date().getTime();
    const timestamp = now.toString();

    // Token Sign
    const pathToken = '/v1.0/token?grant_type=1';
    const contentHashToken = crypto.createHash('sha256').update('').digest('hex');
    const stringToSignToken = ['GET', contentHashToken, '', pathToken].join('\n');
    const strToken = clientId + timestamp + '' + stringToSignToken;
    const signToken = crypto.createHmac('sha256', clientSecret).update(strToken).digest('hex').toUpperCase();

    let token = '';
    try {
        const resToken = await axios.get(`${baseUrl}${pathToken}`, {
            headers: { 'client_id': clientId, 'sign': signToken, 't': timestamp, 'sign_method': 'HMAC-SHA256' }
        });
        if (resToken.data.success) {
            token = resToken.data.result.access_token;
            console.log(`✅ Token OK: ${token}`);
        } else {
            console.log(`❌ Erro no Token:`, resToken.data);
            return;
        }
    } catch (e) {
        console.log(`❌ Exceção Token:`, e.message);
        return;
    }

    // 2. Pegar Status
    const t2 = new Date().getTime().toString();
    const pathStatus = `/v1.0/devices/${deviceId}/status`;
    const contentHashStatus = crypto.createHash('sha256').update('').digest('hex'); // GET empty body
    const stringToSignStatus = ['GET', contentHashStatus, '', pathStatus].join('\n');
    const strStatus = clientId + token + t2 + '' + stringToSignStatus; // Business Mode Request
    const signStatus = crypto.createHmac('sha256', clientSecret).update(strStatus).digest('hex').toUpperCase();

    console.log(`\n--- Request Status Debug ---`);
    console.log(`Path: ${pathStatus}`);
    console.log(`StringToSign: ${JSON.stringify(stringToSignStatus)}`);
    console.log(`StrForSign: ${strStatus}`);
    console.log(`Sign: ${signStatus}`);

    try {
        const resStatus = await axios.get(`${baseUrl}${pathStatus}`, {
            headers: {
                'client_id': clientId,
                'access_token': token,
                'sign': signStatus,
                't': t2,
                'sign_method': 'HMAC-SHA256'
            }
        });

        if (resStatus.data.success) {
            console.log(`\n✅ SUCESSO! Status do Sensor:`);
            console.log(JSON.stringify(resStatus.data.result, null, 2));
        } else {
            console.log(`\n❌ FALHA NO STATUS:`, resStatus.data);
        }
    } catch (e) {
        console.log(`❌ Exceção Status:`, e.message);
    }
}

run();
