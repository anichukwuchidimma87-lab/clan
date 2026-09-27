import Parish from '../models/Parish.js';
import Lector from '../models/Lector.js';

export const getParishes = async (req, res) => {
  try {
    const parishes = await Parish.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: parishes.length, data: parishes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createParish = async (req, res) => {
  try {
    const { name, zone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Parish name is required.' });
    }

    const existing = await Parish.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A parish with this name already exists.' });
    }

    const parish = await Parish.create({ name: name.trim(), zone: zone || 'Benin' });
    res.status(201).json({ success: true, data: parish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateParish = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, zone } = req.body;

    const parish = await Parish.findById(id);
    if (!parish) {
      return res.status(404).json({ success: false, message: 'Parish not found.' });
    }

    if (name && name.trim()) {
      const duplicate = await Parish.findOne({ name: name.trim(), _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Another parish with that name already exists.' });
      }
      parish.name = name.trim();
    }

    if (zone) {
      parish.zone = zone;
    }

    await parish.save();
    res.status(200).json({ success: true, data: parish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteParish = async (req, res) => {
  try {
    const { id } = req.params;
    const parish = await Parish.findById(id);
    if (!parish) {
      return res.status(404).json({ success: false, message: 'Parish not found.' });
    }

    const attachedLectors = await Lector.countDocuments({ $or: [{ parish: id }, { parishName: parish.name }] });
    if (attachedLectors > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete this parish while it has assigned members.' });
    }

    await parish.remove();
    res.status(200).json({ success: true, message: 'Parish deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getParishMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const parish = await Parish.findById(id);
    if (!parish) {
      return res.status(404).json({ success: false, message: 'Parish not found.' });
    }

    const members = await Lector.find({ $or: [{ parish: id }, { parishName: parish.name }]}).sort({ lastName: 1, firstName: 1 });
    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getParishesWithCounts = async (req, res) => {
  try {
    // Aggregate parishes with lector counts using a $lookup with pipeline
    const items = await Parish.aggregate([
      { $sort: { name: 1 } },
      {
        $lookup: {
          from: 'lectors',
          let: { pid: '$_id', pname: '$name' },
          pipeline: [
            { $match: { $expr: { $or: [ { $and: [ { $ne: ['$$pid', null] }, { $eq: ['$parish', '$$pid'] } ] }, { $eq: ['$parishName', '$$pname'] } ] } } },
            { $project: { _id: 1 } }
          ],
          as: 'lectors'
        }
      },
      {
        $project: {
          name: 1,
          zone: 1,
          createdAt: 1,
          updatedAt: 1,
          lectorCount: { $size: '$lectors' }
        }
      }
    ]).exec();

    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('[parishController] getParishesWithCounts error:', error && error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInactiveParishesReport = async (req, res) => {
  try {
    // parse filtering / pagination params
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const requestedLimit = Math.min(200, parseInt(req.query.limit, 10) || 50);
    const skip = (page - 1) * requestedLimit;
    const sortBy = String(req.query.sortBy || 'name'); // name or zone
    const zoneFilter = req.query.zone ? String(req.query.zone).trim() : null;
    const nameFilter = req.query.name ? String(req.query.name).trim() : null;
    const downloadCsv = String(req.query.download || '').toLowerCase() === 'csv';

    // build pipeline
    const pipeline = [];
    if (nameFilter) pipeline.push({ $match: { name: { $regex: new RegExp(nameFilter, 'i') } } });
    if (zoneFilter) pipeline.push({ $match: { zone: zoneFilter } });

    pipeline.push({ $lookup: {
      from: 'lectors',
      let: { pid: '$_id', pname: '$name' },
      pipeline: [
        { $match: { $expr: { $or: [ { $and: [ { $ne: ['$$pid', null] }, { $eq: ['$parish', '$$pid'] } ] }, { $eq: ['$parishName', '$$pname'] } ] } } },
        { $project: { firstName: 1, lastName: 1, phone: 1, roleInParish: 1, status: 1 } }
      ],
      as: 'members'
    } });

    pipeline.push({ $addFields: { lectorCount: { $size: '$members' } } });
    pipeline.push({ $match: { lectorCount: 0 } });

    // sort
    const sortObj = sortBy === 'zone' ? { zone: 1, name: 1 } : { name: 1 };
    pipeline.push({ $sort: sortObj });

    // If CSV requested, return full CSV respecting filters (no pagination)
    if (downloadCsv) {
      const items = await Parish.aggregate(pipeline).exec();
      const cols = ['Parish Name', 'Zone', 'MemberFirstName', 'MemberLastName', 'MemberPhone', 'MemberRole', 'MemberStatus'];
      const rows = [cols.join(',')];
      for (const p of items) {
        if (!p.members || p.members.length === 0) {
          rows.push(`"${String(p.name).replace(/"/g, '""')}","${String(p.zone || '').replace(/"/g, '""')}","","","","",""`);
        } else {
          for (const m of p.members) {
            const line = [
              `"${String(p.name).replace(/"/g, '""')}"`,
              `"${String(p.zone || '').replace(/"/g, '""')}"`,
              `"${String(m.firstName || '').replace(/"/g, '""')}"`,
              `"${String(m.lastName || '').replace(/"/g, '""')}"`,
              `"${String(m.phone || '').replace(/"/g, '""')}"`,
              `"${String(m.roleInParish || '').replace(/"/g, '""')}"`,
              `"${String(m.status || '').replace(/"/g, '""')}"`
            ];
            rows.push(line.join(','));
          }
        }
      }
      const csv = rows.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="inactive-parishes-full-report.csv"');
      return res.status(200).send(csv);
    }

    // get total count for pagination
    const countPipeline = pipeline.concat([{ $count: 'total' }]);
    const countRes = await Parish.aggregate(countPipeline).exec();
    const total = (countRes && countRes[0] && countRes[0].total) || 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: requestedLimit });

    const items = await Parish.aggregate(pipeline).exec();
    return res.status(200).json({ success: true, page, limit: requestedLimit, totalCount: total, totalPages: Math.ceil(total / requestedLimit), data: items });
  } catch (error) {
    console.error('[parishController] getInactiveParishesReport error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
