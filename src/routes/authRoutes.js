const express = require('express');
const router = express.Router();

// !!! WARNING: FOR DEBUGGING ONLY. REMOVE AFTER USE. !!!
// This endpoint exposes all environment variables.
router.get('/debug-env', (req, res) => {
  res.json(process.env);
});

const { registerUser, loginUser } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

module.exports = router;
