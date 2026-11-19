import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { normalizeUserRole } from '../utils/roleUtils.js';

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

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    if (Number(decoded.tokenVersion || 0) !== Number(req.user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }
    if (req.user.status !== 'approved') {
      return res.status(403).json({ message: 'Account approval is required.' });
    }

    req.user.role = normalizeUserRole(req.user.role);
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// 2. Authorize: Role-based check with Super Admin override
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = normalizeUserRole(req.user.role);
    req.user.role = userRole;

    if (userRole === 'superadmin') {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Role ${userRole} is not authorized to access this route`
      });
    }

    next();
  };
};

// 3. Approval Middleware for user access governance
export const authorizeApproval = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const role = normalizeUserRole(req.user.role);
  req.user.role = role;

  if (role === 'superadmin' || role === 'executive') {
    return next();
  }

  return res.status(403).json({ message: 'Not authorized to manage user access.' });
};

export const requirePermission = (permission) => (req, res, next) => {
  const role = normalizeUserRole(req.user?.role);
  if (role === 'superadmin' || role === 'executive') return next();
  if (role !== 'president') return res.status(403).json({ message: 'Not authorized.' });
  if (!req.user.permissions?.[permission]) {
    return res.status(403).json({ message: `Permission "${permission}" was not granted.` });
  }
  next();
};