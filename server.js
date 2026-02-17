require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./src/utils/logger');
const authRoutes = require('./src/routes/auth.routes');
const condominiosRoutes = require('./src/routes/condominios.routes');
const reservatoriosRoutes = require('./src/routes/reservatorios.routes');
const sensoresRoutes = require('./src/routes/sensores.routes');

// Startup Validation
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    logger.error(`CRITICAL: Missing environment variables: ${missingEnv.join(', ')}`);
    // DEBUG: Don't exit, just warn to see if system comes up
    logger.warn('⚠️ Server continuing despite missing envs (Debug Mode)');
    console.log('ENV DEBUG:', {
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        HAS_PASS: !!process.env.DB_PASSWORD,
        HAS_JWT: !!process.env.JWT_SECRET
    });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/auth', authRoutes);
app.use('/condominios', condominiosRoutes);
app.use('/reservatorios', reservatoriosRoutes);
app.use('/sensores', sensoresRoutes); // Handles /sensores/vincular, /sensores/:reservatorio_id

// Special route alias for /sensor/status/:devId to match requirements exactly
app.use('/sensor', sensoresRoutes); // Handles /sensor/status/:devId

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'NIVELSMART-IOT Backend Running' });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Rota não encontrada' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}`);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

// Start Server
app.listen(PORT, () => {
    logger.info(`Servidor rodando na porta ${PORT}`);
    logger.info(`Teste a API em: http://localhost:${PORT}`);

    // Iniciar Worker de Sincronização
    // Apenas se não estiver em ambiente de teste (opcional)
    try {
        const tuyaWorker = require('./src/workers/tuyaSync');
        tuyaWorker.start();
    } catch (e) {
        logger.error(`Erro ao iniciar worker: ${e.message}`);
    }
});
