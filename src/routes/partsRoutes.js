const express = require('express');
const router = express.Router();
const {
  getParts,
  createPart,
  updatePart,
  deletePart,
} = require('../controllers/partsController');

router.route('/').get(getParts).post(createPart);
router.route('/:id').put(updatePart).delete(deletePart);

module.exports = router;
