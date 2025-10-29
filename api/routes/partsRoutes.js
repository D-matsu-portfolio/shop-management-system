const express = require('express');
const router = express.Router();
const {
  getParts,
  createPart,
  updatePart,
  deletePart,
  importParts,
} = require('../controllers/partsController');
const protect = require('../middleware/authMiddleware');

router.route('/').get(protect, getParts).post(protect, createPart);
router.post('/import', protect, importParts);
router.route('/:id').put(protect, updatePart).delete(protect, deletePart);

module.exports = router;
