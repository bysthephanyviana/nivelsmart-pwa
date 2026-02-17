const db = require('../config/db');
const logger = require('../utils/logger');

exports.list = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;

        let query = `
            SELECT 
                c.*, 
                r.id as res_id, r.nome as res_nome, r.capacidade_litros,
                s.id as sensor_id, s.nome as sensor_nome, s.cache_nivel as nivel, s.last_sync as ultima_atualizacao,
                s.cache_status
            FROM condominios c
            LEFT JOIN reservatorios r ON c.id = r.condominio_id
            LEFT JOIN sensores s ON r.id = s.reservatorio_id
        `;

        let params = [];

        if (userRole !== 'ADMIN') {
            query += ' WHERE c.usuario_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY c.id DESC, r.id ASC';

        const [rows] = await db.execute(query, params);

        // Process flat rows into nested structure
        const condominiosMap = new Map();

        rows.forEach(row => {
            if (!condominiosMap.has(row.id)) {
                condominiosMap.set(row.id, {
                    id: row.id,
                    nome: row.nome,
                    endereco: row.endereco,
                    usuario_id: row.usuario_id,
                    reservatorios: []
                });
            }

            const condominio = condominiosMap.get(row.id);

            if (row.res_id) {
                // Check if reservoir already added
                let reservatorio = condominio.reservatorios.find(r => r.id === row.res_id);
                if (!reservatorio) {
                    reservatorio = {
                        id: row.res_id,
                        nome: row.res_nome,
                        capacidade: row.capacidade_litros,
                        sensores: []
                    };
                    condominio.reservatorios.push(reservatorio);
                }

                if (row.sensor_id) {
                    let isOnline = false;
                    let sensorStatus = 'DESCONHECIDO';

                    // Parse cache_status safely
                    if (row.cache_status) {
                        try {
                            const statusData = typeof row.cache_status === 'string'
                                ? JSON.parse(row.cache_status)
                                : row.cache_status;

                            // Check explicit online flag from Tuya Service update
                            if (statusData.online !== undefined) {
                                isOnline = statusData.online;
                            } else {
                                // Fallback: check if data is recent (e.g. < 30 mins)
                                // But honestly, relying on the 'online' flag we just added is better.
                                // If undefined, assume false to be safe/conservative
                            }
                        } catch (e) {
                            console.error('Error parsing cache_status for list:', e);
                        }
                    }

                    reservatorio.sensores.push({
                        id: row.sensor_id,
                        nome: row.sensor_nome,
                        nivel: row.nivel || 0,
                        status: sensorStatus,
                        online: isOnline,
                        updatedAt: row.ultima_atualizacao
                    });
                }
            }
        });

        res.json(Array.from(condominiosMap.values()));
    } catch (error) {
        logger.error(`List Condominios Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar condomínios' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;

        let query = 'SELECT * FROM condominios WHERE id = ?';
        let params = [id];

        // If not admin, ensure ownership
        if (userRole !== 'ADMIN') {
            query += ' AND usuario_id = ?';
            params.push(userId);
        }

        const [rows] = await db.execute(query, params);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Condomínio não encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        logger.error(`Get Condo Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar condomínio' });
    }
};

exports.create = async (req, res) => {
    try {
        const { nome, endereco } = req.body;
        const userId = req.userId; // From Auth Middleware

        if (!nome) return res.status(400).json({ message: 'Nome é obrigatório' });

        const [result] = await db.execute(
            'INSERT INTO condominios (nome, endereco, usuario_id) VALUES (?, ?, ?)',
            [nome, endereco, userId]
        );
        res.status(201).json({ id: result.insertId, nome, endereco, usuario_id: userId });
    } catch (error) {
        logger.error(`Create Condo Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao criar condomínio' });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, endereco } = req.body;
        const userId = req.userId;
        const userRole = req.userRole;

        // Verify ownership
        if (userRole !== 'ADMIN') {
            const [check] = await db.execute('SELECT id FROM condominios WHERE id = ? AND usuario_id = ?', [id, userId]);
            if (check.length === 0) return res.status(403).json({ message: 'Acesso negado' });
        }

        await db.execute('UPDATE condominios SET nome = ?, endereco = ? WHERE id = ?', [nome, endereco, id]);
        res.json({ id, nome, endereco });
    } catch (error) {
        logger.error(`Update Condo Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao atualizar condomínio' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;

        // Verify ownership
        if (userRole !== 'ADMIN') {
            const [check] = await db.execute('SELECT id FROM condominios WHERE id = ? AND usuario_id = ?', [id, userId]);
            if (check.length === 0) return res.status(403).json({ message: 'Acesso negado' });
        }

        await db.execute('DELETE FROM condominios WHERE id = ?', [id]);
        res.json({ message: 'Condomínio excluído com sucesso' });
    } catch (error) {
        logger.error(`Delete Condo Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir condomínio' });
    }
};

exports.createWizard = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { nome, endereco, reservatorios } = req.body;
        const userId = req.userId;

        // 1. Create Condominium
        const [condoResult] = await connection.execute(
            'INSERT INTO condominios (nome, endereco, usuario_id) VALUES (?, ?, ?)',
            [nome, endereco, userId]
        );
        const condominioId = condoResult.insertId;

        // 2. Process Reservoirs
        if (reservatorios && Array.isArray(reservatorios)) {
            for (const resData of reservatorios) {
                const [resResult] = await connection.execute(
                    'INSERT INTO reservatorios (condominio_id, nome, capacidade_litros) VALUES (?, ?, ?)',
                    [condominioId, resData.nome, resData.capacidade]
                );
                const reservatorioId = resResult.insertId;

                // 3. Process Sensor for this Reservoir
                if (resData.sensor && resData.sensor.devId) {
                    // Check duplicate
                    const [existing] = await connection.execute('SELECT id FROM sensores WHERE devId = ?', [resData.sensor.devId]);
                    if (existing.length > 0) {
                        throw new Error(`Sensor ${resData.sensor.devId} já está em uso.`);
                    }

                    await connection.execute(
                        'INSERT INTO sensores (reservatorio_id, devId, nome, usuario_id) VALUES (?, ?, ?, ?)',
                        [reservatorioId, resData.sensor.devId, resData.sensor.nome || 'Sensor Principal', userId]
                    );
                }
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Cadastro completo realizado com sucesso', condominioId });
    } catch (error) {
        await connection.rollback();
        logger.error(`Wizard Error: ${error.message}`);
        res.status(400).json({ message: error.message || 'Erro ao processar cadastro' });
    } finally {
        connection.release();
    }
};
