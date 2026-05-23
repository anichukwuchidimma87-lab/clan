import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Assuming you have your User model

// 1. Protect: Validates the token and fetches the user from DB
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to ensure they still exist and check current role
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// 2. Authorize: Role-based check with Super Admin override
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // SUPER ADMIN OVERRIDE: If role is superadmin, skip all checks
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Standard role check
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }

    next();
  };
};