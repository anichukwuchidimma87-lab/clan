import Parish from '../models/Parish.js';
import FeeType from '../models/FeeType.js';
import FeeTarget from '../models/FeeTarget.js';
import LedgerEntry from '../models/LedgerEntry.js';

const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildLedgerData = async (year, parishId = null) => {
  const parishFilter = parishId ? { _id: parishId } : {};
  const entryFilter = parishId ? { year, parish: parishId } : { year };
  const [parishes, feeTypes, targets, entries] = await Promise.all([
    Parish.find(parishFilter).sort({ name: 1 }).lean(),
    FeeType.find({ active: true }).sort({ name: 1 }).lean(),
    FeeTarget.find({ year }).lean(),
    LedgerEntry.find(entryFilter).lean()
  ]);

  const targetMap = new Map(targets.map(target => [String(target.feeType), target]));

  const totals = feeTypes.reduce((acc, feeType) => ({
    ...acc,
    [feeType.slug]: 0
  }), { grandTotal: 0 });

  const entryMap = new Map(entries.map((entry) => [`${String(entry.parish)}-${String(entry.feeType)}`, entry]));

  entries.forEach(entry => {
    const feeType = feeTypes.find(type => String(type._id) === String(entry.feeType));
    if (!feeType) return;
    totals[feeType.slug] = (totals[feeType.slug] || 0) + entry.amountPaid;
    totals.grandTotal += entry.amountPaid;
  });

  const compliantParishes = parishes.reduce((count, parish) => {
    const parishKey = String(parish._id);
    const isCompliant = feeTypes.every((feeType) => {
      const targetAmount = targetMap.has(String(feeType._id)) ? Number(targetMap.get(String(feeType._id)).amount) : 0;
      const entry = entryMap.get(`${parishKey}-${String(feeType._id)}`);
      const paidAmount = entry ? Number(entry.amountPaid) : 0;
      return paidAmount >= targetAmount;
    });

    return isCompliant ? count + 1 : count;
  }, 0);

  const summary = {
    totalParishes: parishes.length,
    compliantParishes,
    outstandingParishes: Math.max(0, parishes.length - compliantParishes)
  };

  return {
    parishes,
    feeTypes: feeTypes.map(feeType => ({
      ...feeType,
      targetAmount: targetMap.has(String(feeType._id)) ? targetMap.get(String(feeType._id)).amount : 0
    })),
    entries,
    totals,
    summary
  };
};

export const getLedger = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const role = req.user.role;
    let parishId = null;
    if (role === 'president') {
      if (!req.user.parish) {
        return res.status(403).json({ success: false, message: 'Your account is not assigned to a parish.' });
      }
      const parish = await Parish.findOne({ name: req.user.parish }).select('_id').lean();
      if (!parish) {
        return res.status(404).json({ success: false, message: 'Your assigned parish could not be found.' });
      }
      parishId = parish._id;
    } else if (!['superadmin', 'executive'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view the financial ledger.' });
    }

    const data = await buildLedgerData(year, parishId);

    res.status(200).json({
      success: true,
      year,
      scope: parishId ? 'ownParish' : 'all',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLedgerSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    let parishId = null;
    if (req.user.role === 'president') {
      if (!req.user.parish) {
        return res.status(403).json({ success: false, message: 'Your account is not assigned to a parish.' });
      }
      const parish = await Parish.findOne({ name: req.user.parish }).select('_id').lean();
      if (!parish) {
        return res.status(404).json({ success: false, message: 'Your assigned parish could not be found.' });
      }
      parishId = parish._id;
    } else if (!['superadmin', 'executive'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view the financial summary.' });
    }

    const data = await buildLedgerData(year, parishId);

    res.status(200).json({
      success: true,
      year,
      scope: parishId ? 'ownParish' : 'all',
      data: {
        summary: data.summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertLedgerEntry = async (req, res) => {
  try {
    const { year, parishId, feeTypeId, amountPaid } = req.body;
    const parsedYear = Number(year) || new Date().getFullYear();
    const parsedAmount = Number(amountPaid);

    if (!parishId || !feeTypeId) {
      return res.status(400).json({ success: false, message: 'Year, parishId, and feeTypeId are required.' });
    }

    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ success: false, message: 'Amount paid must be a non-negative number.' });
    }

    const parish = await Parish.findById(parishId);
    if (!parish) {
      return res.status(404).json({ success: false, message: 'Parish not found in the registry.' });
    }

    const feeType = await FeeType.findById(feeTypeId);
    if (!feeType || !feeType.active) {
      return res.status(404).json({ success: false, message: 'Fee type not found or is inactive.' });
    }

    const entry = await LedgerEntry.findOneAndUpdate(
      { parish: parishId, feeType: feeTypeId, year: parsedYear },
      { $set: { amountPaid: parsedAmount } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeeTypes = async (req, res) => {
  try {
    const feeTypes = await FeeType.find().sort({ name: 1 }).lean();
    res.status(200).json({ success: true, data: feeTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFeeType = async (req, res) => {
  try {
    const { name, targetAmount, year } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Fee type name is required.' });
    }

    const slug = slugify(name);
    const existing = await FeeType.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A fee type with this name already exists.' });
    }

    const feeType = await FeeType.create({ name: name.trim(), slug, active: true });

    if (year && typeof targetAmount !== 'undefined') {
      await FeeTarget.findOneAndUpdate(
        { feeType: feeType._id, year: Number(year) },
        { $set: { amount: Number(targetAmount) || 0 } },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ success: true, data: feeType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFeeType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, active } = req.body;
    const feeType = await FeeType.findById(id);
    if (!feeType) {
      return res.status(404).json({ success: false, message: 'Fee type not found.' });
    }

    if (name && name.trim()) {
      const slug = slugify(name);
      const existing = await FeeType.findOne({ slug, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Another fee type with this name exists.' });
      }
      feeType.name = name.trim();
      feeType.slug = slug;
    }

    if (typeof active === 'boolean') {
      feeType.active = active;
    }

    await feeType.save();
    res.status(200).json({ success: true, data: feeType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertFeeTarget = async (req, res) => {
  try {
    const { feeTypeId, year, amount } = req.body;
    const parsedYear = Number(year) || new Date().getFullYear();
    const parsedAmount = Number(amount);

    if (!feeTypeId) {
      return res.status(400).json({ success: false, message: 'feeTypeId is required.' });
    }

    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ success: false, message: 'Target amount must be a non-negative number.' });
    }

    const feeType = await FeeType.findById(feeTypeId);
    if (!feeType) {
      return res.status(404).json({ success: false, message: 'Fee type not found.' });
    }

    const target = await FeeTarget.findOneAndUpdate(
      { feeType: feeTypeId, year: parsedYear },
      { $set: { amount: parsedAmount } },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: target });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
