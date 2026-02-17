const Joi = require('joi');

const schemas = {
    // Auth
    register: Joi.object({
        nome: Joi.string().min(3).required().messages({
            'string.empty': 'Nome é obrigatório',
            'string.min': 'Nome deve ter no mínimo 3 caracteres'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Email inválido',
            'any.required': 'Email é obrigatório'
        }),
        senha: Joi.string().min(6).required().messages({
            'string.min': 'Senha deve ter no mínimo 6 caracteres',
            'any.required': 'Senha é obrigatória'
        }),
        telefone: Joi.string().optional().allow('')
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        senha: Joi.string().required()
    }),

    // Data Models
    condominio: Joi.object({
        nome: Joi.string().min(3).required(),
        endereco: Joi.string().optional().allow('')
    }),

    reservatorio: Joi.object({
        condominio_id: Joi.number().integer().required(),
        nome: Joi.string().required(),
        capacidade_litros: Joi.number().min(1).required()
    }),

    // Update Reservoir (condominio_id not usually updatable, but name/capacity are)
    reservatorioUpdate: Joi.object({
        nome: Joi.string().required(),
        capacidade_litros: Joi.number().min(1).required()
    }),

    sensorBind: Joi.object({
        reservatorio_id: Joi.number().integer().required(),
        devId: Joi.string().min(5).required(), // Tuya IDs are usually long
        nome: Joi.string().required()
    }),

    sensorUpdate: Joi.object({
        nome: Joi.string().required(),
        devId: Joi.string().min(5).required()
    })
};

module.exports = schemas;
