import Lector from '../models/Lector.js';
import FinanceKey from '../models/Finance.js'; // Fallback path mapping or ledger source if needed

// HELPER PUBLIC ENDPOINT: Feed drop-down options safely from real administrative datasets
export const getActiveParishList = async (req, res) => {
  try {
    // Collect all existing unique parishes running in the financial ledger matrix setup
    const ledgerParishes = await FinanceKey.find({}, 'parishName deanery');
    
    // Format them out uniquely
    const structuralMap = ledgerParishes.map(p => ({
      name: p.parishName,
      deanery: p.deanery || 'Benin'
    }));
    
    // Filter duplicates out dynamically
    const uniqueParishes = Array.from(new Map(structuralMap.map(item => [item.name, item])).values());
    
    res.status(200).json({ success: true, data: uniqueParishes });
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
      deanery,
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