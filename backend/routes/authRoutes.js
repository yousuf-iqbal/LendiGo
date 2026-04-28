// routes/authRoutes.js
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const { register, login, googleAuth, checkProvider, checkUserStatus} = require('../controllers/authController');

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

// POST /api/auth/register — save profile after firebase signup
router.post('/register',
  upload.fields([
    { name: 'profilePic',  maxCount: 1 },
    { name: 'cnicPicture', maxCount: 1 },
  ]),
  register
);

// POST /api/auth/login — verify firebase token, return user profile
router.post('/login', login);

// POST /api/auth/google — handle Google sign-in
router.post('/google', googleAuth);

// POST /api/auth/check-provider — check if user signed up with Google or email
router.post('/check-provider', checkProvider);
router.post('/check-user-status', checkUserStatus);

module.exports = router;