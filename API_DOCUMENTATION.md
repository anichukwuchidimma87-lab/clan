# CLAN Deanery API Documentation - Phase 1

## Base URL
```
https://clan-3slh.onrender.com (Production)
http://localhost:5000 (Development)
```

---

## Public Endpoints (No Authentication Required)

### 1. Get Leadership Profiles
**Endpoint**: `GET /api/public/leadership`

**Description**: Fetches all executives and patrons organized by category.

**Response**:
```json
{
  "success": true,
  "data": {
    "executives": [
      {
        "_id": "user_id",
        "name": "John Smith",
        "position": "President",
        "profileImage": "https://cloudinary.com/...",
        "email": "john@example.com"
      }
    ],
    "patrons": [
      {
        "_id": "user_id",
        "name": "Rev. Michael",
        "position": "Patron",
        "profileImage": "https://cloudinary.com/...",
        "email": "rev@example.com"
      }
    ]
  }
}
```

**Positions Included**:
- Executives: President, Vice President, Secretary, Treasurer, Executive Member
- Patrons: Patron, Patroness

---

### 2. Get Executives Only
**Endpoint**: `GET /api/public/executives`

**Description**: Fetches only executive team members.

**Response**:
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "user_id",
      "name": "Jane Doe",
      "position": "Vice President",
      "profileImage": "https://cloudinary.com/...",
      "email": "jane@example.com"
    }
  ]
}
```

---

### 3. Get Patrons Only
**Endpoint**: `GET /api/public/patrons`

**Description**: Fetches patron and patroness records.

**Response**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "user_id",
      "name": "Most Rev. Archbishop",
      "position": "Patron",
      "profileImage": "https://cloudinary.com/...",
      "email": "archbishop@example.com"
    }
  ]
}
```

---

### 4. Get Recent Events
**Endpoint**: `GET /api/public/recent-events`

**Query Parameters**:
- `limit` (optional): Number of events to return (default: 4)

**Response** (Currently Placeholder):
```json
{
  "success": true,
  "message": "Recent events endpoint - to be populated with Cloudinary integration",
  "limit": 4,
  "data": []
}
```

**Future Implementation**: Will return event images from Cloudinary Events folder.

---

### 5. Get Public Statistics
**Endpoint**: `GET /api/public/stats`

**Description**: Fetches public statistics (total members, parishes, lectors, etc.).

**Response**:
```json
{
  // Response structure depends on lectorController implementation
}
```

---

## Protected Endpoints (Authentication Required)

### 6. Get Pending Users
**Endpoint**: `GET /api/v1/users/pending`

**Authentication**: Required (Bearer Token)

**Authorization**: Admin or Approval Authority only

**Description**: Fetches list of users awaiting approval.

**Response**:
```json
[
  {
    "_id": "user_id",
    "name": "New Member",
    "email": "member@example.com",
    "status": "pending",
    "position": "Member",
    "role": "member"
  }
]
```

---

### 7. Approve User
**Endpoint**: `PATCH /api/v1/users/approve/:id`

**Authentication**: Required (Bearer Token)

**Authorization**: Admin or Approval Authority only

**Request Body**: (No body required)

**Response**:
```json
{
  "message": "User account approved successfully",
  "user": {
    "_id": "user_id",
    "name": "New Member",
    "email": "member@example.com",
    "status": "approved",
    "position": "Member"
  }
}
```

---

### 8. Update User Profile
**Endpoint**: `PATCH /api/v1/users/profile/:userId`

**Authentication**: Required (Bearer Token)

**Authorization**: Admin only

**Content-Type**: `multipart/form-data`

**Request Body**:
```
POST /api/v1/users/profile/user_id HTTP/1.1
Content-Type: multipart/form-data

---Form Fields---
position: "President"
profileTitle: "Spiritual Leader and Guide"
profileImage: <file>
```

**Response**:
```json
{
  "success": true,
  "message": "User profile updated successfully",
  "user": {
    "_id": "user_id",
    "name": "John Smith",
    "email": "john@example.com",
    "position": "President",
    "profileImage": "https://res.cloudinary.com/.../image.jpg",
    "profileTitle": "Spiritual Leader and Guide"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "User is already approved"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Error message describing what went wrong"
}
```

---

## Using These Endpoints in Your Application

### Frontend Example (React)
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Fetch leadership profiles
const fetchLeadership = async () => {
  try {
    const response = await axios.get(`${API_URL}/public/leadership`);
    console.log(response.data.data);
    // { executives: [...], patrons: [...] }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Upload profile image (admin)
const uploadProfile = async (userId, file, position) => {
  const formData = new FormData();
  formData.append('profileImage', file);
  formData.append('position', position);
  
  try {
    const response = await axios.patch(
      `${API_URL}/v1/users/profile/${userId}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    console.log('Profile updated:', response.data.user);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

### Testing with Postman/Insomnia

#### Test Leadership Endpoint
```
GET https://clan-3slh.onrender.com/api/public/leadership
Headers: (none needed)
```

#### Test Profile Upload
```
PATCH https://clan-3slh.onrender.com/api/v1/users/profile/user_id
Headers:
  Authorization: Bearer your_token_here
  Content-Type: multipart/form-data

Body (form-data):
  position: "President"
  profileTitle: "Visionary Leader"
  profileImage: [select your image file]
```

---

## Common Issues & Solutions

### Issue: "User not found" on profile update
**Solution**: Verify the `userId` parameter matches an actual user ID in the database.

### Issue: Profile image not uploading
**Solutions**:
1. Verify Cloudinary credentials are correct in `.env`
2. Check that `Content-Type` is set to `multipart/form-data`
3. Ensure the file size is within limits
4. Verify `multer-storage-cloudinary` is installed

### Issue: Leadership profiles returning empty
**Solutions**:
1. Verify users exist in MongoDB with positions
2. Check that positions exactly match the enum values
3. Use MongoDB Compass to verify user records
4. Query the endpoint directly using curl/Postman

---

## Cloudinary Image Handling

### Image URLs
- Cloudinary returns full URLs that can be used directly in `<img>` tags
- Example: `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/clan-deanery/image.jpg`

### Image Transformations
You can append Cloudinary transformation parameters to URLs:

```javascript
// Original image
const url = "https://res.cloudinary.com/cloud/image/upload/v123/clan-deanery/photo.jpg";

// 300x300 crop with quality optimization
const optimized = url.replace('/upload/', '/upload/c_fill,w_300,h_300,q_auto/');

// Responsive image with max-width
const responsive = url.replace('/upload/', '/upload/w_auto,q_auto/');
```

---

## Future Endpoints (Planned)

### Phase 2
- `GET /api/public/recent-events` - Will return actual event images
- `GET /api/v1/recognitions` - Member awards and achievements
- `GET /api/v1/resources/download/:id` - Secure resource downloads
- `GET /api/v1/reports/export` - Export tools (PDF/Excel)

### Phase 3
- `GET /api/v1/forum/threads` - Discussion board posts
- `GET /api/v1/parishes/:parishId` - Parish micro-site data
- `GET /api/v1/prayers/requests` - Prayer request board
- `POST /api/v1/notifications/email` - Email automation

---

**API Version**: 1.0  
**Last Updated**: June 2026  
**Status**: Phase 1 Complete
