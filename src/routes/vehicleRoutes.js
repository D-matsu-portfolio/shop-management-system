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

router.route('/').get(getVehicles).post(createVehicle);
router.route('/by-customer/:customerId').get(getVehiclesByCustomerId);
router.route('/:id').get(getVehicleById).put(updateVehicle).delete(deleteVehicle);

module.exports = router;
