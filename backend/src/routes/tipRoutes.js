const express = require('express');
const router = express.Router();
const { getDailyTip } = require('../controllers/tipController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/daily', authMiddleware, getDailyTip);

module.exports = router;
