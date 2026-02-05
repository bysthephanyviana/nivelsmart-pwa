const { ALERT_CRITICAL, ALERT_LOW_LEVEL, ALERT_FULL, ALERT_OFFLINE } = require('./notificationTypes');

/**
 * Formata os dados brutos do sensor para um formato limpo e padronizado para o frontend.
 * Adiciona lógica de alertas baseada nos valores.
 * 
 * @param {Object} rawData - Dados vindos do DB (coluna cache_status) ou TuyaService
 * @param {string|Date} lastSync - Data da última sincronização
 * @returns {Object} Dados formatados
 */
exports.formatSensorData = (rawData, lastSync) => {

    // Tratamento para caso venha nulo
    if (!rawData) {
        return {
            nivel: 0,
            status_geral: 'OFFLINE',
            alerta: {
                ativo: true,
                tipo: ALERT_OFFLINE,
                mensagem: "Sensor desconectado ou sem dados."
            }
        };
    }

    const nivel = Number(rawData.current_level) || 0;
    const bombaLigada = rawData.manual_switch || rawData.bomba_ligada || false;

    // Define Status Geral e Alertas
    let statusGeral = 'NORMAL';
    let alerta = { ativo: false, tipo: null, mensagem: null };

    // Lógica de Alertas para sensores discretos (0, 25, 50, 75, 100)
    if (nivel === 25) {
        statusGeral = 'ATENCAO';
        alerta = {
            ativo: true,
            tipo: ALERT_LOW_LEVEL,
            titulo: "Nível Baixo",
            mensagem: `Atenção: Reservatório com apenas 25% de capacidade.`
        };
    } else if (nivel === 100) {
        statusGeral = 'CHEIO';
        alerta = {
            ativo: true, // Informativo, mas ativo para notificar
            tipo: ALERT_FULL,
            titulo: "Reservatório Cheio",
            mensagem: `Aviso: Reservatório completou (100%).`
        };
    } else if (nivel === 0) {
        statusGeral = 'CRITICO';
        alerta = {
            ativo: true,
            tipo: ALERT_CRITICAL,
            titulo: "Vazio!",
            mensagem: `O reservatório está vazio (0%).`
        };
    }

    // Verificação de Offline (ex: sem sync há mais de 10 min)
    if (lastSync) {
        const diffMs = new Date() - new Date(lastSync);
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins > 30) { // 30 minutos sem sinal
            statusGeral = 'OFFLINE';
            alerta = {
                ativo: true,
                tipo: ALERT_OFFLINE,
                titulo: "Sensor Offline",
                mensagem: `Sem comunicação com o sensor há ${diffMins} minutos.`
            };
        }
    }

    // Retorno Limpo
    return {
        nivel: nivel,
        volume_estimado: rawData.volume_estimado || null,
        bomba: bombaLigada,
        modo_operacao: rawData.work_mode,

        status: statusGeral,

        // Objeto de Alerta 
        notificacao: alerta,

        // Metadados
        online: statusGeral !== 'OFFLINE',
        ultima_atualizacao: lastSync || new Date(),
    };
};
