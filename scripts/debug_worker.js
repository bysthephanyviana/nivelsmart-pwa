const tuyaSync = require('../src/workers/tuyaSync');

console.log('--- Iniciando Debug do Worker ---');
try {
    tuyaSync.start();
} catch (e) {
    console.error('Erro ao chamar start:', e);
}
// Manter processo rodando por uns segundos para ver logs async
setTimeout(() => {
    console.log('--- Fim do timeout de debug ---');
    process.exit(0);
}, 10000);
