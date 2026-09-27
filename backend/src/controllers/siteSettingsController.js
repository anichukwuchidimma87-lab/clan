import SiteSettings from '../models/SiteSettings.js';
import axios from 'axios';

// Return public settings (create default doc if missing)
export const getPublicSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    console.error('[siteSettings] getPublicSettings error:', err && err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Upload handled by multer/cloudinary; req.file.path contains uploaded URL
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const uploadedUrl = req.file.path;

    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});

    settings.logoUrl = uploadedUrl;
    settings.logoSource = 'uploaded';
    settings.updatedBy = req.user ? req.user._id : undefined;
    await settings.save();

    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    console.error('[siteSettings] uploadLogo error:', err && err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Accept an external URL. Optionally fetch and re-upload to Cloudinary in future.
export const setLogoUrl = async (req, res) => {
  try {
    const { logoUrl } = req.body;
    if (!logoUrl) return res.status(400).json({ success: false, message: 'logoUrl is required.' });

    // Quick validation: ensure it's a URL
    try { new URL(logoUrl); } catch (e) { return res.status(400).json({ success: false, message: 'Invalid URL.' }); }

    // Optionally: attempt a HEAD request to verify image exists (non-blocking failure)
    try {
      await axios.head(logoUrl, { timeout: 5000 });
    } catch (e) {
      // Don't fail; just log
      console.warn('[siteSettings] remote URL HEAD failed:', e && e.message);
    }

    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});

    settings.logoUrl = logoUrl;
    settings.logoSource = 'external';
    settings.updatedBy = req.user ? req.user._id : undefined;
    await settings.save();

    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    console.error('[siteSettings] setLogoUrl error:', err && err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
