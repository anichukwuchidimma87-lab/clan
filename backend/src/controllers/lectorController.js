import Lector from '../models/Lector.js';
import Parish from '../models/Parish.js';
import Finance from '../models/Finance.js';

// HELPER PUBLIC ENDPOINT: Feeds the dynamic check-in page dropdown safely from master registry records
export const getActiveParishList = async (req, res) => {
  try {
    // Pull clean approved rows directly out of the Master Parish collection
    const approvedParishes = await Parish.find({ zone: 'Benin' }).sort({ name: 1 });
    
    // Format out uniformly for frontend selector parameters
    const formattedData = approvedParishes.map(p => ({
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
    const { firstName, lastName, phone, gender, ageBracket, yearCommissioned, employmentStatus, deanery, parishName, roleInParish } = req.body;

    const duplicate = await Lector.findOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      parishName: parishName.trim()
    });

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
      yearCommissioned: Number(yearCommissioned),
      employmentStatus,
      deanery: 'Benin', // Hardlock to Benin deanery profiles
      parishName: parishName.trim(),
      roleInParish: roleInParish || 'Active Member'
    });

    res.status(201).json({ success: true, data: newLector });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicStats = async (req, res) => {
  try {
    const totalLectors = await Lector.countDocuments({ deanery: 'Benin' });
    const totalParishes = await Parish.countDocuments({ zone: 'Benin' });

    res.status(200).json({
      success: true,
      data: {
        totalLectors,
        totalParishes
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

    if (role === 'superadmin' || role === 'admin') {
      const allLectors = await Lector.find({ deanery: 'Benin' });
      return res.status(200).json({ success: true, scope: "all", data: allLectors });
    }

    if (role === 'member') {
      const ownParishLectors = await Lector.find({ parishName: parish, deanery: 'Benin' });
      const otherParishExecutives = await Lector.find({ 
        parishName: { $ne: parish },
        deanery: 'Benin',
        roleInParish: { $ne: 'Active Member' } 
      });

      return res.status(200).json({
        success: true,
        scope: "restricted",
        ownParish: ownParishLectors,
        otherExecutives: otherParishExecutives
      });
    }

    res.status(403).json({ success: false, message: "Denied access clearance tier." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLector = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, parish } = req.user;
    
    const target = await Lector.findById(id);
    if (!target) return res.status(404).json({ message: "File missing." });

    if (role === 'member' && target.parishName !== parish) {
      return res.status(403).json({ message: "Unauthorized local perimeter control breach." });
    }

    const updated = await Lector.findByIdAndUpdate(id, req.body, { new: true });
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