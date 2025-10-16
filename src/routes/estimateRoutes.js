const express = require('express');
const router = express.Router();
const {
  getEstimates,
  createEstimate,
  getShakenFees,
  getEstimatesByCustomerId,
  getEstimatesByVehicleId,
  getEstimateById,
  deleteEstimate,
} = require('../controllers/estimateController');

router.route('/').get(getEstimates).post(createEstimate);
router.route('/shaken-fees').get(getShakenFees);
router.route('/by-customer/:customerId').get(getEstimatesByCustomerId);
router.route('/by-vehicle/:vehicleId').get(getEstimatesByVehicleId);
router.route('/:id').get(getEstimateById).delete(deleteEstimate);

module.exports = router;
