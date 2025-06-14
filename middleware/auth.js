const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('Auth Middleware - Headers:', req.headers);
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth Middleware - Token:', token ? 'Present' : 'Missing');

    if (!token) {
      throw new Error('No authentication token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth Middleware - Decoded Token:', decoded);

    const user = await User.findOne({ _id: decoded.userId });
    console.log('Auth Middleware - User Found:', user ? 'Yes' : 'No');

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    req.token = token;
    
    console.log('Auth Middleware - User attached to request:', {
      userId: user._id,
      email: user.email
    });

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', {
      error: error.message,
      stack: error.stack
    });
    res.status(401).json({ message: 'Please authenticate' });
  }
};

module.exports = auth; 