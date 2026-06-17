import Lector from '../models/Lector.js';
import Parish from '../models/Parish.js';
import Finance from '../models/Finance.js';
import FeeType from '../models/FeeType.js';
import FeeTarget from '../models/FeeTarget.js';
import LedgerEntry from '../models/LedgerEntry.js';

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
    const { firstName, lastName, phone, gender, ageBracket, yearCommissioned, employmentStatus, deanery, parishName, parishId, roleInParish } = req.body;

    const parsedYear = Number(yearCommissioned);
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

export const getPublicStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const totalLectors = await Lector.countDocuments({ deanery: 'Benin' });
    const totalParishes = await Parish.countDocuments({ zone: 'Benin' });

    const feeTypes = await FeeType.find({ active: true }).select('_id name').lean();
    const feeTypeIds = feeTypes.map(type => type._id.toString());

    const feeTargets = await FeeTarget.find({ year: currentYear })
      .populate('feeType', 'name')
      .lean();

    const targetByFeeTypeId = feeTargets.reduce((acc, target) => {
      const key = String(target.feeType?._id || target.feeType);
      acc[key] = Number(target.targetAmount) || 0;
      return acc;
    }, {});

    const ledgerEntries = await LedgerEntry.aggregate([
      { $match: { year: currentYear, deanery: 'Benin' } },
      {
        $group: {
          _id: {
            parish: '$parish',
            feeType: '$feeType'
          },
          totalPaid: { $sum: '$amount' }
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

    res.status(200).json({
      success: true,
      data: {
        totalLectors,
        totalParishes,
        compliantParishes,
        outstandingParishes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// MULTI-TENANT ARCHDIOCESAN SECURITY ROSTER GETTER
export const getRegistryData = async (req, res) => {
  try {
    const { role, parish } = req.user;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 20));
    const search = req.query.search ? String(req.query.search).trim() : '';

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

    if (role === 'superadmin' || role === 'admin') {
      const filter = {
        deanery: 'Benin',
        ...buildSearchFilter()
      };

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
        data: lectors
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

    const target = await Lector.findById(id);
    if (!target) return res.status(404).json({ message: "File missing." });

    if (role === 'member' && target.parishName !== parish) {
      return res.status(403).json({ message: "Unauthorized local perimeter control breach." });
    }

    if (parishId) {
      const parishDoc = await Parish.findById(parishId);
      if (!parishDoc) {
        return res.status(400).json({ message: 'Invalid parish selection.' });
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

    const target = await Lector.findById(id);
    if (!target) return res.status(404).json({ message: "File missing." });

    if (role === 'member' && target.parishName !== parish) {
      return res.status(403).json({ message: "Action barred." });
    }

    await Lector.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};