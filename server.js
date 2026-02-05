require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/auth.routes');
const condominiosRoutes = require('./src/routes/condominios.routes');
const reservatoriosRoutes = require('./src/routes/reservatorios.routes');
const sensoresRoutes = require('./src/routes/sensores.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/condominios', condominiosRoutes);
app.use('/reservatorios', reservatoriosRoutes);
app.use('/sensores', sensoresRoutes); // Handles /sensores/vincular, /sensores/:reservatorio_id

// Special route alias for /sensor/status/:devId to match requirements exactly
app.use('/sensor', sensoresRoutes); // Handles /sensor/status/:devId (and duplicates others, but acceptable)

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'NIVELSMART-IOT Backend Running' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Teste a API em: http://localhost:${PORT}`);
});
