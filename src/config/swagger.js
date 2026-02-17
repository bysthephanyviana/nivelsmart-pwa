const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NivelSmart API',
            version: '1.0.0',
            description: 'API para monitoramento inteligente de reservatórios com integração Tuya',
            contact: {
                name: 'Equipe NivelSmart'
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor Local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Caminho para os arquivos de rotas onde estarão as anotações
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
