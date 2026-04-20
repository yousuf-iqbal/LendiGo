const assetModel = require('../models/assetModel');
const { poolPromise, sql } = require('../config/db');

async function getAllAssets(req, res) {
  try {
    const { search, category, city, minPrice, maxPrice } = req.query;
    const assets = await assetModel.getAllAssets({ search, category, city, minPrice, maxPrice });
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

async function getAssetById(req, res) {
  try {
    const asset = await assetModel.getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'asset not found' });
    const blockedDates = await assetModel.getBlockedDates(req.params.id);
    asset.BlockedDates = blockedDates;
    res.json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

async function getMyAssets(req, res) {
  try {
    const assets = await assetModel.getAssetsByOwner(req.userID);
    res.json(assets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

async function createAsset(req, res) {
  try {
    const { categoryID, title, description, pricePerDay, deposit, city, area } = req.body;
    if (!title || !pricePerDay || !city) {
      return res.status(400).json({ error: 'title, pricePerDay, and city are required' });
    }
    const asset = await assetModel.createAsset({
      ownerID: req.userID,
      categoryID, title, description, pricePerDay, deposit, city, area,
    });

    // handle uploaded images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(f => imageUrls.push(f.path));
    }
    if (imageUrls.length > 0) {
      await assetModel.addAssetImages(asset.AssetID, imageUrls);
    }

    res.status(201).json({ asset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error: ' + err.message });
  }
}

async function updateAsset(req, res) {
  try {
    const { categoryID, title, description, pricePerDay, deposit, city, area, isActive } = req.body;
    const result = await assetModel.updateAsset(
      req.params.id, req.userID,
      { categoryID, title, description, pricePerDay, deposit, city, area, isActive }
    );
    if (result?.error) return res.status(result.status).json({ error: result.error });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

async function deleteAsset(req, res) {
  try {
    const result = await assetModel.deleteAsset(req.params.id, req.userID);
    if (result?.error) return res.status(result.status).json({ error: result.error });
    res.json({ message: 'asset deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

async function getFilterOptions(req, res) {
  try {
    const pool = await poolPromise();
    const [cats, cities] = await Promise.all([
      pool.request().query(`SELECT DISTINCT c.CategoryID, c.Name FROM Categories c JOIN Assets a ON a.CategoryID = c.CategoryID WHERE a.IsActive = 1 ORDER BY c.Name`),
      pool.request().query(`SELECT DISTINCT City FROM Assets WHERE City IS NOT NULL AND IsActive = 1 ORDER BY City`),
    ]);
    res.json({
      categories: cats.recordset.map(r => ({ id: r.CategoryID, name: r.Name })),
      cities: cities.recordset.map(r => r.City),
    });
  } catch (err) {
    res.status(500).json({ error: 'could not fetch filters' });
  }
}

module.exports = { getAllAssets, getAssetById, getMyAssets, createAsset, updateAsset, deleteAsset, getFilterOptions };
