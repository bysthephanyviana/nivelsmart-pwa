const express = require('express');
const router = express.Router();
const reservatoriosController = require('../controllers/reservatorios.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const validate = require('../middlewares/validation.middleware');
const schemas = require('../utils/schemas');

router.get('/detalhes/:id', verifyToken, reservatoriosController.getById);

/**
 * @swagger
 * /reservatorios/{condominio_id}:
 *   get:
 *     summary: Lista reservatórios de um condomínio específico
 *     tags: [Reservatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: condominio_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do condomínio
 *     responses:
 *       200:
 *         description: Lista de reservatórios
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
 *                   capacidade_litros:
 *                     type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é dono do condomínio)
 */
router.get('/:condominio_id', verifyToken, reservatoriosController.listByCondominio);
router.post('/', verifyToken, validate(schemas.reservatorio), reservatoriosController.create);
router.put('/:id', verifyToken, validate(schemas.reservatorioUpdate), reservatoriosController.update);
router.delete('/:id', verifyToken, reservatoriosController.delete);

module.exports = router;
