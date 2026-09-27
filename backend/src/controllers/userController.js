import User from '../models/User.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { normalizeUserRole } from '../utils/roleUtils.js';

const leadershipPositions = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Financial Secretary',
  'Assistant Financial Secretary',
  'PRO',
  'Welfare Officer',
  'Provost',
  'Executive Member',
  'Patron',
  'Patroness'
];

const buildDisplayName = ({ title = '', firstName = '', middleName = '', lastName = '' }) => {
  const fullName = [title, firstName, middleName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return fullName || 'Executive Member';
};

export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).select('-password').sort({ name: 1 });
    res.json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'Error fetching pending users' });
  }
};

export const getApprovedUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ status: -1, name: 1 });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching approved users:', error);
    res.status(500).json({ message: 'Error fetching approved users' });
  }
};

export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'approved') {
      return res.status(400).json({ message: 'User is already approved' });
    }

    user.status = 'approved';
    user.role = 'member';
    await user.save();

    res.json({
      success: true,
      message: 'User account approved successfully as a member.',
      user
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const normalizedRole = normalizeUserRole(role);
    const allowedRoles = ['superadmin', 'executive', 'president', 'member'];

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected.' });
    }

    targetUser.role = normalizedRole;
    await targetUser.save();

    res.json({
      success: true,
      message: 'User role updated successfully.',
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        position: targetUser.position
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Server error updating user role' });
  }
};

export const createExecutiveMember = async (req, res) => {
  try {
    const {
      title,
      firstName,
      middleName,
      lastName,
      name,
      email,
      position,
      profileTitle,
      phone,
      parish,
      executiveSessionStart,
      executiveSessionEnd,
      isCurrentExecutiveSession,
      isFeaturedOnHomepage,
      homepageOrder,
      password
    } = req.body;

    const normalizedFirstName = String(firstName || '').trim();
    const normalizedLastName = String(lastName || '').trim();
    const resolvedName = String(name || '').trim() || buildDisplayName({ title, firstName: normalizedFirstName, middleName: String(middleName || '').trim(), lastName: normalizedLastName });

    if (!resolvedName || !email || !position) {
      return res.status(400).json({ message: 'Name details, email and position are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'A member with this email already exists.' });
    }

    if (isCurrentExecutiveSession) {
      await User.updateMany(
        {
          _id: { $ne: null },
          position: { $in: leadershipPositions },
          isCurrentExecutiveSession: true
        },
        { $set: { isCurrentExecutiveSession: false } }
      );
    }

    const user = await User.create({
      title: String(title || '').trim(),
      firstName: normalizedFirstName,
      middleName: String(middleName || '').trim(),
      lastName: normalizedLastName,
      name: resolvedName,
      email: normalizedEmail,
      password: password || 'Executive@2026',
      role: 'member',
      status: 'approved',
      position: String(position).trim(),
      profileTitle: profileTitle ? String(profileTitle).trim() : '',
      phone: phone ? String(phone).trim() : '',
      parish: parish ? String(parish).trim() : '',
      executiveSessionStart: executiveSessionStart !== undefined && executiveSessionStart !== '' ? Number(executiveSessionStart) : null,
      executiveSessionEnd: executiveSessionEnd !== undefined && executiveSessionEnd !== '' ? Number(executiveSessionEnd) : null,
      isCurrentExecutiveSession: Boolean(isCurrentExecutiveSession),
      isFeaturedOnHomepage: Boolean(isFeaturedOnHomepage),
      homepageOrder: Number(homepageOrder) || 0,
    });

    res.status(201).json({
      success: true,
      message: 'Executive member created successfully.',
      user: {
        _id: user._id,
        title: user.title,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        position: user.position,
        profileTitle: user.profileTitle,
        phone: user.phone,
        parish: user.parish,
        executiveSessionStart: user.executiveSessionStart,
        executiveSessionEnd: user.executiveSessionEnd,
        isCurrentExecutiveSession: user.isCurrentExecutiveSession,
        isFeaturedOnHomepage: user.isFeaturedOnHomepage,
        homepageOrder: user.homepageOrder,
      }
    });
  } catch (error) {
    console.error('Error creating executive member:', error);
    res.status(500).json({ success: false, message: 'Server error creating executive member' });
  }
};

export const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
        title: user.title || '',
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'member',
        status: user.status || 'approved',
        position: user.position || 'Member',
        profileImage: user.profileImage || '',
        profileTitle: user.profileTitle || '',
        phone: user.phone || '',
        parish: user.parish || '',
        yearCommissioned: user.yearCommissioned || null,
      }
    });
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user identifier.' });
    }

    const requestedUser = await User.findById(userId).select('-password');
    if (!requestedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isSelf = req.user && req.user._id.toString() === userId;
    const isAdmin = ['superadmin', 'executive'].includes(normalizeUserRole(req.user?.role || 'member'));

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this profile.' });
    }

    res.json({
      success: true,
      user: {
        _id: requestedUser._id,
        title: requestedUser.title,
        firstName: requestedUser.firstName,
        middleName: requestedUser.middleName,
        lastName: requestedUser.lastName,
        name: requestedUser.name,
        email: requestedUser.email,
        role: requestedUser.role,
        status: requestedUser.status,
        position: requestedUser.position,
        profileImage: requestedUser.profileImage,
        profileTitle: requestedUser.profileTitle,
        phone: requestedUser.phone,
        parish: requestedUser.parish,
        yearCommissioned: requestedUser.yearCommissioned,
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user identifier.' });
    }

    const isSelf = req.user && req.user._id.toString() === userId;
    const isAdmin = ['superadmin', 'executive'].includes(normalizeUserRole(req.user?.role || 'member'));

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile.' });
    }

    const {
      title,
      firstName,
      middleName,
      lastName,
      name,
      position,
      profileTitle,
      email,
      phone,
      parish,
      executiveSessionStart,
      executiveSessionEnd,
      isCurrentExecutiveSession,
      isFeaturedOnHomepage,
      homepageOrder,
      password
    } = req.body;

    const profileImage = req.file?.path;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const normalizedTitle = title !== undefined ? String(title || '').trim() : user.title || '';
    const normalizedFirstName = firstName !== undefined ? String(firstName || '').trim() : user.firstName || '';
    const normalizedMiddleName = middleName !== undefined ? String(middleName || '').trim() : user.middleName || '';
    const normalizedLastName = lastName !== undefined ? String(lastName || '').trim() : user.lastName || '';
    const builtName = buildDisplayName({ title: normalizedTitle, firstName: normalizedFirstName, middleName: normalizedMiddleName, lastName: normalizedLastName });

    if (title !== undefined) user.title = normalizedTitle;
    if (firstName !== undefined) user.firstName = normalizedFirstName;
    if (middleName !== undefined) user.middleName = normalizedMiddleName;
    if (lastName !== undefined) user.lastName = normalizedLastName;
    if (name !== undefined && name !== null && String(name).trim()) {
      user.name = String(name).trim();
    } else {
      user.name = builtName;
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
    if (phone !== undefined) {
      user.phone = phone ? String(phone).trim() : '';
    }
    if (parish !== undefined) {
      user.parish = parish ? String(parish).trim() : '';
    }
    if (executiveSessionStart !== undefined) {
      const start = String(executiveSessionStart).trim();
      user.executiveSessionStart = start === '' ? null : Number(start);
    }
    if (executiveSessionEnd !== undefined) {
      const end = String(executiveSessionEnd).trim();
      user.executiveSessionEnd = end === '' ? null : Number(end);
    }
    if (isCurrentExecutiveSession !== undefined) {
      user.isCurrentExecutiveSession = Boolean(isCurrentExecutiveSession);
      if (user.isCurrentExecutiveSession) {
        await User.updateMany(
          {
            _id: { $ne: user._id },
            position: { $in: leadershipPositions },
            isCurrentExecutiveSession: true
          },
          { $set: { isCurrentExecutiveSession: false } }
        );
      }
    }
    if (isFeaturedOnHomepage !== undefined) {
      user.isFeaturedOnHomepage = Boolean(isFeaturedOnHomepage);
    }
    if (homepageOrder !== undefined) {
      const order = Number(homepageOrder);
      user.homepageOrder = Number.isFinite(order) ? order : 0;
    }
    if (profileImage) {
      user.profileImage = profileImage;
    }
    if (password && String(password).trim()) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(String(password).trim(), salt);
    }

    await user.save();

    const safeUser = {
      _id: user._id,
      title: user.title,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      position: user.position,
      profileImage: user.profileImage,
      profileTitle: user.profileTitle,
      phone: user.phone,
      parish: user.parish,
      yearCommissioned: user.yearCommissioned,
      executiveSessionStart: user.executiveSessionStart,
      executiveSessionEnd: user.executiveSessionEnd,
      isCurrentExecutiveSession: user.isCurrentExecutiveSession,
      isFeaturedOnHomepage: user.isFeaturedOnHomepage,
      homepageOrder: user.homepageOrder,
    };

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
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
      success: true,
      message: 'User profile updated successfully',
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
    });
  }
};