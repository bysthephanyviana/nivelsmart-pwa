require('dotenv').config();
const tuya = require('../src/config/tuya');

const uid = process.argv[2];

if (!uid) {
    console.error('Uso: node scripts/list-devices.js <USER_ID>');
    console.error('Exemplo: node scripts/list-devices.js az175988...');
    process.exit(1);
}

console.log(`\n=== LISTAR DISPOSITIVOS DO USUÁRIO ===`);
console.log(`User ID: ${uid}`);
console.log('--------------------------------------\n');

(async () => {
    try {
        console.log('1. Buscando lista de dispositivos...');

        // Endpoint para listar dispositivos de um usuário vinculado
        const path = `/v1.0/users/${uid}/devices`;
        const response = await tuya.request('GET', path);

        if (!response.success) {
            console.error('❌ Erro ao listar dispositivos:');
            console.error(JSON.stringify(response, null, 2));
            return;
        }

        const devices = response.result;

        if (!devices || devices.length === 0) {
            console.log('⚠️ Nenhum dispositivo encontrado para este usuário.');
            console.log('Verifique se o dispositivo está aparecendo no App Smart Life/Tuya.');
        } else {
            console.log(`✅ Sucesso! Encontrados ${devices.length} dispositivo(s):\n`);
            devices.forEach(dev => {
                console.log(`🔹 Nome: ${dev.name}`);
                console.log(`   ID (Device ID): ${dev.id}`);
                console.log(`   Categoria: ${dev.category}`);
                console.log(`   Online: ${dev.online}`);
                console.log('   -------------------------');
            });
            console.log('\nUSE O "ID" ACIMA NO SCRIPT DE TESTE:');
            console.log(`node scripts/test-tuya.js <ID_ENCONTRADO>`);
        }

    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO:');
        console.error(error.message);
    }
})();
