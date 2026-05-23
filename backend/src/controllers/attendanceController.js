import Attendance from '../models/Attendance.js';

export const processCheckIn = async (req, res) => {
  try {
    const { isGuest, details } = req.body;

    if (!details || !details.fullName || !details.parish || !details.role) {
      return res.status(400).json({
        success: false,
        message: 'Processing failure: Missing essential registration parameters.'
      });
    }
    
    // Create a database record based on the payload details
    const newRecord = new Attendance({
      isGuest: isGuest,
      fullName: details.fullName,
      parish: details.parish,
      role: details.role
    });

    await newRecord.save();

    return res.status(200).json({ 
      success: true, 
      message: `Attendance cleanly recorded for ${details.fullName}!` 
    });
  } catch (error) {
    console.error("Database Save Error:", error);
    return res.status(500).json({ success: false, message: "Failed to log attendance to database" });
  }
};

// Add this to your attendanceController.js
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    await Attendance.findByIdAndDelete(id);
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting record' });
  }
};