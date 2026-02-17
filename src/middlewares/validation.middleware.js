const logger = require('../utils/logger');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errorMessages = error.details.map((detail) => detail.message);
            logger.warn(`Validation Error on ${req.originalUrl}: ${errorMessages.join(', ')}`);
            return res.status(400).json({
                message: 'Erro de validação',
                errors: errorMessages
            });
        }

        next();
    };
};

module.exports = validate;
