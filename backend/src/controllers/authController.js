import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // You'll need to define a User model

// Helper to generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      // THE GATE: Block access if status is pending
      if (user.status !== 'approved') {
        return res.status(403).json({ message: 'Account awaiting Deanery approval.' });
      }
      res.json({ /* ... your existing response ... */ });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.status = 'approved';
    await user.save();
    res.json({ message: 'User approved successfully' });
  } catch (error) { res.status(500).json({ message: 'Server error' }); }
};