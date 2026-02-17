const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');

exports.register = async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ message: 'Preencha todos os campos obrigatórios' });
        }

        // Check user existence
        const [existing] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(senha, 8);
        const userRole = 'USER'; // RBAC: Default role for all new registrations

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
                role: user.role,
                foto_url: user.foto_url // Include avatar in login response
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhuma imagem enviada' });
        }

        const userId = req.userId; // From authMiddleware
        const fotoUrl = `/uploads/avatars/${req.file.filename}`; // Relative path matches static serve

        await db.execute('UPDATE usuarios SET foto_url = ? WHERE id = ?', [fotoUrl, userId]);

        res.json({
            message: 'Foto de perfil atualizada!',
            foto_url: fotoUrl
        });

    } catch (error) {
        logger.error(`Avatar Upload Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao salvar imagem' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const [users] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (users.length === 0) {
            // Security: Don't reveal user doesn't exist
            return res.status(200).json({ message: 'Se o email existir, um link será enviado.' });
        }

        const user = users[0];
        const resetToken = require('crypto').randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 Hour

        await db.execute('UPDATE usuarios SET reset_token = ?, reset_expires = ? WHERE id = ?',
            [resetToken, expires, user.id]);

        // Send Email coverage
        await emailService.sendPasswordResetEmail(email, resetToken);

        res.status(200).json({ message: 'Se o email existir, um link será enviado.' });
    } catch (error) {
        logger.error(`Forgot Password Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao processar solicitação' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const [users] = await db.execute(
            'SELECT * FROM usuarios WHERE reset_token = ? AND reset_expires > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Token inválido ou expirado' });
        }

        const user = users[0];
        const hashedPassword = await bcrypt.hash(newPassword, 8);

        await db.execute(
            'UPDATE usuarios SET senha_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });

    } catch (error) {
        logger.error(`Reset Password Error: ${error.message}`);
        res.status(500).json({ message: 'Erro ao redefinir senha' });
    }
};
