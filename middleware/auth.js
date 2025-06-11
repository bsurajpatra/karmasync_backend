const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Set both userId and _id for compatibility
    req.user = {
      _id: decoded.userId,
      userId: decoded.userId
    };
    
    console.log('User set in request:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is invalid' });
  }
};

module.exports = auth; 