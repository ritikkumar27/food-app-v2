const express = require('express');
const { getByBarcode, search, createManualProduct } = require('../controllers/foodController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/barcode/:code', getByBarcode);
router.get('/search', search);
router.post('/manual', createManualProduct);

module.exports = router;
