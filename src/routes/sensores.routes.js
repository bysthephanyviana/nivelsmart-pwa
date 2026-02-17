const express = require('express');
const router = express.Router();
const sensoresController = require('../controllers/sensores.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const validate = require('../middlewares/validation.middleware');
const schemas = require('../utils/schemas');

// 1. Static Routes (Must come first)
router.get('/disponiveis', verifyToken, sensoresController.listAvailable); // NEW: Discovery Endpoint

/**
 * @swagger
 * /sensores/vincular:
 *   post:
 *     summary: Vincula um sensor (DevId) a um reservatório
 *     tags: [Sensores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservatorio_id
 *               - devId
 *               - nome
 *             properties:
 *               reservatorio_id:
 *                 type: integer
 *               devId:
 *                 type: string
 *                 description: ID do dispositivo Tuya
 *               nome:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sensor vinculado com sucesso
 *       400:
 *         description: DevId inválido ou não encontrado na Tuya
 *       409:
 *         description: Sensor já cadastrado
 */
router.post('/vincular', verifyToken, validate(schemas.sensorBind), sensoresController.vincular);
router.get('/meus-sensores', verifyToken, sensoresController.listByUser);

// 2. Specific Paths
// Moved from root /:id to /reservatorio/:id to avoid collision
router.get('/reservatorio/:reservatorio_id', verifyToken, sensoresController.listByReservatorio);

/**
 * @swagger
 * /sensores/status/{devId}:
 *   get:
 *     summary: Retorna o status atual de um sensor (Nível, Online, etc.)
 *     tags: [Sensores]
 *     parameters:
 *       - in: path
 *         name: devId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do dispositivo Tuya
 *     responses:
 *       200:
 *         description: Status do sensor retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 current_level:
 *                   type: integer
 *                   description: Nível em porcentagem (0-100)
 *                 online:
 *                   type: boolean
 *                 bomba_ligada:
 *                   type: boolean
 *       502:
 *         description: Erro ao comunicar com Tuya
 */
router.get('/status/:devId', sensoresController.getStatus);

// 3. Generic Param Routes (Must come last)
// This matches "GET /sensor/:id" as requested (assuming mapped to /sensor or /sensores)
router.get('/:id', verifyToken, sensoresController.getById);
router.put('/:id', verifyToken, validate(schemas.sensorUpdate), sensoresController.update);
router.delete('/:id', verifyToken, sensoresController.delete);

module.exports = router;
