import AuditLog from '../models/AuditLog.js';

export const listAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
    const skip = (page - 1) * limit;
    const actionFilter = req.query.action ? String(req.query.action) : null;
    const q = req.query.q ? String(req.query.q).trim() : null;

    // Build aggregate pipeline to allow searching user names/notes/action
    const pipeline = [];
    if (actionFilter) pipeline.push({ $match: { action: actionFilter } });

    pipeline.push({ $sort: { createdAt: -1 } });

    // Lookup user
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    });
    pipeline.push({ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } });

    if (q) {
      const re = new RegExp(q, 'i');
      pipeline.push({
        $match: {
          $or: [
            { notes: { $regex: re } },
            { action: { $regex: re } },
            { 'user.firstName': { $regex: re } },
            { 'user.lastName': { $regex: re } },
            { userRole: { $regex: re } }
          ]
        }
      });
    }

    const countPipeline = pipeline.concat([{ $count: 'total' }]);
    const countRes = await AuditLog.aggregate(countPipeline).exec();
    const total = (countRes && countRes[0] && countRes[0].total) || 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const items = await AuditLog.aggregate(pipeline).exec();

    res.status(200).json({ success: true, page, limit, total, data: items });
  } catch (error) {
    console.error('listAuditLogs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
