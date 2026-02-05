require('dotenv').config();
const tuyaService = require('../src/services/tuya.service');

const devId = process.argv[2];

if (!devId) {
    console.error('Uso: node scripts/test-tuya.js <DEVICE_ID>');
    process.exit(1);
}

console.log(`\n=== TESTE DE CONEXÃO TUYA ===`);
console.log(`Device ID: ${devId}`);
console.log(`Client ID: ${process.env.TUYA_CLIENT_ID ? 'OK (Mascarado)' : 'MISSING'}`);
console.log(`Client Secret: ${process.env.TUYA_CLIENT_SECRET ? 'OK (Mascarado)' : 'MISSING'}`);
console.log('-------------------------------\n');

(async () => {
    try {
        console.log('1. Solicitando status do sensor...');
        const start = Date.now();

        const data = await tuyaService.getDeviceStatus(devId);

        const duration = Date.now() - start;
        console.log(`\n2. Resposta Recebida em ${duration}ms!`);
        console.log('-------------------------------');
        console.log(JSON.stringify(data, null, 2));
        console.log('-------------------------------');
        console.log('\n✅ SUCESSO: Conexão Tuya verificada e funcional.');
    } catch (error) {
        console.error('\n❌ ERRO: Falha na verificação.');
        console.error(error.message);
        if (error.response) {
            console.error('Detalhes da API:', error.response.data);
        }
    }
})();
