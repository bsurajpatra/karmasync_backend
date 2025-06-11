const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    console.log('Auth middleware - Token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);
    
    // Set both userId and id for compatibility
    req.user = {
      id: decoded.userId,
      userId: decoded.userId
    };
    
    console.log('Auth middleware - User set in request:', req.user);
    next();
  } catch (error) {
    console.error('Auth middleware - Error:', error);
    console.error('Auth middleware - Error stack:', error.stack);
    res.status(401).json({ message: 'Token is invalid' });
  }
};

module.exports = auth; 