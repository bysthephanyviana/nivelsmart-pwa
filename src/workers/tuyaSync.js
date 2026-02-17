const cron = require('node-cron');
const db = require('../config/db');
const tuyaService = require('../services/tuya.service');

// Intervalo de sincronização: a cada 60 segundos
const SYNC_INTERVAL = '*/60 * * * * *';

async function syncSensors() {
    console.log('[Worker] Iniciando sincronização de sensores...');

    try {
        // 1. Buscar todos os sensores cadastrados no banco
        const [sensores] = await db.execute('SELECT id, devId, nome FROM sensores');

        if (sensores.length === 0) {
            console.log('[Worker] Nenhum sensor para sincronizar.');
            return;
        }

        console.log(`[Worker] Sincronizando ${sensores.length} sensores...`);

        // 2. Process Individually (Revert to "Old Format" logic)
        // Iterate one by one to ensure stability and precise error handling per device
        // Small delay to prevent rate limit spikes if many devices

        for (const sensor of sensores) {
            try {
                // Individual Fetch
                const status = await tuyaService.getDeviceStatus(sensor.devId);

                // Update Database
                await db.execute(
                    `UPDATE sensores 
                     SET cache_nivel = ?, 
                         cache_status = ?, 
                         last_sync = NOW() 
                     WHERE devId = ?`,
                    [
                        status.current_level,
                        JSON.stringify(status),
                        sensor.devId
                    ]
                );

                // console.log(`[Worker] Sensor ${sensor.devId} atualizado.`);
            } catch (err) {
                console.error(`[Worker] Falha ao atualizar sensor ${sensor.devId}:`, err.message);
                // Continue to next sensor
            }
        }

        console.log('[Worker] Ciclo de sincronização finalizado.');

    } catch (error) {
        console.error('[Worker] Erro fatal no worker:', error);
    }
}

// Função de inicialização
function start() {
    console.log(`[Worker] Serviço de sincronização Tuya iniciado. Intervalo: ${SYNC_INTERVAL}`);

    // Executa imediatamente ao iniciar
    syncSensors();

    // Agenda o cronjob
    cron.schedule(SYNC_INTERVAL, syncSensors);
}

module.exports = { start };
