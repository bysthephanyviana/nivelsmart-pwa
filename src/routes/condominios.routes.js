const express = require('express');
const router = express.Router();
const condominiosController = require('../controllers/condominios.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const validate = require('../middlewares/validation.middleware');
const schemas = require('../utils/schemas');

/**
 * @swagger
 * /condominios:
 *   get:
 *     summary: Lista todos os condomínios do usuário
 *     tags: [Condomínios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de condomínios retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   endereco:
 *                     type: string
 *       401:
 *         description: Não autorizado
 */
router.get('/', verifyToken, condominiosController.list);
router.get('/:id', verifyToken, condominiosController.getById);

/**
 * @swagger
 * /condominios:
 *   post:
 *     summary: Cria um novo condomínio
 *     tags: [Condomínios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *               endereco:
 *                 type: string
 *     responses:
 *       201:
 *         description: Condomínio criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/', verifyToken, validate(schemas.condominio), condominiosController.create);
router.put('/:id', verifyToken, validate(schemas.condominio), condominiosController.update);
router.post('/wizard', verifyToken, condominiosController.createWizard);
router.delete('/:id', verifyToken, condominiosController.delete);

module.exports = router;
