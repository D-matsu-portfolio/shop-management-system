const express = require('express');
const router = express.Router();
const {
  getStatutoryCosts,
  createStatutoryCost,
  updateStatutoryCost,
  deleteStatutoryCost,
} = require('../controllers/statutoryCostsController');
const { protect } = require('../middleware/authMiddleware');

// Apply protect middleware to all routes in this file
router.use(protect);

router.route('/').get(getStatutoryCosts).post(createStatutoryCost);
router.route('/:id').put(updateStatutoryCost).delete(deleteStatutoryCost);

module.exports = router;
