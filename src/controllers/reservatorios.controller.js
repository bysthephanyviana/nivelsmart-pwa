const db = require('../config/db');

exports.listByCondominio = async (req, res) => {
    try {
        const { condominio_id } = req.params;
        const [rows] = await db.execute('SELECT * FROM reservatorios WHERE condominio_id = ?', [condominio_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar reservatórios' });
    }
};

exports.create = async (req, res) => {
    try {
        const { condominio_id, nome, capacidade_litros } = req.body;
        if (!condominio_id || !nome) return res.status(400).json({ message: 'Dados incompletos' });

        const [result] = await db.execute(
            'INSERT INTO reservatorios (condominio_id, nome, capacidade_litros) VALUES (?, ?, ?)',
            [condominio_id, nome, capacidade_litros]
        );
        res.status(201).json({ id: result.insertId, condominio_id, nome, capacidade_litros });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar reservatório' });
    }
};
