import GalleryItem from '../models/GalleryItem.js';

const sampleCategory = async (category, size) => {
  const available = await GalleryItem.find({ category });
  if (!available.length) return [];
  if (available.length <= size) {
    return available.sort(() => Math.random() - 0.5);
  }

  const result = [];
  const used = new Set();
  while (result.length < size) {
    const candidate = available[Math.floor(Math.random() * available.length)];
    const id = candidate._id.toString();
    if (!used.has(id)) {
      used.add(id);
      result.push(candidate);
    }
  }

  return result;
};

export const createGalleryItem = async (req, res) => {
  try {
    const { title, caption, url, category, featured, tags } = req.body;
    // Debug: log the raw file object set by multer-storage-cloudinary
    try {
      console.log('[galleryController] req.file:', req.file ? { originalname: req.file.originalname, path: req.file.path, size: req.file.size } : null);
    } catch (e) {
      console.error('[galleryController] Failed to log req.file', e && e.message);
    }
    const uploadedUrl = req.file?.path;
    const finalUrl = uploadedUrl || url;

    if (!finalUrl || !category) {
      return res.status(400).json({ success: false, message: 'Gallery item must include a url and category.' });
    }

    const newItem = await GalleryItem.create({
      title,
      caption,
      url: finalUrl,
      category,
      featured: featured === true || featured === 'true',
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : []),
      uploadedBy: req.user._id
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGalleryItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) {
      const regex = new RegExp(String(search), 'i');
      filter.$or = [
        { title: regex },
        { caption: regex },
        { category: regex },
        { tags: regex }
      ];
    }
    const items = await GalleryItem.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGalleryItem = async (req, res) => {
  try {
    const { title, caption, featured, tags } = req.body;
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found.' });
    }

    if (typeof title === 'string') item.title = title.trim();
    if (typeof caption === 'string') item.caption = caption.trim();
    if (typeof featured !== 'undefined') item.featured = featured === 'true' || featured === true;
    if (typeof tags !== 'undefined') {
      item.tags = Array.isArray(tags)
        ? tags.map(tag => String(tag).trim()).filter(Boolean)
        : String(tags).split(',').map(tag => tag.trim()).filter(Boolean);
    }

    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found.' });
    }

    await item.remove();
    res.status(200).json({ success: true, message: 'Gallery item deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRandomGallery = async (req, res) => {
  try {
    const gallery = {
      seminar: await sampleCategory('seminar', 5),
      voalc: await sampleCategory('voalc', 2),
      awardees: await sampleCategory('awardees', 2),
      orphanage: await sampleCategory('orphanage', 2),
      patrons: await sampleCategory('patrons', 2),
      executives: await sampleCategory('executives', 3),
    };

    const payload = [
      ...gallery.seminar,
      ...gallery.voalc,
      ...gallery.awardees,
      ...gallery.orphanage,
      ...gallery.patrons,
      ...gallery.executives,
    ];

    res.status(200).json({
      success: true,
      data: payload,
      breakdown: {
        seminar: gallery.seminar.length,
        voalc: gallery.voalc.length,
        awardees: gallery.awardees.length,
        orphanage: gallery.orphanage.length,
        patrons: gallery.patrons.length,
        executives: gallery.executives.length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentGallery = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 4;
    const items = await GalleryItem.find().sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
