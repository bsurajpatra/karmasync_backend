const router = require('express').Router();
const authController = require('../controllers/authController');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Signup route
router.post('/signup', authController.signup);

// Login route
router.post('/login', authController.login);

// Forgot password route
router.post('/forgot-password', authController.forgotPassword);

// Reset password route
router.post('/reset-password', authController.resetPassword);

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP exists and is valid
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    // Check if OTP has expired
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP and mark user as verified
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save OTP to user
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, otp);

    res.json({ message: 'New OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Error resending OTP' });
  }
});

// Send welcome email
router.post('/send-welcome-email', async (req, res) => {
  try {
    const { userId, email, fullName } = req.body;

    if (!userId || !email || !fullName) {
      return res.status(400).json({ message: 'User details are required' });
    }

    // Send welcome email
    await sendWelcomeEmail(email, fullName);

    res.json({ message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({ message: 'Error sending welcome email' });
  }
});

module.exports = router; 