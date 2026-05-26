import User from '../models/User.js';

// Get only users waiting for approval
export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).select('-password');
    res.json(pendingUsers);
  } catch (error) {
    console.error("Error fetching pending users:", error);
    res.status(500).json({ message: 'Error fetching pending users' });
  }
};

// Update a user's status to 'approved'
export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Logic Check: Only proceed if the user is currently pending
    if (user.status === 'approved') {
      return res.status(400).json({ message: 'User is already approved' });
    }
    
    user.status = 'approved';
    await user.save();
    
    res.json({ message: 'User account approved successfully', user });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ message: 'Server error' });
  }
};