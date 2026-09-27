import DeanerySetting from '../models/DeanerySetting.js';

export const listDeaneryTargets = async (req, res) => {
  try {
    const items = await DeanerySetting.find().lean();
    const map = {};
    items.forEach(i => { map[i.deanery] = i.healthTarget; });
    res.status(200).json({ success: true, data: map });
  } catch (error) {
    console.error('listDeaneryTargets error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertDeaneryTarget = async (req, res) => {
  try {
    // support either single object or array of { deanery, healthTarget }
    const payload = req.body;
    if (Array.isArray(payload)) {
      const results = [];
      for (const item of payload) {
        if (!item || !item.deanery) continue;
        const value = Number(item.healthTarget) || 50;
        const doc = await DeanerySetting.findOneAndUpdate({ deanery: item.deanery }, { healthTarget: value, updatedBy: req.user?._id }, { upsert: true, new: true });
        results.push(doc);
      }
      return res.status(200).json({ success: true, data: results });
    }

    const { deanery, healthTarget } = payload || {};
    if (!deanery) return res.status(400).json({ success: false, message: 'Deanery required.' });
    const value = Number(healthTarget) || 50;
    const doc = await DeanerySetting.findOneAndUpdate({ deanery }, { healthTarget: value, updatedBy: req.user?._id }, { upsert: true, new: true });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error('upsertDeaneryTarget error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
