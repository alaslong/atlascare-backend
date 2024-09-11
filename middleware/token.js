const jwt = require('jsonwebtoken');

// Middleware to verify the token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token is required' });
  }

  // Verify the token
  jwt.verify(token, process.env.SUPABASE_JWT_SECRET, (err, user) => {
    if (err) {
      // If token is expired, return a specific message
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: 'Token expired' });
      }
      return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
