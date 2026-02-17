const tuya = require('../config/tuya');
const logger = require('../utils/logger'); // Added logger

// Mapeamento de DPs (Data Points) para o controlador de nível WF96L
// Baseado nos códigos padrão para este dispositivo.
const DP_CODES = {
    CURRENT_LEVEL: '101',      // Nível Atual (%)
    LEVEL_ON: '102',           // Nível Ligar (Início)
    LEVEL_OFF: '103',          // Nível Desligar (Parada)
    ALARM_LOW: '104',          // Alarme Nível Baixo
    ALARM_HIGH: '105',         // Alarme Nível Alto
    ALARM_ENABLE: '106',       // Habilitar Alarme (Bool)
    MANUAL_SWITCH: '107',      // Interruptor Manual
    WORK_MODE: '108',          // Modo de Trabalho (Enum: Add Water, etc)
    DRY_HEAT_PROTECT: '109',   // Proteção Aquecimento a Seco (Bool)
    CH1_TIME_DELAY: '110',     // Atraso CH1 (Segundos?)
    BUZZER: '113',             // Buzzer/Alarme Sonoro
    SENSOR_FAULT: '104'        // Às vezes falha vem num código específico ou via 'fault'
};

// Mapa de status padrão v2 (caso venha com nomes em vez de IDs)
const STANDARD_CODES = {
    'level_percent': 'CURRENT_LEVEL',
    'mode': 'WORK_MODE',
    'work_mode': 'WORK_MODE'
};

/**
 * Traduz o código de Work Mode para texto legível
 * @param {string|number} value 
 */
function translateWorkMode(value) {
    // Esses valores variam por firmware. Ajustar conforme observado nos logs.
    const modes = {
        '0': 'Add Water',
        '1': 'Pump Water',
        'add_water': 'Add Water',
        'pump_water': 'Pump Water',
        'add_water_time': 'Add Water+Time'
    };
    return modes[String(value).toLowerCase()] || String(value);
}

/**
 * Consulta status do dispositivo na Tuya e formata como no App
 * @param {string} devId - ID do dispositivo Tuya
 */
async function getDeviceStatus(devId) {
    const cleanId = String(devId).trim();
    if (!cleanId) throw new Error('ID do sensor inválido (vazio)');

    logger.debug(`[Tuya Service] Buscando dados para: '${cleanId}'`);

    // Use details endpoint to get both status (DPs) and online state
    const path = `/v1.0/devices/${cleanId}`;
    const response = await tuya.request('GET', path);

    if (!response || !response.success) {
        logger.error(`[Tuya Service] Erro API: ${JSON.stringify(response)}`);
        throw new Error(response ? response.msg : 'Erro na comunicação com Tuya');
    }

    const deviceResult = response.result;
    const dps = deviceResult.status; // Array [{code: '101', value: 50}, ...]
    const isOnline = deviceResult.online;

    // Log para verificação
    // logger.debug(`[Tuya Service] Resposta: Online=${isOnline}, DPs=${JSON.stringify(dps)}`);

    // Converter array para objeto flat map
    const rawMap = {};
    if (Array.isArray(dps)) {
        dps.forEach(dp => {
            rawMap[dp.code] = dp.value;
        });
    }

    // Helper para buscar valor por chave numérica ou string padrão
    const getVal = (codeKey) => {
        const id = DP_CODES[codeKey];
        // 1. Tenta pelo ID numérico (ex: '101')
        if (rawMap[id] !== undefined) return rawMap[id];

        // 2. Tenta encontrar por chaves de string padrão do nosso mapa
        for (const [key, val] of Object.entries(rawMap)) {
            if (STANDARD_CODES[key] === codeKey) return val;
        }

        // 3. Fallbacks Específicos para Firmware "Temperature"
        if (codeKey === 'CURRENT_LEVEL' && rawMap['temp_current'] !== undefined) return rawMap['temp_current'];
        if (codeKey === 'LEVEL_OFF' && rawMap['temp_set'] !== undefined) return rawMap['temp_set'];
        if (codeKey === 'MANUAL_SWITCH' && rawMap['switch'] !== undefined) return rawMap['switch'];

        return undefined;
    };

    // Construção do objeto formatado
    const formatted = {
        current_level: getVal('CURRENT_LEVEL') ?? 0,
        work_mode: translateWorkMode(getVal('WORK_MODE') ?? 'Automático'),
        level_on: getVal('LEVEL_ON') ?? 0,
        level_off: getVal('LEVEL_OFF') ?? 0,
        dry_heat_protect: !!getVal('DRY_HEAT_PROTECT'),
        alarm_enable: !!getVal('ALARM_ENABLE'),
        alarm_low_level: getVal('ALARM_LOW') ?? 0,
        alarm_high_level: getVal('ALARM_HIGH') ?? 0,
        ch1_time_delay: getVal('CH1_TIME_DELAY') ?? 0,
        sensor_status: rawMap['fault'] ? 'Error' : 'Normal',
        running_time: 0,

        // Mantendo compatibilidade
        nivel_percentual: getVal('CURRENT_LEVEL') ?? 0,
        bomba_ligada: !!getVal('MANUAL_SWITCH'),
        alarme_ativo: !!getVal('ALARM_ENABLE'),

        // Helper fields
        online: isOnline, // Explicit online status from Cloud
        _raw: rawMap
    };

    logger.debug(`[Tuya Service] Status Processado: Nível ${formatted.current_level}% | Online: ${isOnline}`);

    return formatted;
}

/**
 * Consulta status de múltiplos dispositivos em lote (Batch Fetch)
 * @param {Array<string>} devIds - Lista de IDs Tuya
 */
async function getBatchDeviceStatus(devIds) {
    if (!devIds || devIds.length === 0) return {};

    // Filter valid IDs and Dedupe
    const uniqueIds = [...new Set(devIds.filter(id => id && String(id).trim() !== ''))];
    if (uniqueIds.length === 0) return {};

    logger.info(`[Tuya Service] Buscando lote: ${uniqueIds.length} dispositivos`);

    // Tuya v1.0 devices status accepts comma separated IDs
    // Limit is usually 20-50 per call. We'll batch in chunks of 20 to be safe.
    const CHUNK_SIZE = 20;
    const results = {};

    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
        const idsStr = chunk.join(',');

        try {
            const path = `/v1.0/devices/status?device_ids=${idsStr}`;
            const response = await tuya.request('GET', path);

            if (response && response.success && response.result) {
                // response.result is an Object map: { "devId": [ {code, value}, ... ] }
                const resultMap = response.result;

                Object.keys(resultMap).forEach(devId => {
                    const statusArray = resultMap[devId];
                    if (Array.isArray(statusArray)) {
                        try {
                            // Map raw status to our result map
                            const rawMap = {};
                            statusArray.forEach(dp => rawMap[dp.code] = dp.value);

                            const getVal = (codeKey) => {
                                const id = DP_CODES[codeKey];
                                if (rawMap[id] !== undefined) return rawMap[id];
                                for (const [key, val] of Object.entries(rawMap)) {
                                    if (STANDARD_CODES[key] === codeKey) return val;
                                }
                                return undefined;
                            };

                            results[devId] = {
                                current_level: getVal('CURRENT_LEVEL') ?? 0,
                                work_mode: translateWorkMode(getVal('WORK_MODE') ?? 'Automático'),
                                level_on: getVal('LEVEL_ON') ?? 0,
                                level_off: getVal('LEVEL_OFF') ?? 0,
                                dry_heat_protect: !!getVal('DRY_HEAT_PROTECT'),
                                alarm_enable: !!getVal('ALARM_ENABLE'),
                                alarm_low_level: getVal('ALARM_LOW') ?? 0,
                                alarm_high_level: getVal('ALARM_HIGH') ?? 0,
                                ch1_time_delay: getVal('CH1_TIME_DELAY') ?? 0,
                                sensor_status: rawMap['fault'] ? 'Error' : 'Normal',
                                running_time: 0,
                                nivel_percentual: getVal('CURRENT_LEVEL') ?? 0,
                                bomba_ligada: !!getVal('MANUAL_SWITCH'),
                                alarme_ativo: !!getVal('ALARM_ENABLE'),
                                _raw: rawMap
                            };

                        } catch (e) {
                            logger.error(`[Tuya Service] Erro processando device ${devId} no lote: ${e.message}`);
                        }
                    }
                });
            } else {
                logger.warn(`[Tuya Service] Batch falhou para chunk: ${idsStr} - Resp: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            logger.error(`[Tuya Service] Erro na requisição batch: ${error.message}`);
        }
    }

    return results;
}

/**
 * Busca todos os dispositivos associados ao usuário configurado no projeto Tuya.
 * Útil para discovery (listar disponíveis para cadastro).
 */
async function getUserDevices(seedDeviceId = null) {
    let uid = null;
    let devices = [];

    // 1. Try to get UID from a known seed device (best for Smart Home projects)
    if (seedDeviceId) {
        try {
            logger.info(`[Tuya Service] Discovery: Buscando UID via dispositivo semente '${seedDeviceId}'...`);
            const details = await tuya.request('GET', `/v1.0/devices/${seedDeviceId}`);
            if (details.success && details.result.uid) {
                uid = details.result.uid;
                logger.info(`[Tuya Service] UID encontrado: ${uid}`);
            }
        } catch (e) {
            logger.warn(`[Tuya Service] Falha ao buscar UID do seed device: ${e.message}`);
        }
    }

    // 2. If UID found, list devices for that user
    if (uid) {
        try {
            logger.info(`[Tuya Service] Listando dispositivos do usuário ${uid}...`);
            const response = await tuya.request('GET', `/v1.0/users/${uid}/devices`);
            if (response.success) {
                devices = response.result; // Direct array for this endpoint
            } else {
                logger.warn(`[Tuya Service] Falha ao listar dispositivos do usuário: ${JSON.stringify(response)}`);
            }
        } catch (e) {
            logger.error(`[Tuya Service] Erro listing user devices: ${e.message}`);
        }
    }

    // 3. If no devices found yet, try Project Level Discovery (Fallback for Industry/Asset projects)
    if (devices.length === 0) {
        try {
            const path = `/v1.0/devices?page_no=1&page_size=50`;
            logger.info(`[Tuya Service] Tentando discovery nível de projeto: ${path}`);
            const response = await tuya.request('GET', path);
            if (response && response.success) {
                devices = response.result.devices || response.result;
            } else {
                // Suppress error if we already tried UID method, just log debug
                if (!uid) logger.warn(`[Tuya Service] Project discovery falhou: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            if (!uid) logger.error(`[Tuya Service] Erro no project discovery: ${error.message}`);
        }
    }

    // Format output
    logger.info(`[Tuya Service] Discovery finalizado. Encontrados ${devices?.length || 0} dispositivos.`);
    if (!Array.isArray(devices)) return [];

    return devices.map(d => ({
        name: d.name,
        id: d.id,
        category: d.category,
        product_name: d.product_name,
        status: d.status,
        online: d.online
    }));
}

module.exports = {
    getDeviceStatus,
    getBatchDeviceStatus,
    getUserDevices
};
