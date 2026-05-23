import Attendance from '../models/Attendance.js';

export const processCheckIn = async (req, res) => {
  try {
    const { isGuest, timestamp, details } = req.body;

    if (!details || !details.fullName || !details.parish || !details.role) {
      return res.status(400).json({
        success: false,
        message: 'Processing failure: Missing essential registration parameters (Name, Parish, or Role).'
      });
    }

    const newRecord = new Attendance({
      isGuest,
      timestamp: timestamp || new Date().toISOString(),
      details
    });

    await newRecord.save();

    return res.status(201).json({
      success: true,
      message: 'Attendance cleanly recorded on the server registry.',
      data: newRecord
    });

  } catch (error) {
    console.error('Database Insertion Pipeline Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error: Failed to safely commit check-in instance to Atlas.'
    });
  }
};