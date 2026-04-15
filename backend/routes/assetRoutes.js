const express = require('express');
const router = express.Router();
const { getAllAssets, getAssetById, getAssetsByCategory, searchAssets } = require('../controllers/assetController');

router.get('/', getAllAssets);
router.get('/search', searchAssets);
router.get('/category/:categoryId', getAssetsByCategory);
router.get('/:id', getAssetById);

module.exports = router;
