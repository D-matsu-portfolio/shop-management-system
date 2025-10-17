const express = require('express');
const router = express.Router();
const {
  getServices,
  createService,
  updateService,
  deleteService,
  importServices,
} = require('../controllers/servicesController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getServices).post(protect, createService);
router.post('/import', protect, importServices);
router.route('/:id').put(protect, updateService).delete(protect, deleteService);

module.exports = router;
