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
