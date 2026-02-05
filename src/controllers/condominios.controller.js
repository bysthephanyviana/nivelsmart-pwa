const db = require('../config/db');

exports.list = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM condominios');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar condomínios' });
    }
};

exports.create = async (req, res) => {
    try {
        const { nome, endereco } = req.body;
        if (!nome) return res.status(400).json({ message: 'Nome é obrigatório' });

        const [result] = await db.execute('INSERT INTO condominios (nome, endereco) VALUES (?, ?)', [nome, endereco]);
        res.status(201).json({ id: result.insertId, nome, endereco });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar condomínio' });
    }
};
