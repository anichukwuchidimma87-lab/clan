import Attendance from '../models/Attendance.js';

export const processCheckIn = async (req, res) => {
  try {
    // We now expect the payload to include 'hierarchy' directly
    const { isGuest, fullName, role, hierarchy } = req.body;

    // Validate essential parameters
    if (!fullName || !role || !hierarchy || !hierarchy.parish) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing essential registration parameters (Name, Role, or Parish).' 
      });
    }
    
    const newRecord = new Attendance({
      isGuest,
      fullName,
      role,
      hierarchy // Saving the nested section/parish object
    });

    await newRecord.save();
    return res.status(200).json({ 
      success: true, 
      message: `Attendance recorded for ${fullName}!` 
    });
  } catch (error) {
    console.error("Database Save Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to log attendance to database" 
    });
  }
};

// getAttendance and deleteAttendance remain the same, 
// but will now return the new 'hierarchy' field in your dashboard results!
export const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({}).sort({ createdAt: -1 });
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