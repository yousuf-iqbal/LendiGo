const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/db');

// GET /api/map/markers — requests, assets, and active offers with coordinates
router.get('/markers', async (req, res) => {
  try {
    const pool = await poolPromise;

    const [requestsResult, assetsResult, offersResult] = await Promise.all([
      pool.request().query(`
        SELECT
          r.RequestID as id,
          r.Title as title,
          r.Area as area,
          r.City as city,
          r.MaxBudget as maxBudget,
          r.Latitude as lat,
          r.Longitude as lng,
          r.CreatedAt as createdAt,
          c.Name as categoryName,
          'request' as markerType
        FROM Requests r
        LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
        WHERE r.Status = 'open'
          AND r.Latitude IS NOT NULL
          AND r.Longitude IS NOT NULL
      `),
      pool.request().query(`
        SELECT
          a.AssetID as id,
          a.Title as title,
          a.Area as area,
          a.City as city,
          a.PricePerDay as pricePerDay,
          a.Latitude as lat,
          a.Longitude as lng,
          a.CreatedAt as createdAt,
          c.Name as categoryName,
          'asset' as markerType
        FROM Assets a
        LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
        WHERE a.IsActive = 1
          AND a.Latitude IS NOT NULL
          AND a.Longitude IS NOT NULL
      `),
      pool.request().query(`
        SELECT
          o.OfferID as id,
          r.Title as title,
          COALESCE(a.Area, r.Area) as area,
          COALESCE(a.City, r.City) as city,
          o.OfferedPrice as offeredPrice,
          COALESCE(a.Latitude, r.Latitude) as lat,
          COALESCE(a.Longitude, r.Longitude) as lng,
          o.CreatedAt as createdAt,
          'offer' as markerType
        FROM Offers o
        INNER JOIN Requests r ON o.RequestID = r.RequestID
        LEFT JOIN Assets a ON o.AssetID = a.AssetID
        WHERE o.Status = 'pending'
          AND COALESCE(a.Latitude, r.Latitude) IS NOT NULL
          AND COALESCE(a.Longitude, r.Longitude) IS NOT NULL
      `),
    ]);

    const markers = [
      ...requestsResult.recordset.map((row) => ({
        ...row,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
      })),
      ...assetsResult.recordset.map((row) => ({
        ...row,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
      })),
      ...offersResult.recordset.map((row) => ({
        ...row,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
      })),
    ];

    res.json(markers);
  } catch (err) {
    console.error('Error fetching map markers:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
