const express = require('express');
const { getByBarcode, search } = require('../controllers/foodController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/barcode/:code', getByBarcode);
router.get('/search', search);

module.exports = router;
