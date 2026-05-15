const express = require('express');
const { poolPromise, sql } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/asset/:assetId', async (req, res) => {
  try {
    const assetId = parseInt(req.params.assetId, 10);
    if (!Number.isFinite(assetId)) return res.status(400).json({ error: 'Invalid asset ID' });

    const pool = await poolPromise;
    const result = await pool.request()
      .input('AssetID', sql.Int, assetId)
      .query(`
        SELECT
          r.ReviewID, r.BookingID, r.Rating, r.Comment, r.CreatedAt,
          reviewer.UserID AS ReviewerID,
          reviewer.FullName AS ReviewerName,
          reviewer.ProfilePic AS ReviewerPic
        FROM Reviews r
        JOIN Users reviewer ON reviewer.UserID = r.ReviewerID
        WHERE r.AssetID = @AssetID
        ORDER BY r.CreatedAt DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching asset reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!Number.isFinite(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const pool = await poolPromise;
    const [reviews, stats] = await Promise.all([
      pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
          SELECT
            r.ReviewID, r.BookingID, r.AssetID, r.Rating, r.Comment, r.CreatedAt,
            reviewer.FullName AS ReviewerName,
            reviewer.ProfilePic AS ReviewerPic,
            a.Title AS AssetTitle
          FROM Reviews r
          JOIN Users reviewer ON reviewer.UserID = r.ReviewerID
          LEFT JOIN Assets a ON a.AssetID = r.AssetID
          WHERE r.RevieweeID = @UserID
          ORDER BY r.CreatedAt DESC
        `),
      pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
          SELECT
            COALESCE(AVG(CAST(Rating AS FLOAT)), 0) AS AverageRating,
            COUNT(*) AS ReviewCount
          FROM Reviews
          WHERE RevieweeID = @UserID
        `),
    ]);

    res.json({
      stats: stats.recordset[0],
      reviews: reviews.recordset,
    });
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, req.userID)
      .query(`
        SELECT
          r.ReviewID, r.BookingID, r.AssetID, r.Rating, r.Comment, r.CreatedAt,
          reviewer.FullName AS ReviewerName,
          a.Title AS AssetTitle
        FROM Reviews r
        JOIN Users reviewer ON reviewer.UserID = r.ReviewerID
        LEFT JOIN Assets a ON a.AssetID = r.AssetID
        WHERE r.RevieweeID = @UserID
        ORDER BY r.CreatedAt DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching my reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { bookingID, rating, comment } = req.body;
    const bookingId = parseInt(bookingID, 10);
    const numericRating = parseInt(rating, 10);

    if (!Number.isFinite(bookingId)) return res.status(400).json({ error: 'Valid bookingID is required' });
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const pool = await poolPromise;
    const bookingResult = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT BookingID, AssetID, RenterID, LenderID, Status
        FROM Bookings
        WHERE BookingID = @BookingID
      `);

    const booking = bookingResult.recordset[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (String(booking.Status).toLowerCase() !== 'completed') {
      return res.status(400).json({ error: 'Reviews are available after a booking is completed' });
    }

    const isRenter = Number(booking.RenterID) === Number(req.userID);
    const isLender = Number(booking.LenderID) === Number(req.userID);
    if (!isRenter && !isLender) {
      return res.status(403).json({ error: 'You can only review your own bookings' });
    }

    const revieweeID = isRenter ? booking.LenderID : booking.RenterID;

    const duplicate = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .input('ReviewerID', sql.Int, req.userID)
      .query('SELECT ReviewID FROM Reviews WHERE BookingID = @BookingID AND ReviewerID = @ReviewerID');

    if (duplicate.recordset.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this booking' });
    }

    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .input('ReviewerID', sql.Int, req.userID)
      .input('RevieweeID', sql.Int, revieweeID)
      .input('AssetID', sql.Int, booking.AssetID || null)
      .input('Rating', sql.TinyInt, numericRating)
      .input('Comment', sql.NVarChar, comment?.trim() || null)
      .query(`
        INSERT INTO Reviews (BookingID, ReviewerID, RevieweeID, AssetID, Rating, Comment)
        OUTPUT INSERTED.*
        VALUES (@BookingID, @ReviewerID, @RevieweeID, @AssetID, @Rating, @Comment)
      `);

    res.status(201).json({ message: 'Review submitted', review: result.recordset[0] });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
