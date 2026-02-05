const db = require('../config/db');
const tuyaService = require('../services/tuya.service');

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

        // 1. Check if sensor exists in DB (optional security step, but good practice)
        // const [sensor] = await db.execute('SELECT * FROM sensores WHERE devId = ?', [devId]);
        // if (sensor.length === 0) return res.status(404).json({ message: 'Sensor não encontrado no sistema' });

        // 2. Fetch from Tuya
        const status = await tuyaService.getDeviceStatus(devId);

        res.json(status);
    } catch (error) {
        console.error('Sensor Status Error:', error.message);
        res.status(502).json({
            message: 'Erro ao comunicar com o sensor',
            error: error.message
        });
    }
};
