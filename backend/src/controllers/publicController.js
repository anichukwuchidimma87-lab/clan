import User from '../models/User.js';
import GalleryItem from '../models/GalleryItem.js';

/**
 * Get all executives and leadership team members
 * Public endpoint - no authentication required
 */
const leadershipPositions = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Financial Secretary',
  'Assistant Financial Secretary',
  'PRO',
  'Welfare Officer',
  'Provost',
  'Executive Member',
  'Patron',
  'Patroness'
];

export const getExecutives = async (req, res) => {
  try {
    const executives = await User.find({
      position: {
        $in: leadershipPositions.filter(position => !['Patron', 'Patroness'].includes(position))
      }
    }).select('name position profileImage email');

    res.status(200).json({
      success: true,
      count: executives.length,
      data: executives,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Patron and Patroness information
 * Public endpoint - no authentication required
 */
export const getPatrons = async (req, res) => {
  try {
    const patrons = await User.find({
      position: {
        $in: ['Patron', 'Patroness']
      }
    }).select('name position profileImage email');

    res.status(200).json({
      success: true,
      count: patrons.length,
      data: patrons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all leadership profiles (executives + patrons)
 * Public endpoint for the leadership showcase
 */
export const getLeadershipProfiles = async (req, res) => {
  try {
    const leadership = await User.find({
      position: {
        $in: leadershipPositions
      }
    }).select('name position profileImage email profileTitle').sort({ position: 1, name: 1 });

    const organized = {
      executives: leadership.filter(l =>
        !['Patron', 'Patroness'].includes(l.position)
      ),
      patrons: leadership.filter(l =>
        ['Patron', 'Patroness'].includes(l.position)
      ),
    };

    res.status(200).json({
      success: true,
      data: organized,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGalleryByCategory = async (req, res) => {
  try {
    const { category, limit } = req.query;
    if (!category) {
      return res.status(400).json({ success: false, message: 'A gallery category is required.' });
    }

    const items = await GalleryItem.find({ category })
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 12);

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get recent event images from Cloudinary
 * This will be extended later to fetch from a dedicated Events collection
 */
export const getRecentEvents = async (req, res) => {
  try {
    // Placeholder: This will integrate with Cloudinary API or Events model
    // For now, returning a structure for frontend integration
    const limit = req.query.limit || 4;

    res.status(200).json({
      success: true,
      message: 'Recent events endpoint - to be populated with Cloudinary integration',
      limit,
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
