const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const assetController = require('../controllers/assetController');
const verifyToken = require('../middleware/verifyToken');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'udhaari/assets',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'fill' }],
  }),
});
const upload = multer({ storage });

router.get('/', assetController.getAllAssets);
router.get('/filters', assetController.getFilterOptions);
router.get('/my', verifyToken, assetController.getMyAssets);
router.get('/:id', assetController.getAssetById);
router.post('/', verifyToken, upload.array('images', 5), assetController.createAsset);
router.put('/:id', verifyToken, assetController.updateAsset);
router.delete('/:id', verifyToken, assetController.deleteAsset);

module.exports = router;
