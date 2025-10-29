const express = require('express');
const router = express.Router();
const {
  getHouseholds,
  createHousehold,
  updateHousehold,
  deleteHousehold,
} = require('../controllers/householdsController');
const protect = require('../middleware/authMiddleware');

router.route('/').get(protect, getHouseholds).post(protect, createHousehold);
router.route('/:id').put(protect, updateHousehold).delete(protect, deleteHousehold);

module.exports = router;
