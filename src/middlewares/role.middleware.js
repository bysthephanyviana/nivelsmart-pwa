const logger = require('../utils/logger');

/**
 * Middleware para autorização baseada em cargos (RBAC).
 * @param {Array<string>} roles - Lista de cargos permitidos (ex: ['ADMIN', 'USER'])
 */
exports.authorizeRole = (roles) => {
    return (req, res, next) => {
        // req.userRole é populado pelo auth.middleware.js após verificar o JWT
        if (!req.userRole) {
            return res.status(401).json({ message: 'Acesso não autorizado: Cargo não definido.' });
        }

        if (!roles.includes(req.userRole)) {
            logger.warn(`Acesso negado: Usuário ${req.userId} com cargo '${req.userRole}' tentou acessar rota restrita a ${roles}`);
            return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para realizar esta ação.' });
        }

        next();
    };
};
