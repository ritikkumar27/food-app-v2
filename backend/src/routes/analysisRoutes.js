const express = require('express');
const { analyze, getHistory } = require('../controllers/analysisController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', analyze);
router.get('/history', getHistory);

module.exports = router;
