import express from 'express';
import Parish from '../models/Parish.js'; // Assuming you create this model
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/v1/parishes
// @desc    Get all parish financial data
router.get('/', protect, async (req, res) => {
  try {
    const parishes = await Parish.find();
    res.json(parishes);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching parishes" });
  }
});

// @route   PATCH /api/v1/parishes/:id
// @desc    Update a specific payment field for a parish
router.patch('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    // We only update the field sent in the request (e.g., duesPaid)
    const updatedParish = await Parish.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedParish) {
      return res.status(404).json({ message: "Parish not found" });
    }

    res.json(updatedParish);
  } catch (err) {
    res.status(500).json({ message: "Server error updating record" });
  }
});

export default router;