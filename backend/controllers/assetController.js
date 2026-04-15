const assetModel = require('../models/assetModel');

async function getAllAssets(req, res) {
    try {
        const assets = await assetModel.getAllAssets();
        res.json({ success: true, count: assets.length, assets });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getAssetById(req, res) {
    try {
        const asset = await assetModel.getAssetById(parseInt(req.params.id));
        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        res.json({ success: true, asset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getAssetsByCategory(req, res) {
    try {
        const assets = await assetModel.getAssetsByCategory(parseInt(req.params.categoryId));
        res.json({ success: true, count: assets.length, assets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function searchAssets(req, res) {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search keyword required' });
        }
        const assets = await assetModel.searchAssets(q);
        res.json({ success: true, count: assets.length, assets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getAllAssets, getAssetById, getAssetsByCategory, searchAssets };
