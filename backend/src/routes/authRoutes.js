import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { normalizeUserRole } from '../utils/roleUtils.js';

const router = express.Router();

const parseFullName = (rawName = '', fallbackTitle = '') => {
  const cleanName = String(rawName || '').trim();
  if (!cleanName) {
    return { title: fallbackTitle, firstName: '', lastName: '', name: '' };
  }

  const titleMatches = ['mr.', 'mrs.', 'miss', 'ms.', 'dr.', 'rev.', 'fr.', 'sir', 'madam'];
  const words = cleanName.split(/\s+/).filter(Boolean);
  let title = fallbackTitle;
  let firstName = '';
  let lastName = '';

  let startIndex = 0;
  const firstToken = words[0]?.toLowerCase();
  if (titleMatches.includes(firstToken)) {
    title = words[0].replace(/\.$/, '');
    startIndex = 1;
  }

  if (startIndex >= words.length) {
    return { title, firstName: '', lastName: '', name: cleanName };
  }

  if (words.length - startIndex === 1) {
    firstName = words[startIndex];
    lastName = '';
  } else {
    firstName = words[startIndex];
    lastName = words.slice(startIndex + 1).join(' ');
  }

  return {
    title: title || '',
    firstName,
    lastName,
    name: [title, firstName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
  };
};

// 1. REGISTER NEW USER ROUTE
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, yearCommissioned, title, firstName, lastName } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const parsedName = parseFullName(name || `${firstName || ''} ${lastName || ''}`.trim(), title || '');

    const newUserPayload = {
      title: title || parsedName.title || '',
      firstName: String(firstName || parsedName.firstName || '').trim(),
      lastName: String(lastName || parsedName.lastName || '').trim(),
      name: String(name || parsedName.name || '').trim() || [parsedName.title, parsedName.firstName, parsedName.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
      email,
      password: hashedPassword,
      role: normalizeUserRole(role || 'member'),
      status: 'approved'
    };

    const parsedYear = Number(yearCommissioned);
    if (yearCommissioned !== undefined && yearCommissioned !== null && String(yearCommissioned).trim() !== '' && !Number.isNaN(parsedYear)) {
      newUserPayload.yearCommissioned = parsedYear;
    } else {
      newUserPayload.yearCommissioned = null;
    }

    const newUser = await User.create(newUserPayload);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("Backend Register Error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// 2. EXISTING LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const normalizedRole = normalizeUserRole(user.role);
    if (user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: normalizedRole,
        title: user.title || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || [user.title, user.firstName, user.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
        email: user.email,
        parish: user.parish || '',
        phone: user.phone || ''
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      id: user._id,
      name: user.name || [user.title, user.firstName, user.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
      role: normalizedRole,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;