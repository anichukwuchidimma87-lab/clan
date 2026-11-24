import User from '../models/User.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { normalizeUserRole } from '../utils/roleUtils.js';
import AuditLog from '../models/AuditLog.js';
import Parish from '../models/Parish.js';

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

const getParishName = async (parish) => {
  const parishName = String(parish || '').trim();
  if (!parishName) return '';

  const parishRecord = await Parish.findOne({ name: parishName }).select('name').lean();
  return parishRecord?.name || null;
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

    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending accounts can be approved.' });
    }

    const { role, parish, permissions } = req.body;
    const normalizedRole = normalizeUserRole(role || user.requestedRole || 'member');

    if (normalizedRole === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only a superadmin may assign the superadmin role.' });
    }
    if (normalizedRole === 'president' && !parish) {
      return res.status(400).json({ message: 'A parish is required when approving a parish president.' });
    }
    let assignedParish = '';
    if (normalizedRole === 'president') {
      const parishRecord = await Parish.findOne({ name: String(parish).trim() }).select('name').lean();
      if (!parishRecord) {
        return res.status(400).json({ message: 'Select a parish from the master parish directory.' });
      }
      assignedParish = parishRecord.name;
    }

    user.status = 'approved';
    user.role = normalizedRole;
    user.parish = assignedParish;
    if (normalizedRole === 'president') {
      user.permissions = {
        view: permissions?.view ?? true,
        export: permissions?.export ?? true,
        add: permissions?.add ?? false,
        update: permissions?.update ?? true,
        suspend: permissions?.suspend ?? false,
        delete: permissions?.delete ?? false
      };
    } else {
      user.permissions = {
        view: false,
        export: false,
        add: false,
        update: false,
        suspend: false,
        delete: false
      };
    }
    await user.save();
    await AuditLog.create({
      action: 'user-approved',
      user: req.user._id,
      userRole: req.user.role,
      affectedCount: 1,
      ids: [String(user._id)],
      notes: `Approved as ${user.role}; parish ${user.parish || 'unassigned'}`
    });

    res.json({
      success: true,
      message: normalizedRole === 'president'
        ? 'User account approved as parish president.'
        : 'User account approved successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        position: user.position,
        parish: user.parish,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role, parish, permissions } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const requestedRole = String(role || '').trim().toLowerCase();
    const normalizedRole = normalizeUserRole(requestedRole);
    const allowedRoles = ['superadmin', 'executive', 'president', 'member'];

    if (!allowedRoles.includes(requestedRole) && requestedRole !== 'admin') {
      return res.status(400).json({ success: false, message: 'Invalid role selected.' });
    }
    if (req.user.role !== 'superadmin' && (targetUser.role === 'superadmin' || normalizedRole === 'superadmin')) {
      return res.status(403).json({ success: false, message: 'Only a superadmin may change a superadmin account.' });
    }
    if (targetUser.role === 'superadmin' && normalizedRole !== 'superadmin') {
      const activeSuperadmins = await User.countDocuments({ role: 'superadmin', status: 'approved' });
      if (activeSuperadmins <= 1) {
        return res.status(400).json({ success: false, message: 'The last approved superadmin cannot be demoted.' });
      }
    }
    let assignedParish = '';
    if (normalizedRole === 'president') {
      assignedParish = await getParishName(parish);
      if (!assignedParish) return res.status(400).json({ success: false, message: 'Select a parish from the master parish directory.' });
    } else if (normalizedRole === 'member') {
      assignedParish = parish === undefined
        ? targetUser.parish || ''
        : await getParishName(parish);
      if (assignedParish === null) {
        return res.status(400).json({ success: false, message: 'Select a parish from the master parish directory.' });
      }
    }

    targetUser.role = normalizedRole;
    targetUser.parish = assignedParish;
    if (normalizedRole === 'president') {
      targetUser.permissions = {
        view: permissions?.view ?? targetUser.permissions?.view ?? true,
        export: permissions?.export ?? targetUser.permissions?.export ?? true,
        add: permissions?.add ?? targetUser.permissions?.add ?? false,
        update: permissions?.update ?? targetUser.permissions?.update ?? true,
        suspend: permissions?.suspend ?? targetUser.permissions?.suspend ?? false,
        delete: permissions?.delete ?? targetUser.permissions?.delete ?? false
      };
    } else {
      if (normalizedRole !== 'member') targetUser.parish = '';
      targetUser.permissions = {
        view: false,
        export: false,
        add: false,
        update: false,
        suspend: false,
        delete: false
      };
    }
    targetUser.tokenVersion = Number(targetUser.tokenVersion || 0) + 1;
    await targetUser.save();
    await AuditLog.create({
      action: 'user-role-updated',
      user: req.user._id,
      userRole: req.user.role,
      affectedCount: 1,
      ids: [String(targetUser._id)],
      notes: `Role set to ${targetUser.role}; parish ${targetUser.parish || 'unassigned'}; permissions updated`
    });

    res.json({
      success: true,
      message: 'User role updated successfully.',
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        position: targetUser.position,
        parish: targetUser.parish,
        permissions: targetUser.permissions
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Server error updating user role' });
  }
};

export const updateUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user identifier.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Use your profile settings to update your own account.' });
    }

    if (req.user.role !== 'superadmin' && user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only a superadmin may manage a superadmin account.' });
    }

    const { email, password, status, role, parish, permissions } = req.body;
    const changes = [];

    if (role !== undefined) {
      const requestedRole = String(role || '').trim().toLowerCase();
      const allowedRoles = ['superadmin', 'executive', 'president', 'member'];
      if (!allowedRoles.includes(requestedRole) && requestedRole !== 'admin') {
        return res.status(400).json({ success: false, message: 'Invalid role selected.' });
      }
      const normalizedRole = normalizeUserRole(requestedRole);
      if (req.user.role !== 'superadmin' && (user.role === 'superadmin' || normalizedRole === 'superadmin')) {
        return res.status(403).json({ success: false, message: 'Only a superadmin may change a superadmin account.' });
      }
      if (user.role === 'superadmin' && normalizedRole !== 'superadmin') {
        const activeSuperadmins = await User.countDocuments({ role: 'superadmin', status: 'approved' });
        if (activeSuperadmins <= 1) {
          return res.status(400).json({ success: false, message: 'The last approved superadmin cannot be demoted.' });
        }
      }

      let assignedParish = '';
      if (normalizedRole === 'president') {
        assignedParish = await getParishName(parish);
        if (!assignedParish) {
          return res.status(400).json({ success: false, message: 'Select a parish from the master parish directory.' });
        }
      } else if (normalizedRole === 'member') {
        assignedParish = await getParishName(parish);
        if (assignedParish === null) {
          return res.status(400).json({ success: false, message: 'Select a parish from the master parish directory.' });
        }
      }

      if (user.role !== normalizedRole) {
        user.role = normalizedRole;
        changes.push(`role set to ${normalizedRole}`);
      }
      if ((user.parish || '') !== assignedParish) {
        user.parish = assignedParish;
        changes.push(`parish set to ${assignedParish || 'unassigned'}`);
      }

      const permissionKeys = ['view', 'export', 'add', 'update', 'suspend', 'delete'];
      if (permissions !== undefined && (
        !permissions ||
        typeof permissions !== 'object' ||
        Array.isArray(permissions) ||
        permissionKeys.some((key) => permissions[key] !== undefined && typeof permissions[key] !== 'boolean')
      )) {
        return res.status(400).json({ success: false, message: 'Role permissions must be boolean values.' });
      }
      const nextPermissions = normalizedRole === 'president'
        ? Object.fromEntries(permissionKeys.map((key) => [
          key,
          permissions?.[key] ?? user.permissions?.[key] ?? ['view', 'export', 'update'].includes(key)
        ]))
        : Object.fromEntries(permissionKeys.map((key) => [key, false]));
      if (permissionKeys.some((key) => Boolean(user.permissions?.[key]) !== nextPermissions[key])) {
        user.permissions = nextPermissions;
        changes.push('permissions updated');
      }
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
      }
      const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await User.findOne({
        email: { $regex: `^${escapedEmail}$`, $options: 'i' },
        _id: { $ne: user._id }
      }).select('_id').lean();
      if (existing) {
        return res.status(409).json({ success: false, message: 'That email address is already in use.' });
      }
      if (normalizedEmail !== user.email) {
        user.email = normalizedEmail;
        changes.push('email changed');
      }
    }

    if (password !== undefined && String(password).length > 0) {
      const nextPassword = String(password);
      if (nextPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      }
      user.password = await bcrypt.hash(nextPassword, await bcrypt.genSalt(10));
      changes.push('password reset');
    }

    if (status !== undefined) {
      if (!['approved', 'disabled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Account status must be approved or disabled.' });
      }
      if (String(user._id) === String(req.user._id) && status === 'disabled') {
        return res.status(400).json({ success: false, message: 'You cannot disable your own account.' });
      }
      if (user.role === 'superadmin' && status !== 'approved') {
        const activeSuperadmins = await User.countDocuments({ role: 'superadmin', status: 'approved' });
        if (activeSuperadmins <= 1) {
          return res.status(400).json({ success: false, message: 'The last approved superadmin cannot be disabled.' });
        }
      }
      if (user.status !== status) {
        user.status = status;
        changes.push(`status set to ${status}`);
      }
    }

    if (changes.length === 0) {
      return res.status(400).json({ success: false, message: 'No account changes were provided.' });
    }

    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();
    await AuditLog.create({
      action: 'user-account-updated',
      user: req.user._id,
      userRole: req.user.role,
      affectedCount: 1,
      ids: [String(user._id)],
      notes: changes.join('; ')
    });

    res.status(200).json({
      success: true,
      message: 'User account updated.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        position: user.position,
        parish: user.parish,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Error updating user account:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'That email address is already in use.' });
    }
    res.status(500).json({ success: false, message: 'Server error updating user account.' });
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
      password: await bcrypt.hash(password || 'Executive@2026', await bcrypt.genSalt(10)),
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
    const sensitiveChanges = [];

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
    if (email !== undefined) {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
      }
      const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingEmail = await User.findOne({
        _id: { $ne: user._id },
        email: { $regex: `^${escapedEmail}$`, $options: 'i' }
      }).select('_id').lean();
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'That email address is already in use.' });
      }
      if (user.email !== normalizedEmail) sensitiveChanges.push('email changed');
      user.email = normalizedEmail;
    }
    if (phone !== undefined) {
      user.phone = phone ? String(phone).trim() : '';
    }
    if (parish !== undefined && (isAdmin || (isSelf && normalizeUserRole(user.role) === 'member'))) {
      const parishName = await getParishName(parish);
      if (parishName === null) {
        return res.status(400).json({ success: false, message: 'Select a parish from the master parish directory.' });
      }
      user.parish = parishName;
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
      const nextPassword = String(password);
      if (nextPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      }
      user.password = await bcrypt.hash(nextPassword, await bcrypt.genSalt(10));
      sensitiveChanges.push('password reset');
    }

    user.tokenVersion = Number(user.tokenVersion || 0) + 1;
    await user.save();
    if (sensitiveChanges.length > 0) {
      await AuditLog.create({
        action: 'user-profile-credentials-updated',
        user: req.user._id,
        userRole: req.user.role,
        affectedCount: 1,
        ids: [String(user._id)],
        notes: sensitiveChanges.join('; ')
      });
    }

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

    const token = isSelf ? jwt.sign(
      {
        id: user._id,
        role: user.role,
        title: user.title || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: user.name || [user.title, user.firstName, user.lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
        email: user.email,
        parish: user.parish || '',
        phone: user.phone || '',
        permissions: user.permissions || {},
        tokenVersion: user.tokenVersion || 0
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    ) : null;

    res.json({
      success: true,
      message: 'User profile updated successfully',
      user: safeUser,
      ...(token ? { token } : {})
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
    });
  }
};