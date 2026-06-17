import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Debug: log presence (not values) of critical Cloudinary env vars to help diagnose
try {
  const hasName = Boolean(process.env.CLOUDINARY_CLOUD_NAME);
  const hasKey = Boolean(process.env.CLOUDINARY_API_KEY);
  const hasSecret = Boolean(process.env.CLOUDINARY_API_SECRET);
  // Masked presence for quick troubleshooting
  console.log('[uploadMiddleware] Cloudinary env ->', {
    cloud_name_present: hasName,
    api_key_present: hasKey,
    api_secret_present: hasSecret,
  });
} catch (e) {
  console.error('[uploadMiddleware] Failed to introspect Cloudinary env vars', e && e.message);
}

// Set up Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: process.env.CLOUDINARY_FOLDER || 'clan-deanery',
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

// Create multer upload middleware
const upload = multer({ storage });

export default upload;
