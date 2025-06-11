const router = require('express').Router();
const authController = require('../controllers/authController');

// Signup route
router.post('/signup', authController.signup);

// Login route
router.post('/login', authController.login);

module.exports = router; 