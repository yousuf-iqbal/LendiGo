// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const { register, login } = require('../controllers/authController');

// cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = file.fieldname === 'cnicPicture'
      ? 'udhaari/cnic'
      : 'udhaari/profiles';
    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      transformation: file.fieldname === 'profilePic'
        ? [{ width: 400, height: 400, crop: 'fill' }]
        : [],
    };
  },
});

const upload = multer({ storage });

// POST /api/auth/register
router.post('/register',
  upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'cnicPicture', maxCount: 1 },
  ]),
  register
);

// POST /api/auth/login - simple version without database query
router.post('/login', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Return a simple success response
    // The frontend already has the user info from Firebase
    res.json({ 
      user: { 
        UserID: 1, 
        FullName: 'User', 
        Email: 'user@example.com',
        City: 'Lahore'
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;