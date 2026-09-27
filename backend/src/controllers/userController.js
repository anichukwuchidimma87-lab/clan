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

// Get approved users for leadership and admin management screens
export const getApprovedUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'approved' }).select('-password').sort({ name: 1 });
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching approved users:', error);
    res.status(500).json({ message: 'Error fetching approved users' });
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

/**
 * Update user profile information including position and profile image
 * Used for admin to update executive/patron profiles
 */
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, position, profileTitle, email } = req.body;

    try {
      console.log('[userController] req.file:', req.file ? { originalname: req.file.originalname, path: req.file.path, size: req.file.size } : null);
    } catch (e) {
      console.error('[userController] Failed to log req.file', e && e.message);
    }

    const profileImage = req.file?.path;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined && name !== null && String(name).trim()) {
      user.name = String(name).trim();
    }
    if (position !== undefined && position !== null && String(position).trim()) {
      user.position = String(position).trim();
    }
    if (profileTitle !== undefined) {
      user.profileTitle = profileTitle ? String(profileTitle).trim() : '';
    }
    if (email !== undefined && email !== null && String(email).trim()) {
      user.email = String(email).trim();
    }
    if (profileImage) {
      user.profileImage = profileImage;
    }

    await user.save();

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      position: user.position,
      profileImage: user.profileImage,
      profileTitle: user.profileTitle,
      yearCommissioned: user.yearCommissioned,
    };

    res.json({
      success: true,
      message: 'User profile updated successfully',
      user: safeUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
    });
  }
};