# Phase 1 Implementation: Public Landing Page & Cloudinary Integration

## Overview
This document outlines the Phase 1 implementation of the CLAN Deanery website, focusing on building a public-facing landing page and integrating Cloudinary for image management.

## Phase 1 Components Implemented

### 1. Backend Infrastructure

#### 1.1 Cloudinary Integration
- **File**: `backend/src/middleware/uploadMiddleware.js`
- **Purpose**: Handles file uploads to Cloudinary using multer
- **Configuration**: Uses environment variables for secure API credentials
- **Features**:
  - Automatic file upload to Cloudinary
  - Organized folder structure (`clan-deanery`)
  - Support for multiple file types

#### 1.2 Public API Endpoints
- **File**: `backend/src/routes/publicRoutes.js`
- **New Endpoints**:
  - `GET /api/public/executives` - Fetch executive team members
  - `GET /api/public/patrons` - Fetch patron and patroness
  - `GET /api/public/leadership` - Fetch complete leadership profiles organized by category
  - `GET /api/public/recent-events` - Fetch recent event images (ready for expansion)
  - `GET /api/public/stats` - Public statistics (existing endpoint)

#### 1.3 Public Controller
- **File**: `backend/src/controllers/publicController.js`
- **Functions**:
  - `getExecutives()` - Returns filtered executives
  - `getPatrons()` - Returns patron/patroness records
  - `getLeadershipProfiles()` - Organized leadership data
  - `getRecentEvents()` - Placeholder for events slider

#### 1.4 User Model Updates
- **File**: `backend/src/models/User.js`
- **New Fields**:
  - `profileImage` (String) - Cloudinary URL for leadership photos
  - `profileTitle` (String) - Professional title/tagline

#### 1.5 User Profile Update Endpoint
- **File**: `backend/src/controllers/userController.js`
- **New Function**: `updateUserProfile()`
- **Route**: `PATCH /api/v1/users/profile/:userId`
- **Features**:
  - Update position, profile title, and profile image
  - Integrates with Cloudinary upload middleware
  - Admin-only access

### 2. Frontend Components

#### 2.1 Landing Page
- **File**: `frontend/src/pages/Landing.jsx`
- **Sections**:
  - Navigation bar with Login/Register buttons
  - Hero section with mission statement
  - Leadership showcase section
  - Recent impact slider
  - Call-to-action section
  - Footer

#### 2.2 Public Components
Located in `frontend/src/components/public/`

##### HeroSection.jsx
- Beautiful welcome banner
- Gradient background with image overlay
- Displays Deanery mission statement
- Responsive design

##### LeadershipShowcase.jsx
- Fetches leadership profiles from `/api/public/leadership`
- Grid-based card layout (responsive)
- Separates executives and patrons
- Displays profile images, names, positions
- Includes contact links
- Fallback avatars with initials if no image

##### RecentEventsSlider.jsx
- Carousel slider for event images
- Auto-advance functionality (5-second intervals)
- Manual navigation controls
- Thumbnail preview strips
- Placeholder state for future content
- Responsive design

### 3. Configuration

#### Environment Variables (Backend)
Add these to your `.env` file in the backend directory:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=clan-deanery
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

#### Frontend Configuration
The frontend is already configured with:
- `VITE_API_URL=https://clan-3slh.onrender.com`
- All components use this URL for API calls

## Setup Instructions

### Step 1: Install Dependencies (Backend)
```bash
cd backend
npm install cloudinary multer
```

### Step 2: Configure Cloudinary
1. Create a Cloudinary account at https://cloudinary.com
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add these credentials to your `.env` file

### Step 3: Update Database Records
To populate the leadership showcase, update user records with positions:
- Valid positions: `President`, `Vice President`, `Secretary`, `Treasurer`, `Executive Member`, `Patron`, `Patroness`
- Users with these positions will automatically appear on the landing page

### Step 4: Test the Implementation
1. Start your backend server: `npm run dev`
2. Start your frontend: `npm run dev`
3. Visit `http://localhost:5173` (or your frontend port)
4. You should see the landing page with leadership profiles

## File Structure Summary
```
backend/
├── src/
│   ├── middleware/
│   │   └── uploadMiddleware.js (NEW)
│   ├── controllers/
│   │   ├── publicController.js (NEW)
│   │   └── userController.js (UPDATED)
│   ├── models/
│   │   └── User.js (UPDATED - profileImage, profileTitle)
│   └── routes/
│       └── publicRoutes.js (UPDATED)
└── .env.example (NEW)

frontend/
├── src/
│   ├── pages/
│   │   └── Landing.jsx (NEW)
│   ├── components/
│   │   └── public/ (NEW DIRECTORY)
│   │       ├── HeroSection.jsx
│   │       ├── LeadershipShowcase.jsx
│   │       └── RecentEventsSlider.jsx
│   └── App.jsx (UPDATED - routing)
```

## Next Steps for Phase 2

### Phase 2 (Growth Features)
1. **Member Recognition Page**
   - "Lector of the Month" awards
   - Distinguished service recognition
   - Create a dedicated page and API endpoint

2. **Download Center**
   - Secure PDF uploads (Constitution, Calendars, Handbooks)
   - Member-only access
   - Category organization

3. **PDF/Excel Export Tools**
   - Export registry data
   - Export financial ledger
   - Generate meeting reports
   - Use backend utilities for formatting

## API Usage Examples

### Fetch Leadership Profiles
```javascript
const response = await axios.get(`${API_URL}/public/leadership`);
// Response structure:
// {
//   success: true,
//   data: {
//     executives: [...],
//     patrons: [...]
//   }
// }
```

### Upload Profile Image (Admin Only)
```javascript
const formData = new FormData();
formData.append('profileImage', imageFile);
formData.append('position', 'President');
formData.append('profileTitle', 'Spiritual Leader');

await axios.patch(
  `${API_URL}/v1/users/profile/${userId}`,
  formData,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);
```

## Troubleshooting

### Images not loading?
1. Verify Cloudinary credentials in `.env`
2. Check that Cloudinary folder path is correct
3. Ensure multer-storage-cloudinary is installed: `npm install multer-storage-cloudinary`

### Leadership profiles showing as empty?
1. Verify users exist in the database with valid positions
2. Check that positions match the enum values in publicController.js
3. Test the `/api/public/leadership` endpoint directly using Postman/Insomnia

### CORS errors?
1. Backend already has CORS configured
2. Verify VITE_API_URL in frontend matches your backend URL
3. Check that backend is running on the correct port

## Security Notes
- Public endpoints (like `/public/leadership`) require no authentication ✓
- Profile update endpoint requires admin authentication ✓
- Cloudinary credentials are kept in environment variables (not in code) ✓
- File uploads are validated through multer configuration ✓

---

**Version**: 1.0 (Phase 1 Complete)  
**Last Updated**: June 2026
