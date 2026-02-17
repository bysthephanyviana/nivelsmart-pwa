const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ message: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(403).json({ message: 'Formato de token inválido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido ou expirado' });
        }

        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
}

function isAdmin(req, res, next) {
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({ message: 'Acesso negado. Requer perfil de Administrador.' });
    }
    next();
}

module.exports = {
    verifyToken,
    isAdmin
};
