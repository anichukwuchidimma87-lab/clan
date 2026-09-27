import User from '../models/User.js';
import GalleryItem from '../models/GalleryItem.js';

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

const getCurrentYear = () => new Date().getFullYear();

const buildCurrentSessionFilter = (currentYear = getCurrentYear()) => ({
  status: 'approved',
  position: { $in: leadershipPositions },
  $or: [
    { isCurrentExecutiveSession: true },
    { executiveSessionStart: { $lte: currentYear }, executiveSessionEnd: { $gte: currentYear } },
    { executiveSessionStart: null, executiveSessionEnd: null }
  ]
});

const sortAndPrioritize = (members) => [...members].sort((a, b) => {
  if (Number(b.isFeaturedOnHomepage) !== Number(a.isFeaturedOnHomepage)) {
    return Number(b.isFeaturedOnHomepage) - Number(a.isFeaturedOnHomepage);
  }

  if ((Number(a.homepageOrder) || 0) !== (Number(b.homepageOrder) || 0)) {
    return (Number(a.homepageOrder) || 0) - (Number(b.homepageOrder) || 0);
  }

  return (a.name || '').localeCompare(b.name || '');
});

export const getExecutives = async (req, res) => {
  try {
    const currentYear = getCurrentYear();
    const executives = await User.find({
      status: 'approved',
      position: {
        $in: leadershipPositions.filter(position => !['Patron', 'Patroness'].includes(position))
      },
      $or: [
        { isCurrentExecutiveSession: true },
        { executiveSessionStart: { $lte: currentYear }, executiveSessionEnd: { $gte: currentYear } },
        { executiveSessionStart: null, executiveSessionEnd: null }
      ]
    }).select('name position profileImage email profileTitle phone executiveSessionStart executiveSessionEnd isCurrentExecutiveSession isFeaturedOnHomepage homepageOrder')
      .sort({ isFeaturedOnHomepage: -1, homepageOrder: 1, name: 1 });

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

export const getPatrons = async (req, res) => {
  try {
    const patrons = await User.find({
      status: 'approved',
      position: { $in: ['Patron', 'Patroness'] }
    }).select('name position profileImage email phone profileTitle executiveSessionStart executiveSessionEnd isCurrentExecutiveSession').sort({ name: 1 });

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

export const getLeadershipProfiles = async (req, res) => {
  try {
    const currentYear = getCurrentYear();
    const leadership = await User.find(buildCurrentSessionFilter(currentYear)).select('name position profileImage email profileTitle phone executiveSessionStart executiveSessionEnd isCurrentExecutiveSession isFeaturedOnHomepage homepageOrder')
      .sort({ isFeaturedOnHomepage: -1, homepageOrder: 1, position: 1, name: 1 });

    const executives = sortAndPrioritize(
      leadership.filter(l => !['Patron', 'Patroness'].includes(l.position))
    );
    const patrons = leadership.filter(l => ['Patron', 'Patroness'].includes(l.position));

    const featuredExecutives = executives.filter(member => member.isFeaturedOnHomepage === true).slice(0, 3);
    const finalFeaturedExecutives = featuredExecutives.length > 0 ? featuredExecutives : executives.slice(0, 3);

    const organized = {
      executives,
      featuredExecutives: finalFeaturedExecutives,
      patrons,
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

export const getRecentEvents = async (req, res) => {
  try {
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
