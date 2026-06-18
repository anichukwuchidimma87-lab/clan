import GalleryItem from '../models/GalleryItem.js';
import { v2 as cloudinary } from 'cloudinary';

const sampleCategory = async (category, size) => {
  const filter = category ? { category } : {};
  const available = await GalleryItem.find(filter);
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
    const publicId = req.file?.filename || req.file?.public_id || req.file?.publicId;
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
      uploadedBy: req.user._id,
      publicId: publicId || undefined
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

    // Handle file replacement when provided via multer upload
    if (req.file) {
      const newUrl = req.file.path;
      const newPublicId = req.file.filename || req.file.public_id || req.file.publicId;

      // If existing item has a publicId, attempt to remove it from Cloudinary to avoid orphaned assets
      if (item.publicId) {
        try {
          await cloudinary.uploader.destroy(item.publicId, { resource_type: 'auto' });
            console.log('[galleryController] destroyed old Cloudinary asset:', item.publicId);
        } catch (err) {
          console.error('[galleryController] Failed to destroy old Cloudinary asset', item.publicId, err && err.message);
        }
      }

      item.url = newUrl;
      item.publicId = newPublicId || item.publicId;
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

    // If item has a Cloudinary publicId, attempt to delete the remote asset
    if (item.publicId) {
      try {
        await cloudinary.uploader.destroy(item.publicId, { resource_type: 'auto' });
      } catch (err) {
        console.error('[galleryController] Failed to destroy Cloudinary asset for', item.publicId, err && err.message);
        // continue to remove DB record even if cloudinary deletion fails
      }
    }

    await item.remove();
    res.status(200).json({ success: true, message: 'Gallery item deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRandomGallery = async (req, res) => {
  try {
    const eventChronicleCategories = ['seminar', 'orphanage', 'voalc', 'events', 'awardees'];
    const allPromises = [
      ...eventChronicleCategories.map((category) => sampleCategory(category, 2)),
      sampleCategory('executives', 3),
    ];

    const results = await Promise.all(allPromises);
    const eventChronicleItems = results.slice(0, eventChronicleCategories.length).flat();
    const executiveItems = results[eventChronicleCategories.length];

    const payload = [
      ...eventChronicleItems,
      ...executiveItems,
    ].filter(Boolean);

    res.status(200).json({
      success: true,
      data: payload,
      breakdown: {
        eventChronicleCount: eventChronicleItems.length,
        executiveCount: executiveItems.length,
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
