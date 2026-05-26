import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

    // Fetch user from DB to ensure they still exist and check current role/position
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// 2. Authorize: Role-based check with Super Admin override
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role === 'superadmin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }

    next();
  };
};

// 3. Updated Approval Middleware
export const authorizeApproval = (req, res, next) => {
  const gatekeeperPositions = ['President', 'Vice President', 'Secretary', 'Assistant Secretary'];
  
  // Safe navigation: default to empty string if position is missing
  const userPosition = req.user.position || '';
  
  const isSuperAdmin = req.user.role === 'superadmin';
  const isGatekeeper = req.user.role === 'admin' && gatekeeperPositions.includes(userPosition);

  if (isSuperAdmin || isGatekeeper) {
    return next();
  }
  
  return res.status(403).json({ message: 'Not authorized to approve users.' });
};