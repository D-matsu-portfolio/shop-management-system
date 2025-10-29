const express = require('express');
const router = express.Router();
const {
  getEstimates,
  createEstimate,
  getShakenFees,
  getEstimatesByCustomerId,
  getEstimatesByVehicleId,
  getEstimateById,
  updateEstimate, // Add this
  deleteEstimate,
  importStatutoryCosts,
} = require('../controllers/estimateController');
const protect = require('../middleware/authMiddleware');

router.route('/').get(protect, getEstimates).post(protect, createEstimate);
router.route('/shaken-fees').get(protect, getShakenFees);
router.post('/statutory-costs/import', protect, importStatutoryCosts);
router.route('/by-customer/:customerId').get(protect, getEstimatesByCustomerId);
router.route('/by-vehicle/:vehicleId').get(protect, getEstimatesByVehicleId);
router.route('/:id').get(protect, getEstimateById).put(protect, updateEstimate).delete(protect, deleteEstimate);

module.exports = router;
