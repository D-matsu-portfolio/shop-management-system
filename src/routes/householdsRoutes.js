const express = require('express');
const router = express.Router();
const {
  getHouseholds,
  createHousehold,
  updateHousehold,
  deleteHousehold,
} = require('../controllers/householdsController');

router.route('/').get(getHouseholds).post(createHousehold);
router.route('/:id').put(updateHousehold).delete(deleteHousehold);

module.exports = router;
