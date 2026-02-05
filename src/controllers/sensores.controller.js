const db = require('../config/db');
const tuyaService = require('../services/tuya.service');
const { formatSensorData } = require('../utils/responseFormatter');

exports.vincular = async (req, res) => {
    try {
        const { reservatorio_id, devId, nome } = req.body;
        if (!reservatorio_id || !devId) return res.status(400).json({ message: 'Reservatório e DevID obrigatórios' });

        // Check if devId already exists
        const [existing] = await db.execute('SELECT id FROM sensores WHERE devId = ?', [devId]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Este sensor já está vinculado' });
        }

        const [result] = await db.execute(
            'INSERT INTO sensores (reservatorio_id, devId, nome) VALUES (?, ?, ?)',
            [reservatorio_id, devId, nome]
        );
        res.status(201).json({ id: result.insertId, reservatorio_id, devId, nome });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao vincular sensor' });
    }
};

exports.listByReservatorio = async (req, res) => {
    try {
        const { reservatorio_id } = req.params;
        const [rows] = await db.execute('SELECT * FROM sensores WHERE reservatorio_id = ?', [reservatorio_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar sensores' });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const { devId } = req.params;

        // 1. Tentar buscar do CACHE do banco primeiro (Cache-First)
        const [rows] = await db.execute(
            'SELECT cache_status, last_sync FROM sensores WHERE devId = ?',
            [devId]
        );

        let rawData = null;
        let lastSync = null;

        if (rows.length > 0 && rows[0].cache_status) {
            // Cache Hit
            rawData = rows[0].cache_status;
            lastSync = rows[0].last_sync;
        } else {
            // Cache Miss (Fallback Tuya)
            console.log(`[API] Cache miss para ${devId}. Buscando na Tuya...`);
            try {
                rawData = await tuyaService.getDeviceStatus(devId);

                // Salva no banco para a próxima (Async)
                db.execute(
                    'UPDATE sensores SET cache_nivel = ?, cache_status = ?, last_sync = NOW() WHERE devId = ?',
                    [rawData.current_level, JSON.stringify(rawData), devId]
                ).catch(e => console.error('Erro ao salvar cache fallback:', e));

                lastSync = new Date(); // Acabou de buscar
            } catch (tuyaError) {
                console.error('Erro ao buscar na Tuya (Fallback):', tuyaError.message);
                // Se falhar na Tuya também, rawData continua null
            }
        }

        // 2. Formatar Resposta (Limpeza + Alertas)
        const response = formatSensorData(rawData, lastSync);

        res.json(response);

    } catch (error) {
        console.error('Sensor Status Error:', error.message);
        res.status(502).json({
            message: 'Erro ao processar status do sensor',
            error: error.message
        });
    }
};
