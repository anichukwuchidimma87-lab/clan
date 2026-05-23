import Attendance from '../models/Attendance.js';

export const processCheckIn = async (req, res) => {
  try {
    const { isGuest, details } = req.body;
    if (!details || !details.fullName || !details.parish || !details.role) {
      return res.status(400).json({ success: false, message: 'Missing essential registration parameters.' });
    }
    
    const newRecord = new Attendance({
      isGuest: isGuest,
      fullName: details.fullName,
      parish: details.parish,
      role: details.role
    });

    await newRecord.save();
    return res.status(200).json({ success: true, message: `Attendance recorded for ${details.fullName}!` });
  } catch (error) {
    console.error("Database Save Error:", error);
    return res.status(500).json({ success: false, message: "Failed to log attendance to database" });
  }
};

// Function to fetch all records for the registry dashboard
export const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({});
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching registry records' });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    await Attendance.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting record' });
  }
};