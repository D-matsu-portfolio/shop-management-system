const express = require('express');
const router = express.Router();
const {
  getInvoices,
  createInvoiceFromEstimate,
  getInvoiceById,
} = require('../controllers/invoicesController');

router.route('/').get(getInvoices);
router.route('/from-estimate/:estimateId').post(createInvoiceFromEstimate);
router.route('/:id').get(getInvoiceById);

module.exports = router;
