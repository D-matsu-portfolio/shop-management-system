const express = require('express');
const router = express.Router();
const {
  getInvoices,
  createInvoiceFromEstimate,
  getInvoiceById,
} = require('../controllers/invoicesController');
const protect = require('../middleware/authMiddleware');

router.route('/').get(protect, getInvoices);
router.route('/from-estimate/:estimateId').post(protect, createInvoiceFromEstimate);
router.route('/:id').get(protect, getInvoiceById);

module.exports = router;
