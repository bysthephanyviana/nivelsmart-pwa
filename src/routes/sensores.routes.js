const express = require('express');
const router = express.Router();
const sensoresController = require('../controllers/sensores.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/vincular', verifyToken, sensoresController.vincular);
router.get('/:reservatorio_id', verifyToken, sensoresController.listByReservatorio);

// PUBLIC or SECURED? Request implies /sensor/status/:devId is the key route.
// Let's secure it but allow access if authenticated.
// Note: Route path in server.js will determine prefix.
// The user asked for specific route: /sensor/status/:devId
// This file is likely mounted at /sensores, so it would be /sensores/status/:devId
// To match user Request EXACTLY "/sensor/status/:devId" we might need a separate route entry in server.js or adjust here.
// I will mount this router at /sensores in server.js, so:
// /sensores/status/:devId -> matches pattern.
// However, the user also listed "/sensor/status/:devId" (singular 'sensor').
// I will add a redirect or alias in server.js or just handle it here.
// Let's follow the standard resource naming "sensores" for collection, "sensor" for singular if requested.
// I will add the route here.

router.get('/status/:devId', sensoresController.getStatus); // Keeping open for easy testing as requested, or add verifyToken if strict.

module.exports = router;
