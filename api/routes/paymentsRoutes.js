const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentsController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, paymentController.createPayment);
router.get('/invoice/:invoice_id', protect, paymentController.getPaymentsForInvoice);

module.exports = router;
