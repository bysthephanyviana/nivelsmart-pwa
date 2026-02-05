const express = require('express');
const router = express.Router();
const reservatoriosController = require('../controllers/reservatorios.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/:condominio_id', verifyToken, reservatoriosController.listByCondominio);
router.post('/', verifyToken, reservatoriosController.create);

module.exports = router;
