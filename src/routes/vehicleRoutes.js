const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesByCustomerId,
} = require('../controllers/vehicleController');
const protect = require('../middleware/authMiddleware');

router.route('/').get(protect, getVehicles).post(protect, createVehicle);
router.route('/by-customer/:customerId').get(protect, getVehiclesByCustomerId);
router
  .route('/:id')
  .get(protect, getVehicleById)
  .put(protect, updateVehicle)
  .delete(protect, deleteVehicle);

module.exports = router;
