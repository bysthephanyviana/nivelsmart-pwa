const db = require('../config/db');
const logger = require('../utils/logger');

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM reservatorios WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Reservatório não encontrado' });
        res.json(rows[0]);
    } catch (error) {
        logger.error(`Get Res Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar reservatório' });
    }
};

exports.listByCondominio = async (req, res) => {
    try {
        const { condominio_id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;

        // SECURITY FIX: Verify if user owns the condominium (Multi-Tenant Isolation)
        if (userRole !== 'ADMIN') {
            const [condo] = await db.execute('SELECT id FROM condominios WHERE id = ? AND usuario_id = ?', [condominio_id, userId]);
            if (condo.length === 0) {
                return res.status(403).json({ message: 'Acesso negado: Você não é dono deste condomínio.' });
            }
        }

        const [rows] = await db.execute('SELECT * FROM reservatorios WHERE condominio_id = ?', [condominio_id]);
        res.json(rows);
    } catch (error) {
        logger.error(`List Reservatorios Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao buscar reservatórios' });
    }
};

exports.create = async (req, res) => {
    try {
        const { condominio_id, nome, capacidade_litros } = req.body;
        const userId = req.userId;
        const userRole = req.userRole;

        if (!condominio_id || !nome) return res.status(400).json({ message: 'Dados incompletos' });

        // SECURITY FIX: Verify if user owns the condominium (Multi-Tenant Isolation)
        if (userRole !== 'ADMIN') {
            const [condo] = await db.execute('SELECT id FROM condominios WHERE id = ? AND usuario_id = ?', [condominio_id, userId]);
            if (condo.length === 0) {
                return res.status(403).json({ message: 'Acesso negado: Você não é dono deste condomínio.' });
            }
        }

        const [result] = await db.execute(
            'INSERT INTO reservatorios (condominio_id, nome, capacidade_litros) VALUES (?, ?, ?)',
            [condominio_id, nome, capacidade_litros]
        );
        res.status(201).json({ id: result.insertId, condominio_id, nome, capacidade_litros });
    } catch (error) {
        logger.error(`Create Res Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao criar reservatório' });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, capacidade_litros } = req.body;
        const userId = req.userId;
        const userRole = req.userRole;

        // SECURITY FIX: Verify ownership
        if (userRole !== 'ADMIN') {
            const [check] = await db.execute(`
                SELECT r.id 
                FROM reservatorios r
                JOIN condominios c ON r.condominio_id = c.id
                WHERE r.id = ? AND c.usuario_id = ?
            `, [id, userId]);

            if (check.length === 0) {
                return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para alterar este reservatório.' });
            }
        }

        await db.execute(
            'UPDATE reservatorios SET nome = ?, capacidade_litros = ? WHERE id = ?',
            [nome, capacidade_litros, id]
        );
        res.json({ id, nome, capacidade_litros });
    } catch (error) {
        logger.error(`Update Res Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao atualizar reservatório' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;

        // SECURITY FIX: Verify ownership
        if (userRole !== 'ADMIN') {
            const [check] = await db.execute(`
                SELECT r.id 
                FROM reservatorios r
                JOIN condominios c ON r.condominio_id = c.id
                WHERE r.id = ? AND c.usuario_id = ?
            `, [id, userId]);

            if (check.length === 0) {
                return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para excluir este reservatório.' });
            }
        }

        await db.execute('DELETE FROM reservatorios WHERE id = ?', [id]);
        res.json({ message: 'Reservatório excluído com sucesso' });
    } catch (error) {
        logger.error(`Delete Res Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao excluir reservatório' });
    }
};
