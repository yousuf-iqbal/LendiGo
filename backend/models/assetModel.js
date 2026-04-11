const { poolPromise, sql } = require('../config/db');

async function getAllAssets({ search, category, city, minPrice, maxPrice } = {}) {
  const pool = await poolPromise;
  const request = pool.request();

  let query = `
    SELECT
      a.AssetID, a.Title, a.Description, a.PricePerDay, a.Deposit,
      a.City, a.Area, a.IsActive, a.CreatedAt,
      a.OwnerID,
      u.FullName AS OwnerName,
      c.Name AS CategoryName, c.CategoryID,
      (SELECT TOP 1 ImageURL FROM AssetImages WHERE AssetID = a.AssetID AND IsPrimary = 1) AS PrimaryImage,
      COALESCE((SELECT AVG(CAST(Rating AS FLOAT)) FROM Reviews WHERE RevieweeID = a.OwnerID), 0) AS OwnerRating
    FROM Assets a
    JOIN Users u ON a.OwnerID = u.UserID
    LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
    WHERE a.IsActive = 1
  `;

  if (search) {
    query += ` AND (a.Title LIKE @search OR a.Description LIKE @search)`;
    request.input('search', sql.NVarChar, `%${search}%`);
  }
  if (category) {
    query += ` AND c.Name = @category`;
    request.input('category', sql.NVarChar, category);
  }
  if (city) {
    query += ` AND a.City LIKE @city`;
    request.input('city', sql.NVarChar, `%${city}%`);
  }
  if (minPrice) {
    query += ` AND a.PricePerDay >= @minPrice`;
    request.input('minPrice', sql.Decimal, parseFloat(minPrice));
  }
  if (maxPrice) {
    query += ` AND a.PricePerDay <= @maxPrice`;
    request.input('maxPrice', sql.Decimal, parseFloat(maxPrice));
  }

  query += ` ORDER BY a.CreatedAt DESC`;
  const result = await request.query(query);
  return result.recordset;
}

async function getAssetById(assetID) {
  const pool = await poolPromise;
  const [assetRes, imagesRes] = await Promise.all([
    pool.request()
      .input('assetID', sql.Int, assetID)
      .query(`
        SELECT
          a.AssetID, a.Title, a.Description, a.PricePerDay, a.Deposit,
          a.City, a.Area, a.IsActive, a.CreatedAt, a.OwnerID,
          u.FullName AS OwnerName, u.ProfilePic AS OwnerPic,
          c.Name AS CategoryName, c.CategoryID,
          COALESCE((SELECT AVG(CAST(Rating AS FLOAT)) FROM Reviews WHERE RevieweeID = a.OwnerID), 0) AS OwnerRating,
          (SELECT COUNT(*) FROM Reviews WHERE RevieweeID = a.OwnerID) AS ReviewCount
        FROM Assets a
        JOIN Users u ON a.OwnerID = u.UserID
        LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
        WHERE a.AssetID = @assetID
      `),
    pool.request()
      .input('assetID', sql.Int, assetID)
      .query(`SELECT ImageID, ImageURL, IsPrimary FROM AssetImages WHERE AssetID = @assetID ORDER BY IsPrimary DESC`),
  ]);
  const asset = assetRes.recordset[0];
  if (!asset) return null;
  asset.Images = imagesRes.recordset;
  return asset;
}

async function getAssetsByOwner(ownerID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('ownerID', sql.Int, ownerID)
    .query(`
      SELECT
        a.AssetID, a.Title, a.PricePerDay, a.Deposit,
        a.City, a.Area, a.IsActive, a.CreatedAt,
        c.Name AS CategoryName,
        (SELECT TOP 1 ImageURL FROM AssetImages WHERE AssetID = a.AssetID AND IsPrimary = 1) AS PrimaryImage
      FROM Assets a
      LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
      WHERE a.OwnerID = @ownerID
      ORDER BY a.CreatedAt DESC
    `);
  return result.recordset;
}

async function createAsset({ ownerID, categoryID, title, description, pricePerDay, deposit, city, area }) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('ownerID', sql.Int, ownerID)
    .input('categoryID', sql.Int, categoryID || null)
    .input('title', sql.NVarChar, title)
    .input('description', sql.NVarChar, description || null)
    .input('pricePerDay', sql.Decimal, parseFloat(pricePerDay))
    .input('deposit', sql.Decimal, parseFloat(deposit || 0))
    .input('city', sql.NVarChar, city)
    .input('area', sql.NVarChar, area || null)
    .query(`
      INSERT INTO Assets (OwnerID, CategoryID, Title, Description, PricePerDay, Deposit, City, Area, IsActive, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@ownerID, @categoryID, @title, @description, @pricePerDay, @deposit, @city, @area, 1, GETDATE())
    `);
  return result.recordset[0];
}

async function addAssetImages(assetID, images) {
  const pool = await poolPromise;
  for (let i = 0; i < images.length; i++) {
    await pool.request()
      .input('assetID', sql.Int, assetID)
      .input('imageURL', sql.NVarChar, images[i])
      .input('isPrimary', sql.Bit, i === 0 ? 1 : 0)
      .query(`INSERT INTO AssetImages (AssetID, ImageURL, IsPrimary) VALUES (@assetID, @imageURL, @isPrimary)`);
  }
}

async function updateAsset(assetID, ownerID, { categoryID, title, description, pricePerDay, deposit, city, area, isActive }) {
  const pool = await poolPromise;
  const check = await pool.request()
    .input('assetID', sql.Int, assetID)
    .input('ownerID', sql.Int, ownerID)
    .query(`SELECT AssetID FROM Assets WHERE AssetID = @assetID AND OwnerID = @ownerID`);
  if (!check.recordset[0]) return { error: 'not found or not your asset', status: 403 };

  const result = await pool.request()
    .input('assetID', sql.Int, assetID)
    .input('categoryID', sql.Int, categoryID || null)
    .input('title', sql.NVarChar, title)
    .input('description', sql.NVarChar, description || null)
    .input('pricePerDay', sql.Decimal, parseFloat(pricePerDay))
    .input('deposit', sql.Decimal, parseFloat(deposit || 0))
    .input('city', sql.NVarChar, city)
    .input('area', sql.NVarChar, area || null)
    .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
    .query(`
      UPDATE Assets
      SET CategoryID=@categoryID, Title=@title, Description=@description,
          PricePerDay=@pricePerDay, Deposit=@deposit, City=@city, Area=@area, IsActive=@isActive
      OUTPUT INSERTED.*
      WHERE AssetID = @assetID
    `);
  return result.recordset[0];
}

async function deleteAsset(assetID, ownerID) {
  const pool = await poolPromise;
  const check = await pool.request()
    .input('assetID', sql.Int, assetID)
    .input('ownerID', sql.Int, ownerID)
    .query(`SELECT AssetID FROM Assets WHERE AssetID = @assetID AND OwnerID = @ownerID`);
  if (!check.recordset[0]) return { error: 'not found or not your asset', status: 403 };

  await pool.request()
    .input('assetID', sql.Int, assetID)
    .query(`DELETE FROM Assets WHERE AssetID = @assetID`);
  return { success: true };
}

async function getBlockedDates(assetID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('assetID', sql.Int, assetID)
    .query(`SELECT BlockedDate FROM Availability WHERE AssetID = @assetID ORDER BY BlockedDate`);
  return result.recordset.map(r => r.BlockedDate);
}

async function blockDates(assetID, dates) {
  const pool = await poolPromise;
  for (const date of dates) {
    try {
      await pool.request()
        .input('assetID', sql.Int, assetID)
        .input('date', sql.Date, date)
        .query(`INSERT INTO Availability (AssetID, BlockedDate) VALUES (@assetID, @date)`);
    } catch (e) {
      // ignore duplicate key errors (date already blocked)
    }
  }
}

module.exports = {
  getAllAssets, getAssetById, getAssetsByOwner,
  createAsset, addAssetImages, updateAsset, deleteAsset,
  getBlockedDates, blockDates,
};
