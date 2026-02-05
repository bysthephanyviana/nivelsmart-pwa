const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { nome, email, senha, role } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos obrigatórios' });
        }

        // Check user existence
        const [existing] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(senha, 8);
        const userRole = role || 'tecnico'; // Default role

        await db.execute('INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)',
            [nome, email, hashedPassword, userRole]);

        res.status(201).json({ message: 'Usuário criado com sucesso' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        const [users] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const user = users[0];
        const isValid = await bcrypt.compare(senha, user.senha_hash);

        if (!isValid) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '24h' // Token validity
        });

        res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};
