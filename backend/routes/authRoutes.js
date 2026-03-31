// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const { register, login } = require('../controllers/authController');
const { poolPromise, sql } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// Cloudinary storage
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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // For now, return a mock user
    // In production, verify token with Firebase Admin
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

// GET /api/auth/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userID', sql.Int, req.userID)
      .query('SELECT UserID, FullName, Email, Phone, City, Area, CNIC, ProfilePic FROM Users WHERE UserID = @userID');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, phone, city, area, cnic, profilePic } = req.body;
    const pool = await poolPromise;
    
    await pool.request()
      .input('userID', sql.Int, req.userID)
      .input('fullName', sql.NVarChar, fullName)
      .input('phone', sql.NVarChar, phone)
      .input('city', sql.NVarChar, city)
      .input('area', sql.NVarChar, area || null)
      .input('cnic', sql.NVarChar, cnic)
      .input('profilePic', sql.NVarChar, profilePic || null)
      .query(`
        UPDATE Users 
        SET FullName = @fullName, 
            Phone = @phone, 
            City = @city, 
            Area = @area, 
            CNIC = @cnic,
            ProfilePic = ISNULL(@profilePic, ProfilePic)
        WHERE UserID = @userID
      `);
    
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/upload-profile-pic
router.post('/upload-profile-pic', verifyToken, upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ profilePicUrl: req.file.path });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/auth/upload-cnic
router.post('/upload-cnic', verifyToken, upload.single('cnicPicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ cnicPictureUrl: req.file.path });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});
// POST /api/auth/upload-profile-pic
router.post('/upload-profile-pic', verifyToken, upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ profilePicUrl: req.file.path });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});
// GET /api/auth/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userID', sql.Int, req.userID)
      .query('SELECT UserID, FullName, Email, Phone, City, Area, CNIC, ProfilePic FROM Users WHERE UserID = @userID');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, phone, city, area, cnic, profilePic } = req.body;
    const pool = await poolPromise;
    
    await pool.request()
      .input('userID', sql.Int, req.userID)
      .input('fullName', sql.NVarChar, fullName)
      .input('phone', sql.NVarChar, phone)
      .input('city', sql.NVarChar, city)
      .input('area', sql.NVarChar, area || null)
      .input('cnic', sql.NVarChar, cnic)
      .input('profilePic', sql.NVarChar, profilePic || null)
      .query(`
        UPDATE Users 
        SET FullName = @fullName, 
            Phone = @phone, 
            City = @city, 
            Area = @area, 
            CNIC = @cnic,
            ProfilePic = ISNULL(@profilePic, ProfilePic)
        WHERE UserID = @userID
      `);
    
    // Get updated user
    const updated = await pool.request()
      .input('userID', sql.Int, req.userID)
      .query('SELECT UserID, FullName, Email, Phone, City, Area, CNIC, ProfilePic FROM Users WHERE UserID = @userID');
    
    res.json({ message: 'Profile updated successfully', user: updated.recordset[0] });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;