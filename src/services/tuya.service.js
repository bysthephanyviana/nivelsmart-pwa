const tuya = require('../config/tuya');

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

    console.log(`[Tuya Service] Buscando dados para: '${cleanId}'`);

    const path = `/v1.0/devices/${cleanId}/status`;
    const response = await tuya.request('GET', path);

    if (!response || !response.success) {
        console.error(`[Tuya Service] Erro:`, response);
        throw new Error(response ? response.msg : 'Erro na comunicação com Tuya');
    }

    const dps = response.result; // Array [{code: '101', value: 50}, ...]

    // Log para verificação dos códigos reais retornados
    console.log('[Tuya Service] Resposta Bruta:', JSON.stringify(dps));

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

        // 3. Fallbacks Específicos para Firmware "Temperature" (Identificado nos logs)
        if (codeKey === 'CURRENT_LEVEL' && rawMap['temp_current'] !== undefined) return rawMap['temp_current'];
        if (codeKey === 'LEVEL_OFF' && rawMap['temp_set'] !== undefined) return rawMap['temp_set'];
        if (codeKey === 'MANUAL_SWITCH' && rawMap['switch'] !== undefined) return rawMap['switch'];

        // Fallback genérico para chaves de string direta (ex: rawMap['level_current']) se não mapeado
        return undefined;
    };

    // Construção do objeto formatado conforme solicitado (Interface do App)
    const formatted = {
        current_level: getVal('CURRENT_LEVEL') ?? 0,
        work_mode: translateWorkMode(getVal('WORK_MODE') ?? 'Unknown'),
        level_on: getVal('LEVEL_ON') ?? 0,
        level_off: getVal('LEVEL_OFF') ?? 0,
        dry_heat_protect: !!getVal('DRY_HEAT_PROTECT'),
        alarm_enable: !!getVal('ALARM_ENABLE'),
        alarm_low_level: getVal('ALARM_LOW') ?? 0,
        alarm_high_level: getVal('ALARM_HIGH') ?? 0,
        ch1_time_delay: getVal('CH1_TIME_DELAY') ?? 0,
        sensor_status: rawMap['fault'] ? 'Error' : 'Normal', // Verifica flag de fault padrão
        running_time: 0, // Geralmente calculado localmente ou outro DP

        // Mantendo compatibilidade com código antigo (Português)
        nivel_percentual: getVal('CURRENT_LEVEL') ?? 0,
        bomba_ligada: !!getVal('MANUAL_SWITCH'), // Status da chave
        alarme_ativo: !!getVal('ALARM_ENABLE'),

        // Dados brutos para debug
        _raw: rawMap
    };

    console.log(`[Tuya Service] Status Processado: Nível ${formatted.current_level}% | Modo: ${formatted.work_mode}`);

    return formatted;
}

module.exports = {
    getDeviceStatus
};
