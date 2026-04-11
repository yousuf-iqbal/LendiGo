// backend/models/ratingModel.js

const { poolPromise, sql } = require('../config/db');

async function createRating(bookingID, reviewerID, revieweeID, rating, comment) {
  const pool = await poolPromise;

  const bookingCheck = await pool.request()
    .input('BookingID', sql.Int, bookingID)
    .query(`
      SELECT b.Status, b.RenterID, b.LenderID, b.AssetID
      FROM   Bookings b
      WHERE  b.BookingID = @BookingID
    `);

  if (!bookingCheck.recordset[0])
    return { error: 'booking not found.', code: 404 };

  const { Status, RenterID, LenderID, AssetID } = bookingCheck.recordset[0];

  if (Status !== 'completed')
    return { error: 'you can only review after a booking is completed.', code: 400 };

  if (reviewerID !== RenterID && reviewerID !== LenderID)
    return { error: 'you are not part of this booking.', code: 403 };

  const expectedReviewee = reviewerID === RenterID ? LenderID : RenterID;
  if (revieweeID !== expectedReviewee)
    return { error: 'invalid reviewee for this booking.', code: 400 };

  try {
    const result = await pool.request()
      .input('BookingID',  sql.Int,      bookingID)
      .input('ReviewerID', sql.Int,      reviewerID)
      .input('RevieweeID', sql.Int,      revieweeID)
      .input('AssetID',    sql.Int,      AssetID || null)
      .input('Rating',     sql.TinyInt,  rating)
      .input('Comment',    sql.NVarChar, comment || null)
      .query(`
        INSERT INTO Reviews (BookingID, ReviewerID, RevieweeID, AssetID, Rating, Comment)
        OUTPUT INSERTED.*
        VALUES (@BookingID, @ReviewerID, @RevieweeID, @AssetID, @Rating, @Comment)
      `);
    return { rating: result.recordset[0] };
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return { error: 'you have already reviewed this booking.', code: 409 };
    throw err;
  }
}

async function getRatingsForUser(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT
        rv.ReviewID,
        rv.Rating,
        rv.Comment,
        rv.CreatedAt,
        u.FullName   AS ReviewerName,
        u.ProfilePic AS ReviewerPic,
        a.Title      AS AssetName
      FROM   Reviews rv
      JOIN   Users  u ON rv.ReviewerID = u.UserID
      LEFT   JOIN Assets a ON rv.AssetID = a.AssetID
      WHERE  rv.RevieweeID = @UserID
      ORDER  BY rv.CreatedAt DESC
    `);
  return result.recordset;
}

async function getUserRatingSummary(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT
        COUNT(*)                   AS TotalReviews,
        AVG(CAST(Rating AS FLOAT)) AS AverageScore
      FROM Reviews
      WHERE RevieweeID = @UserID
    `);
  return result.recordset[0];
}

async function hasUserReviewed(bookingID, reviewerID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('BookingID',  sql.Int, bookingID)
    .input('ReviewerID', sql.Int, reviewerID)
    .query(`
      SELECT ReviewID FROM Reviews
      WHERE BookingID = @BookingID AND ReviewerID = @ReviewerID
    `);
  return !!result.recordset[0];
}

async function getLeaderboard() {
  const pool = await poolPromise;
  const result = await pool.request()
    .query(`
      SELECT TOP 20
        u.UserID,
        u.FullName,
        u.City,
        u.ProfilePic,
        COUNT(DISTINCT b.BookingID)              AS TotalDeals,
        COUNT(DISTINCT rv.ReviewID)              AS TotalReviews,
        ISNULL(AVG(CAST(rv.Rating AS FLOAT)), 0) AS AverageScore
      FROM   Users u
      JOIN   Bookings b  ON b.LenderID    = u.UserID AND b.Status = 'completed'
      LEFT   JOIN Reviews rv ON rv.RevieweeID = u.UserID
      WHERE  u.IsBanned = 0
      GROUP  BY u.UserID, u.FullName, u.City, u.ProfilePic
      ORDER  BY AverageScore DESC, TotalDeals DESC
    `);
  return result.recordset;
}

module.exports = {
  createRating,
  getRatingsForUser,
  getUserRatingSummary,
  hasUserReviewed,
  getLeaderboard,
};