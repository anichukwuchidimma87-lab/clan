import Lector from '../models/Lector.js';
import Parish from '../models/Parish.js';
import mongoose from 'mongoose';
import Finance from '../models/Finance.js';
import FeeType from '../models/FeeType.js';
import FeeTarget from '../models/FeeTarget.js';
import LedgerEntry from '../models/LedgerEntry.js';
import AuditLog from '../models/AuditLog.js';
import {
  getNextBirthdayOccurrence,
  parseBirthDate,
  serializePublicBirthday
} from '../../../shared/eventTools.js';

const getBirthdayAccess = (req, res) => {
  const { role, parish } = req.user;
  if (!['superadmin', 'executive', 'president'].includes(role)) {
    res.status(403).json({ success: false, message: 'Not authorized to view birthdays.' });
    return null;
  }
  if (role === 'president' && !req.user.permissions?.view) {
    res.status(403).json({ success: false, message: 'View permission was not granted.' });
    return null;
  }

  return {
    role,
    filter: role === 'president'
      ? { parishName: parish, deanery: 'Benin' }
      : { deanery: 'Benin' }
  };
};

const normalizeWhatsAppPhone = (phone) => {
  const value = String(phone || '').trim();
  if (!/^\+?[\d\s().-]+$/.test(value)) return null;

  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `234${digits.slice(1)}`;
  else if (digits.startsWith('2340')) digits = `234${digits.slice(4)}`;

  return /^\d{8,15}$/.test(digits) && !digits.startsWith('0') ? digits : null;
};

// HELPER PUBLIC ENDPOINT: Feeds the dynamic check-in page dropdown safely from master registry records
export const getActiveParishList = async (req, res) => {
  try {
    // Pull clean approved rows directly out of the Master Parish collection
    const approvedParishes = await Parish.find({ zone: 'Benin' }).sort({ name: 1 });
    
    // Format out uniformly for frontend selector parameters
    const formattedData = approvedParishes.map(p => ({
      _id: p._id,
      name: p.name,
      deanery: p.zone
    }));
    
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// EXCEL BULK UPLOAD ENGINE FOR MASTER PARISHES WITH AUTOMATIC FINANCE ACCOUNT INITIALIZATION
export const bulkUploadParishes = async (req, res) => {
  try {
    const { records } = req.body; 
    if (!records || records.length === 0) {
      return res.status(400).json({ success: false, message: "No records detected." });
    }

    let insertCount = 0;
    const currentYear = new Date().getFullYear();

    for (const item of records) {
      if (!item || !item.parishName || String(item.parishName).trim().length === 0) {
        continue; 
      }
      
      const targetParishName = String(item.parishName).trim();

      // 1. Check or insert into Master Parishes
      let parishDoc = await Parish.findOne({ name: targetParishName });
      if (!parishDoc) {
        parishDoc = await Parish.create({
          name: targetParishName,
          zone: 'Benin' 
        });
        insertCount++;
      }

      // 2. Check your Finance collection using the string name to match your DB schema layout
      const financeExists = await Finance.findOne({ parishName: targetParishName, year: currentYear });
      
      if (!financeExists) {
        // FIX: Explicitly sending 'parishName' so it never saves as a duplicate 'null'!
        await Finance.create({
          parish: parishDoc._id,      // Keeps your relational link intact
          parishName: targetParishName, // SAFELY FEEDS THE UNIQUE INDEX RULE IN MONGO
          year: currentYear,
          deanery: 'Benin',
          duesPaidAmount: 0,
          seminarPaidAmount: 0,
          competitionPaidAmount: 0
        });
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Registry updated! Successfully processed and initialized ${insertCount} new unique Benin deanery parishes with automatic linked annual financial accounts.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUBLIC SUBMISSION POST HANDLER
export const publicCheckIn = async (req, res) => {
  try {
    const { firstName, lastName, phone, gender, ageBracket, dateOfBirth, publicBirthdayConsent, yearCommissioned, employmentStatus, deanery, parishName, parishId, roleInParish } = req.body;

    const parsedYear = Number(yearCommissioned);
    if (publicBirthdayConsent !== undefined && typeof publicBirthdayConsent !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Public birthday consent must be true or false.' });
    }
    if (publicBirthdayConsent === true && !dateOfBirth) {
      return res.status(400).json({ success: false, message: 'A date of birth is required for public birthday display.' });
    }
    let parsedDateOfBirth = null;
    if (dateOfBirth) {
      try {
        parsedDateOfBirth = parseBirthDate(dateOfBirth);
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (parsedDateOfBirth > new Date()) {
        return res.status(400).json({ success: false, message: 'Enter a valid date of birth.' });
      }
    }
    const yearCommissionedValue = (!yearCommissioned || String(yearCommissioned).trim() === '' || String(yearCommissioned).toLowerCase().includes('not commissioned') || Number.isNaN(parsedYear))
      ? null
      : parsedYear;

    let parishDoc = null;
    if (parishId) {
      parishDoc = await Parish.findById(parishId);
      if (!parishDoc) {
        return res.status(400).json({ success: false, message: 'Selected parish is invalid.' });
      }
    } else if (parishName) {
      parishDoc = await Parish.findOne({ name: parishName.trim() });
      if (!parishDoc) {
        parishDoc = await Parish.create({ name: parishName.trim(), zone: deanery || 'Benin' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Parish is required.' });
    }

    const duplicateQuery = {
      firstName: firstName.trim(),
      lastName: lastName.trim()
    };
    if (parishDoc) duplicateQuery.parish = parishDoc._id;

    const duplicate = await Lector.findOne(duplicateQuery);

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Registration already exists. Please contact your Parish President to update your record."
      });
    }

    const newLector = await Lector.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      gender,
      ageBracket,
      dateOfBirth: parsedDateOfBirth,
      publicBirthdayConsent: publicBirthdayConsent === true,
      yearCommissioned: yearCommissionedValue,
      employmentStatus,
      deanery: 'Benin', // Hardlock to Benin deanery profiles
      parish: parishDoc._id,
      parishName: parishDoc.name,
      roleInParish: roleInParish || 'Active Member'
    });

    res.status(201).json({ success: true, data: newLector });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addLector = async (req, res) => {
  try {
    const { role, parish } = req.user;
    const { firstName, lastName, phone, gender, dateOfBirth, publicBirthdayConsent, yearCommissioned, employmentStatus, parishId, roleInParish } = req.body;

    if (role === 'president' && !req.user.permissions?.add) {
      return res.status(403).json({ success: false, message: 'Add permission was not granted.' });
    }
    if (!firstName?.trim() || !lastName?.trim() || !parishId) {
      return res.status(400).json({ success: false, message: 'First name, last name and parish are required.' });
    }

    const parishDoc = await Parish.findById(parishId);
    if (!parishDoc) {
      return res.status(400).json({ success: false, message: 'Selected parish is invalid.' });
    }
    if (role === 'president' && parishDoc.name !== parish) {
      return res.status(403).json({ success: false, message: 'Presidents cannot add lectors outside their parish.' });
    }

    if (publicBirthdayConsent !== undefined && typeof publicBirthdayConsent !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Public birthday consent must be true or false.' });
    }
    if (publicBirthdayConsent === true && !dateOfBirth) {
      return res.status(400).json({ success: false, message: 'A date of birth is required for public birthday display.' });
    }
    let parsedDateOfBirth = null;
    if (dateOfBirth) {
      try {
        parsedDateOfBirth = parseBirthDate(dateOfBirth);
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (parsedDateOfBirth > new Date()) {
        return res.status(400).json({ success: false, message: 'Enter a valid date of birth.' });
      }
    }

    const duplicate = await Lector.findOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      parish: parishDoc._id
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'This lector is already registered in the selected parish.' });
    }

    const parsedYear = Number(yearCommissioned);
    const newLector = await Lector.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      gender,
      dateOfBirth: parsedDateOfBirth,
      publicBirthdayConsent: publicBirthdayConsent === true,
      yearCommissioned: !Number.isNaN(parsedYear) && parsedYear > 0 ? parsedYear : null,
      employmentStatus,
      deanery: 'Benin',
      parish: parishDoc._id,
      parishName: parishDoc.name,
      roleInParish: roleInParish || 'Active Member'
    });

    res.status(201).json({ success: true, data: newLector });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUpcomingBirthdays = async (req, res) => {
  try {
    const access = getBirthdayAccess(req, res);
    if (!access) return;

    const days = Math.min(366, Math.max(1, parseInt(req.query.days, 10) || 30));
    const lectors = await Lector.find({
      ...access.filter,
      status: 'Active',
      dateOfBirth: { $ne: null }
    }).select('firstName lastName parishName dateOfBirth phone');

    const birthdays = lectors.map((lector) => {
      const { month, day } = serializePublicBirthday(lector);
      const occurrence = getNextBirthdayOccurrence(month, day);
      return {
        id: String(lector._id),
        name: `${lector.firstName} ${lector.lastName}`,
        parishName: lector.parishName,
        month,
        day,
        daysUntil: occurrence.daysUntil,
        hasPhone: Boolean(normalizeWhatsAppPhone(lector.phone))
      };
    })
      .filter((item) => item.daysUntil <= days)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    res.status(200).json({ success: true, data: birthdays });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBirthdayWhatsAppDraft = async (req, res) => {
  try {
    const access = getBirthdayAccess(req, res);
    if (!access) return;
    if (!mongoose.isValidObjectId(req.params.lectorId)) {
      return res.status(400).json({ success: false, message: 'Invalid birthday record.' });
    }

    const lector = await Lector.findOne({
      _id: req.params.lectorId,
      ...access.filter,
      status: 'Active',
      dateOfBirth: { $ne: null }
    }).select('firstName lastName parishName phone dateOfBirth').lean();
    if (!lector) {
      return res.status(404).json({ success: false, message: 'Birthday record not found in your authorized community.' });
    }

    const phone = normalizeWhatsAppPhone(lector.phone);
    if (!phone) {
      return res.status(400).json({ success: false, message: 'A valid international phone number is not available for this person.' });
    }

    const name = `${lector.firstName || ''} ${lector.lastName || ''}`.trim();
    const message = access.role === 'president'
      ? `Happy birthday, ${name}! Wishing you a joyful and blessed year ahead. Warm wishes from your parish family at ${lector.parishName}.`
      : `Happy birthday, ${name}! Wishing you a joyful and blessed year ahead. Warm wishes from your deanery family.`;

    return res.status(200).json({
      success: true,
      url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    });
  } catch (error) {
    console.error('Error preparing birthday WhatsApp draft:', error);
    return res.status(500).json({ success: false, message: 'Unable to prepare the birthday message.' });
  }
};

export const getPublicBirthdays = async (req, res) => {
  try {
    const lectors = await Lector.find({
      status: 'Active',
      publicBirthdayConsent: true,
      dateOfBirth: { $ne: null }
    }).select('firstName lastName parishName dateOfBirth').lean();

    const birthdays = lectors
      .map(serializePublicBirthday)
      .sort((left, right) => left.month - right.month || left.day - right.day || left.name.localeCompare(right.name));

    res.status(200).json({ success: true, count: birthdays.length, data: birthdays });
  } catch (error) {
    console.error('Error in getPublicBirthdays:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    console.log('Querying for year:', year);

    const totalLectors = await Lector.countDocuments({ deanery: 'Benin' });
    const totalParishes = await Parish.countDocuments({ zone: 'Benin' });

    const feeTypes = await FeeType.find({ active: true }).select('_id name').lean();
    const feeTypeIds = feeTypes.map(type => type._id.toString());

    const feeTargets = await FeeTarget.find({ year })
      .populate('feeType', 'name')
      .lean();

    const targetByFeeTypeId = feeTargets.reduce((acc, target) => {
      const key = String(target.feeType?._id || target.feeType);
      acc[key] = Number(target.amount) || 0;
      return acc;
    }, {});

    const ledgerEntries = await LedgerEntry.aggregate([
      { $match: { year } },
      {
        $group: {
          _id: {
            parish: '$parish',
            feeType: '$feeType'
          },
          totalPaid: { $sum: '$amountPaid' }
        }
      }
    ]);

    const paymentsByParish = ledgerEntries.reduce((acc, entry) => {
      const parishId = String(entry._id.parish);
      const feeTypeId = String(entry._id.feeType);
      if (!acc[parishId]) acc[parishId] = {};
      acc[parishId][feeTypeId] = Number(entry.totalPaid) || 0;
      return acc;
    }, {});

    const parishDocs = await Parish.find({ zone: 'Benin' }).select('_id').lean();
    const compliantParishes = parishDocs.reduce((count, parish) => {
      const parishPayments = paymentsByParish[String(parish._id)] || {};

      const hasClearedAll = feeTypeIds.every((feeTypeId) => {
        const requiredAmount = targetByFeeTypeId[feeTypeId] ?? 0;
        const paidAmount = parishPayments[feeTypeId] ?? 0;
        return paidAmount >= requiredAmount;
      });

      return hasClearedAll ? count + 1 : count;
    }, 0);

    const outstandingParishes = Math.max(0, totalParishes - compliantParishes);

    console.log('Found Compliant:', compliantParishes, 'Outstanding:', outstandingParishes, 'For Year:', year);

    res.status(200).json({
      success: true,
      year,
      data: {
        totalLectors,
        totalParishes,
        compliantParishes,
        outstandingParishes
      }
    });
  } catch (error) {
    console.error('Error in getPublicStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// MULTI-TENANT ARCHDIOCESAN SECURITY ROSTER GETTER
export const getRegistryData = async (req, res) => {
  try {
    const { role, parish } = req.user;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(1000, Math.max(10, requestedLimit));
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status ? String(req.query.status).trim() : 'all';

    const buildSearchFilter = () => {
      if (!search) return {};
      const regex = new RegExp(search, 'i');
      return {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { parishName: regex },
          { roleInParish: regex }
        ]
      };
    };

    if (role === 'superadmin' || role === 'executive') {
      const filter = {
        deanery: 'Benin',
        ...buildSearchFilter()
      };

      if (status && status !== 'all') {
        filter.status = status;
      }

      const totalCount = await Lector.countDocuments(filter);
      const lectors = await Lector.find(filter)
        .populate('parish', 'name zone')
        .sort({ lastName: 1, firstName: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.status(200).json({
        success: true,
        scope: 'all',
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        data: lectors,
        status: status === 'all' ? 'all' : status
      });
    }

    if (role === 'president') {
      if (!req.user.permissions?.view) {
        return res.status(403).json({ success: false, message: 'View permission was not granted.' });
      }
      const filter = {
        parishName: parish,
        deanery: 'Benin',
        ...buildSearchFilter(),
        ...(status && status !== 'all' ? { status } : {})
      };
      const totalCount = await Lector.countDocuments(filter);
      const ownParishLectors = await Lector.find(filter)
        .select('-dateOfBirth')
        .populate('parish', 'name zone')
        .sort({ lastName: 1, firstName: 1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.status(200).json({
        success: true,
        scope: 'ownParish',
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        ownParish: ownParishLectors,
        otherExecutives: []
      });
    }

    if (role === 'member') {
      const sharedSearch = buildSearchFilter();
      const ownParishFilter = {
        parishName: parish,
        deanery: 'Benin',
        ...sharedSearch
      };
      const otherParishFilter = {
        parishName: { $ne: parish },
        deanery: 'Benin',
        roleInParish: { $ne: 'Active Member' },
        ...sharedSearch
      };

      if (status && status !== 'all') {
        ownParishFilter.status = status;
        otherParishFilter.status = status;
      }

      const ownParishLectors = await Lector.find(ownParishFilter).populate('parish', 'name zone');
      const otherParishExecutives = await Lector.find(otherParishFilter).populate('parish', 'name zone');

      return res.status(200).json({
        success: true,
        scope: 'restricted',
        ownParish: ownParishLectors,
        otherExecutives: otherParishExecutives
      });
    }

    res.status(403).json({ success: false, message: 'Denied access clearance tier.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLector = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, parish } = req.user;

    const { parishId, parishName, ...updateFields } = req.body;

    if (role === 'member') {
      return res.status(403).json({ message: 'Registry update permission was not granted.' });
    }
    if (role === 'president') {
      if (parishId !== undefined || parishName !== undefined || Object.prototype.hasOwnProperty.call(updateFields, 'deanery')) {
        return res.status(403).json({ message: 'Presidents cannot change a lector parish or deanery.' });
      }
      const hasNonStatusChanges = Object.keys(updateFields).some((field) => field !== 'status');
      if (Object.prototype.hasOwnProperty.call(updateFields, 'status') && !req.user.permissions?.suspend) {
        return res.status(403).json({ message: 'Suspend permission was not granted.' });
      }
      if (hasNonStatusChanges && !req.user.permissions?.update) {
        return res.status(403).json({ message: 'Update permission was not granted.' });
      }
    }

    if (Object.prototype.hasOwnProperty.call(updateFields, 'dateOfBirth')) {
      if (!updateFields.dateOfBirth) {
        updateFields.dateOfBirth = null;
      } else {
        try {
          updateFields.dateOfBirth = parseBirthDate(updateFields.dateOfBirth);
        } catch (error) {
          return res.status(400).json({ success: false, message: error.message });
        }
        if (updateFields.dateOfBirth > new Date()) {
          return res.status(400).json({ message: 'Enter a valid date of birth.' });
        }
      }
    }
    if (
      Object.prototype.hasOwnProperty.call(updateFields, 'publicBirthdayConsent') &&
      typeof updateFields.publicBirthdayConsent !== 'boolean'
    ) {
      return res.status(400).json({ success: false, message: 'Public birthday consent must be true or false.' });
    }

    const target = await Lector.findById(id);
    if (!target) return res.status(404).json({ message: "File missing." });
    if (
      updateFields.publicBirthdayConsent === true &&
      !(Object.prototype.hasOwnProperty.call(updateFields, 'dateOfBirth') ? updateFields.dateOfBirth : target.dateOfBirth)
    ) {
      return res.status(400).json({ success: false, message: 'A date of birth is required for public birthday display.' });
    }

    if (['member', 'president'].includes(role) && target.parishName !== parish) {
      return res.status(403).json({ message: "Unauthorized local perimeter control breach." });
    }

    if (parishId) {
      const parishDoc = await Parish.findById(parishId);
      if (!parishDoc) {
        return res.status(400).json({ message: 'Invalid parish selection.' });
      }
      if (role === 'president' && parishDoc.name !== parish) {
        return res.status(403).json({ message: 'Presidents cannot transfer lectors outside their parish.' });
      }
      updateFields.parish = parishDoc._id;
      updateFields.parishName = parishDoc.name;
    } else if (parishName) {
      const parishDoc = await Parish.findOne({ name: parishName.trim() });
      if (parishDoc) {
        updateFields.parish = parishDoc._id;
        updateFields.parishName = parishDoc.name;
      } else {
        updateFields.parishName = parishName.trim();
      }
    }

    const updated = await Lector.findByIdAndUpdate(id, updateFields, { new: true }).populate('parish', 'name zone');
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLector = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, parish } = req.user;

    if (role === 'president' && !req.user.permissions?.delete) {
      return res.status(403).json({ success: false, message: 'Delete permission was not granted.' });
    }

    const target = await Lector.findById(id);
    if (!target) return res.status(404).json({ message: "File missing." });

    if (['member', 'president'].includes(role) && target.parishName !== parish) {
      return res.status(403).json({ message: "Action barred." });
    }

    await Lector.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// BULK UNSUSPEND
export const bulkUnsuspend = async (req, res) => {
  try {
    const { ids, allSuspended } = req.body;
    const { role, parish } = req.user;

    if (role === 'member') {
      return res.status(403).json({ success: false, message: 'Suspend permission was not granted.' });
    }
    if (role === 'president' && !req.user.permissions?.suspend) {
      return res.status(403).json({ success: false, message: 'Suspend permission was not granted.' });
    }

    // If requesting to unsuspend all suspended records, restrict to superadmin
    if (allSuspended) {
      if (role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Only superadmin may unsuspend all records.' });
      }
      const result = await Lector.updateMany({ status: 'Suspended' }, { $set: { status: 'Active' } });
      const modified = result.modifiedCount || result.nModified || 0;
      try {
        await AuditLog.create({ action: 'bulk-unsuspend', user: req.user?._id, userRole: role, affectedCount: modified, ids: [], all: true, notes: 'Unsuspend all suspended requested via admin UI' });
      } catch (e) {
        console.error('Audit log create failed:', e);
      }
      return res.status(200).json({ success: true, modifiedCount: modified });
    }

    // Otherwise, expect an array of ids to unsuspend (executives allowed)
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No ids provided for bulk unsuspend.' });
    }

    const objectIds = ids.map(id => id);
    const scope = role === 'president' ? { parishName: parish } : {};
    const result = await Lector.updateMany({ _id: { $in: objectIds }, status: 'Suspended', ...scope }, { $set: { status: 'Active' } });
    const modified = result.modifiedCount || result.nModified || 0;
    try {
      await AuditLog.create({ action: 'bulk-unsuspend', user: req.user?._id, userRole: role, affectedCount: modified, ids: objectIds, all: false, notes: 'Unsuspend selected via admin UI' });
    } catch (e) {
      console.error('Audit log create failed:', e);
    }
    return res.status(200).json({ success: true, modifiedCount: modified });
  } catch (error) {
    console.error('bulkUnsuspend error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};