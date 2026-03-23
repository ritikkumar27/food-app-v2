const express = require('express');
const { logConsumption, getAnalytics } = require('../controllers/consumptionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/consume', logConsumption);
router.get('/analytics', getAnalytics);

module.exports = router;
