const express = require('express');
const router = express.Router();
const condominiosController = require('../controllers/condominios.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/', verifyToken, condominiosController.list);
router.post('/', verifyToken, condominiosController.create);

module.exports = router;
