const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const verifyToken = require('../middleware/verifyToken');
const {
  getMe,
  updateMe,
  uploadAvatar,
  getPublicProfile,
} = require('../controllers/profileController');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'udhaari/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
});

router.get('/me', verifyToken, getMe);
router.put('/', verifyToken, updateMe);
router.post('/avatar', verifyToken, upload.single('profilePic'), uploadAvatar);
router.get('/:userId', getPublicProfile);

module.exports = router;
