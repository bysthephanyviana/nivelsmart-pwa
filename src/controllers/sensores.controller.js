const db = require('../config/db');
const tuyaService = require('../services/tuya.service');
const { formatSensorData } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

// Simple In-Memory Cache (Global)
const sensorCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 Seconds

// Request Deduping (Promise Cache)
const pendingRequests = new Map();

// Helper to fetch single sensor data (Cache-First + Smart Invalidation + Deduping)
async function fetchSensorData(devId) {
    const now = Date.now();

    // 1. Check Memory Cache
    if (sensorCache.has(devId)) {
        const { data, timestamp, ttl } = sensorCache.get(devId); // Get unique TTL
        const effectiveTTL = ttl || CACHE_TTL_MS; // Fallback to default

        // Verify TTL
        if (now - timestamp < effectiveTTL) {
            // Debug log commented out to reduce noise
            // console.log(`[CACHE HIT] - ${devId}`);
            return data;
        } else {
            logger.info(`[CACHE EXPIRED] - ${devId} (TTL ${effectiveTTL / 1000}s)`);
            sensorCache.delete(devId);
        }
    }

    // 2. Check Pending Requests (Deduping)
    if (pendingRequests.has(devId)) {
        logger.info(`[DEDUP] - Aguardando requisição já em andamento para ${devId}`);
        return pendingRequests.get(devId);
    }

    // 3. Define the Fetch Operation
    const fetchPromise = (async () => {
        let rawData = null;
        let lastSync = null;

        try {
            logger.info(`[API FETCH] - Consultando Tuya para ${devId}`);
            rawData = await tuyaService.getDeviceStatus(devId);
            lastSync = new Date();

            // Save to DB (Background Backup)
            db.execute(
                'UPDATE sensores SET cache_nivel = ?, cache_status = ?, last_sync = NOW() WHERE devId = ?',
                [rawData.current_level, JSON.stringify(rawData), devId]
            ).catch(e => logger.error(`[Cache] Error saving for ${devId}: ${e.message}`));

            // Smart Caching Logic
            const formattedData = formatSensorData(rawData, lastSync);

            // CRITICAL CHECK: Dynamic TTL Strategy
            const isCritical =
                formattedData.nivel <= 25 ||
                formattedData.nivel >= 98 ||
                formattedData.bomba === true ||
                formattedData.status !== 'NORMAL';

            let currentTTL = CACHE_TTL_MS;

            if (isCritical) {
                currentTTL = 10 * 1000; // 10 Seconds Micro-Cache for Emergencies
                logger.warn(`[CRITICAL STATE] - ${devId} (Nível: ${formattedData.nivel}%). Cache reduzido para 10s.`);
            } else {
                logger.info(`[CACHE SET] - ${devId} Cache padrão 60s.`);
            }

            // Always Cache (Protection against Tuya Rate Limit)
            sensorCache.set(devId, {
                data: formattedData,
                timestamp: Date.now(),
                ttl: currentTTL
            });

            return formattedData;

        } catch (error) {
            logger.error(`[Tuya] Error fetching ${devId}: ${error.message}`);

            // Fallback to DB Cache if Tuya fails
            const [rows] = await db.execute(
                'SELECT cache_status, last_sync FROM sensores WHERE devId = ?',
                [devId]
            );
            if (rows.length > 0 && rows[0].cache_status) {
                logger.warn(`[CACHE FALLBACK] - Usando dados antigos do banco para ${devId}`);
                rawData = rows[0].cache_status;
                lastSync = rows[0].last_sync;
                return formatSensorData(rawData, lastSync);
            }
            return null;
        } finally {
            // Remove from pending requests regardless of success/fail
            pendingRequests.delete(devId);
        }
    })();

    // Store the promise
    pendingRequests.set(devId, fetchPromise);

    return fetchPromise;
}

exports.vincular = async (req, res) => {
    try {
        const { reservatorio_id, devId, nome } = req.body;
        const userId = req.userId; // From Auth Middleware
        const userRole = req.userRole;

        if (!reservatorio_id || !devId) return res.status(400).json({ message: 'Reservatório e DevID obrigatórios' });

        // SECURITY FIX 1: Verify valid reservoir ownership (Multi-Tenant)
        // Join with condominios to check usuario_id
        if (userRole !== 'ADMIN') {
            const [resPerm] = await db.execute(`
                SELECT r.id 
                FROM reservatorios r
                JOIN condominios c ON r.condominio_id = c.id
                WHERE r.id = ? AND c.usuario_id = ?
            `, [reservatorio_id, userId]);

            if (resPerm.length === 0) {
                return res.status(403).json({ message: 'Acesso negado: Você não tem permissão neste reservatório.' });
            }
        }

        // SECURITY FIX 2: Check if devId already exists (Prevent Duplicates/Hijack)
        const [existing] = await db.execute('SELECT id FROM sensores WHERE devId = ?', [devId]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Este sensor (DevID) já está cadastrado no sistema.' });
        }

        // SECURITY FIX 3: Verify if devId exists in Tuya Cloud (Prevent Fake IDs)
        try {
            // Check existence by trying to fetch its status
            await tuyaService.getDeviceStatus(devId);
        } catch (e) {
            logger.warn(`Tentativa de vincular sensor inexistente: ${devId} - User: ${userId}`);
            return res.status(400).json({ message: 'ID do sensor inválido ou não encontrado na nuvem Tuya.' });
        }

        const [result] = await db.execute(
            'INSERT INTO sensores (reservatorio_id, devId, nome, usuario_id) VALUES (?, ?, ?, ?)',
            [reservatorio_id, devId, nome, userId]
        );
        res.status(201).json({ id: result.insertId, reservatorio_id, devId, nome, usuario_id: userId });
    } catch (error) {
        logger.error(`Vincular Sensor Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao vincular sensor' });
    }
};

exports.listByReservatorio = async (req, res) => {
    try {
        const { reservatorio_id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;

        // SECURITY FIX: Verify valid reservoir ownership (Multi-Tenant)
        // Only allow if admin or if condominium belongs to user
        if (userRole !== 'ADMIN') {
            const [resPerm] = await db.execute(`
                SELECT r.id 
                FROM reservatorios r
                JOIN condominios c ON r.condominio_id = c.id
                WHERE r.id = ? AND c.usuario_id = ?
            `, [reservatorio_id, userId]);

            if (resPerm.length === 0) {
                return res.status(403).json({ message: 'Acesso negado: Você não tem permissão neste reservatório.' });
            }
        }

        // READ-ONLY FROM DB (High Performance)
        const [sensors] = await db.execute('SELECT * FROM sensores WHERE reservatorio_id = ?', [reservatorio_id]);

        if (sensors.length === 0) return res.json([]);

        // Format data from DB cache
        const results = sensors.map(sensor => {
            let statusData = null;
            if (sensor.cache_status) {
                try {
                    const parsed = typeof sensor.cache_status === 'string' ? JSON.parse(sensor.cache_status) : sensor.cache_status;
                    // Use helper or return raw logic depending on needs. 
                    // Using formatSensorData is safer if imported, but cache_status usually holds the raw-ish object with mapped keys.
                    // Let's assume cache_status is already the good JSON from the worker.
                    statusData = parsed;
                } catch (e) {
                    logger.warn(`Error parsing cache for sensor ${sensor.id}`);
                }
            }

            return {
                ...sensor,
                // Ensure we return the formatted structure the frontend expects
                status_data: statusData ? formatSensorData(statusData, sensor.last_sync) : null
            };
        });

        res.json(results);
    } catch (error) {
        logger.error(`List Sensores Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar sensores' });
    }
};

exports.listByUser = async (req, res) => {
    try {
        const userId = req.userId;

        // READ-ONLY FROM DB
        const [sensors] = await db.execute('SELECT * FROM sensores WHERE usuario_id = ?', [userId]);

        if (sensors.length === 0) return res.json([]);

        const results = sensors.map(sensor => {
            let statusData = null;
            if (sensor.cache_status) {
                try {
                    const parsed = typeof sensor.cache_status === 'string' ? JSON.parse(sensor.cache_status) : sensor.cache_status;
                    statusData = parsed;
                } catch (e) { }
            }

            return {
                ...sensor,
                status_data: statusData ? formatSensorData(statusData, sensor.last_sync) : null
            };
        });

        res.json(results);
    } catch (error) {
        logger.error(`List By User Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao listar seus sensores' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        // Fetch sensor & verify ownership
        const [rows] = await db.execute('SELECT * FROM sensores WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Sensor não encontrado' });

        const sensor = rows[0];
        // Allow Admin (role='admin') or Owner
        if (req.userRole !== 'ADMIN' && sensor.usuario_id !== userId) {
            return res.status(403).json({ message: 'Acesso negado a este sensor' });
        }

        // READ-ONLY FROM DB
        let statusData = null;
        if (sensor.cache_status) {
            try {
                const parsed = typeof sensor.cache_status === 'string' ? JSON.parse(sensor.cache_status) : sensor.cache_status;
                statusData = formatSensorData(parsed, sensor.last_sync);
            } catch (e) { }
        }

        res.json({
            ...sensor,
            data: statusData
        });

    } catch (error) {
        logger.error(`Get By ID Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar sensor' });
    }
};

// Legacy/Direct endpoint
exports.getStatus = async (req, res) => {
    try {
        const { devId } = req.params;
        const data = await fetchSensorData(devId);
        if (!data) return res.status(502).json({ message: 'Erro ao obter dados do sensor' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro interno' });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, devId } = req.body;
        const userId = req.userId;

        // Verify ownership
        const [check] = await db.execute('SELECT id FROM sensores WHERE id = ? AND usuario_id = ?', [id, userId]);
        if (check.length === 0 && req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Acesso negado' });

        await db.execute('UPDATE sensores SET nome = ?, devId = ? WHERE id = ?', [nome, devId, id]);
        res.json({ id, nome, devId });
    } catch (error) {
        logger.error(`Update Sensor Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao atualizar sensor' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        // Verify ownership
        const [check] = await db.execute('SELECT id FROM sensores WHERE id = ? AND usuario_id = ?', [id, userId]);
        if (check.length === 0 && req.userRole !== 'ADMIN') return res.status(403).json({ message: 'Acesso negado' });

        await db.execute('DELETE FROM sensores WHERE id = ?', [id]);
        res.json({ message: 'Sensor excluído com sucesso' });
    } catch (error) {
        logger.error(`Delete Sensor Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir sensor' });
    }
};

/**
 * Endpoint para listar dispositivos Tuya disponíveis para cadastro
 */
exports.listAvailable = async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch devices from Tuya API via Service
        // We pass userId just in case we enhance service to support multi-account map in future
        const devices = await tuyaService.getUserDevices(userId);

        // Filter out devices already registered in our DB to avoid duplicates
        // We need to check all sensors in DB
        const [registered] = await db.execute('SELECT devId FROM sensores');
        const registeredIds = new Set(registered.map(r => r.devId));

        const available = devices.map(d => ({
            ...d,
            is_registered: registeredIds.has(d.id)
        }));

        res.json(available);
    } catch (error) {
        logger.error(`Discovery Error: ${error.message}`);
        res.status(502).json({ message: 'Erro ao buscar dispositivos na Tuya' });
    }
};
