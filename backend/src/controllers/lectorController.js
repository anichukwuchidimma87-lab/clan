import Lector from '../models/Lector.js';
import Parish from '../models/Parish.js'; // Points to your unified, original Parish model

// HELPER PUBLIC ENDPOINT: Feed drop-down options safely from real administrative datasets
export const getActiveParishList = async (req, res) => {
  try {
    // Pull clean approved rows directly out of your actual Parish collection using your exact schema keys
    const approvedParishes = await Parish.find({}, 'name zone').sort({ name: 1 });
    
    // Format them out so the frontend dropdown logic receives consistent property names
    const formattedData = approvedParishes.map(p => ({
      name: p.name,       // Maps your schema 'name' to frontend option label
      deanery: p.zone     // Maps your schema 'zone' to frontend deanery filter
    }));
    
    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// EXCEL BULK UPLOAD ENGINE FOR MASTER PARISHES
export const bulkUploadParishes = async (req, res) => {
  try {
    const { records } = req.body; // Array of { parishName, deanery } from frontend Excel reader
    if (!records || records.length === 0) {
      return res.status(400).json({ success: false, message: "No records detected." });
    }

    let insertCount = 0;

    for (const item of records) {
      if (!item.parishName) continue;
      
      // Look up using your original schema key field 'name'
      const exists = await Parish.findOne({ name: item.parishName.trim() });
      
      // If the church isn't in your ledger/registry system yet, create it safely without touching others
      if (!exists) {
        await Parish.create({
          name: item.parishName.trim(),
          zone: item.deanery || 'Benin' // Maps uploaded deanery data to your 'zone' database key
        });
        insertCount++;
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Successfully processed list. Inserted ${insertCount} new parishes into the shared registry database.` 
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
      deanery,              // Stored as 'Benin', 'Abudu', or 'Eguabazua' on the individual member's card
      parishName: parishName.trim(),
      roleInParish: roleInParish || 'Active Member'
    });

    res.status(201).json({ success: true, data: newLector });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// MULTI-TENANT ARCHDIOCESAN SECURITY ROSTER GETTER
export const getRegistryData = async (req, res) => {
  try {
    const { role, parish } = req.user; 

    if (role === 'superadmin' || role === 'admin') {
      const allLectors = await Lector.find({});
      return res.status(200).json({ success: true, scope: "all", data: allLectors });
    }

    if (role === 'member') {
      const ownParishLectors = await Lector.find({ parishName: parish });
      const otherParishExecutives = await Lector.find({ 
        parishName: { $ne: parish },
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

// REMOVE INDIVIDUAL MEMBER PROFILE DATA RECORD
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