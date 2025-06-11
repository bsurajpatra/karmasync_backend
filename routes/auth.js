const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Auth routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/me', auth, authController.getCurrentUser);
router.put('/profile', auth, authController.updateProfile);
router.delete('/delete-account', auth, authController.deleteAccount);

module.exports = router; 