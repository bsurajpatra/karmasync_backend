const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 
          'Email already registered' : 
          'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      fullName,
      username,
      email,
      password
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: error.message || 'Error creating user'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: error.message || 'Error logging in'
    });
  }
}; 