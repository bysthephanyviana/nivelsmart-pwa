const cron = require('node-cron');
const db = require('../config/db');
const tuyaService = require('../services/tuya.service');

// Intervalo de sincronização: a cada 60 segundos
// Pode ser '*/30 * * * * *' para 30 segundos
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

        // 2. Para cada sensor, buscar dados na Tuya e atualizar DB
        // Usamos Promise.allSettled para não parar se um falhar
        await Promise.allSettled(sensores.map(async (sensor) => {
            try {
                const status = await tuyaService.getDeviceStatus(sensor.devId);

                // Mapear campos para o banco
                // status.current_level -> cache_nivel
                // status completo -> cache_status

                await db.execute(
                    `UPDATE sensores 
                     SET cache_nivel = ?, 
                         cache_status = ?, 
                         last_sync = NOW() 
                     WHERE id = ?`,
                    [
                        status.current_level,
                        JSON.stringify(status),
                        sensor.id
                    ]
                );

                console.log(`[Worker] Sensor '${sensor.nome}' (${sensor.devId}) atualizado.`);

            } catch (err) {
                console.error(`[Worker] Falha ao atualizar sensor '${sensor.nome}' (${sensor.devId}):`, err.message);
            }
        }));

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
