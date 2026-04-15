const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary }        = require('../config/cloudinary');
const verifyToken = require('../middleware/verifyToken');
const {
  getMyProfile,
  getPublicProfile,
  updateProfile,
  uploadAvatar,
} = require('../controllers/profileController');

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'udhaari/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});
const upload = multer({ storage: avatarStorage });

// Own profile (auth required)
router.get('/me',               verifyToken,            getMyProfile);
router.put('/',                 verifyToken,            updateProfile);
router.post('/avatar',          verifyToken, upload.single('profilePic'), uploadAvatar);

// Public profile (no auth needed)
router.get('/:userID',          getPublicProfile);

module.exports = router;