import Lector from '../models/Lector.js';

// PUBLIC LINK: Public Check-In submission handling
export const publicCheckIn = async (req, res) => {
  try {
    const { firstName, lastName, phone, deanery, parishName, roleInParish } = req.body;

    // Check if the first + last name already exist in this specific parish
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
      deanery,
      parishName: parishName.trim(),
      roleInParish: roleInParish || 'Active Member'
    });

    res.status(201).json({ success: true, data: newLector });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// SECURE REGISTRY: Fetch data based on organizational hierarchy tiering roles
export const getRegistryData = async (req, res) => {
  try {
    const { role, parish } = req.user; // Appended by authorization decoding token payloads

    // Super Admins and Executives (admins) pull down the entire archdiocesan roster map
    if (role === 'superadmin' || role === 'admin') {
      const allLectors = await Lector.find({});
      return res.status(200).json({ success: true, scope: "all", data: allLectors });
    }

    // Parish Presidents (members) fetch all floor members in their parish, plus Executives from others
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

    res.status(403).json({ success: false, message: "Unauthorized tier access." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update record parameters
export const updateLector = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, parish } = req.user;
    
    const target = await Lector.findById(id);
    if (!target) return res.status(404).json({ message: "Lector file record not found" });

    // Hierarchy Gate: A Parish President cannot edit records outside their church walls
    if (role === 'member' && target.parishName !== parish) {
      return res.status(403).json({ message: "Access violation. You can only update your own parish files." });
    }

    const updated = await Lector.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete record execution parameters
export const deleteLector = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, parish } = req.user;

    const target = await Lector.findById(id);
    if (!target) return res.status(404).json({ message: "Record not found" });

    if (role === 'member' && target.parishName !== parish) {
      return res.status(403).json({ message: "Access violation. Unauthorized parameter." });
    }

    await Lector.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Lector deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};