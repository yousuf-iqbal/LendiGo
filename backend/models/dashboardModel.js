const { poolPromise, sql } = require('../config/db');

// ── BORROWER ─────────────────────────────────────────────────────────────────

async function getBorrowerStats(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        COUNT(*)                                           AS TotalBookings,
        COUNT(CASE WHEN Status = 'completed' THEN 1 END)  AS CompletedBookings,
        COUNT(CASE WHEN Status = 'ongoing'   THEN 1 END)  AS OngoingBookings,
        COUNT(CASE WHEN Status = 'cancelled' THEN 1 END)  AS CancelledBookings,
        ISNULL(SUM(CASE WHEN Status = 'completed' THEN TotalPrice ELSE 0 END), 0) AS TotalSpent
      FROM Bookings
      WHERE RenterID = @UserID
    `);
  return result.recordset[0];
}

async function getBorrowerHistory(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        b.BookingID,
        b.StartDate,
        b.EndDate,
        b.TotalPrice,
        b.Status,
        b.IsPaid,
        b.CreatedAt,
        a.Title        AS AssetTitle,
        a.AssetID,
        a.PricePerDay,
        ul.FullName    AS LenderName,
        ul.UserID      AS LenderID,
        ul.City        AS LenderCity,
        ul.ProfilePic  AS LenderProfilePic,
        c.Name         AS CategoryName,
        (SELECT TOP 1 ImageURL FROM AssetImages ai WHERE ai.AssetID = a.AssetID AND ai.IsPrimary = 1) AS AssetImage
      FROM Bookings b
      JOIN Assets     a  ON b.AssetID   = a.AssetID
      JOIN Users      ul ON b.LenderID  = ul.UserID
      LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
      WHERE b.RenterID = @UserID
      ORDER BY b.CreatedAt DESC
    `);
  return result.recordset;
}

async function getBorrowerReviews(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        r.ReviewID,
        r.Rating,
        r.Comment,
        r.CreatedAt,
        u.FullName    AS ReviewerName,
        u.ProfilePic  AS ReviewerPic,
        a.Title       AS AssetTitle
      FROM Reviews r
      JOIN Users u ON r.ReviewerID = u.UserID
      LEFT JOIN Assets a ON r.AssetID = a.AssetID
      WHERE r.RevieweeID = @UserID
      ORDER BY r.CreatedAt DESC
    `);
  return result.recordset;
}

// ── LENDER ────────────────────────────────────────────────────────────────────

async function getLenderStats(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        COUNT(*)                                           AS TotalBookings,
        COUNT(CASE WHEN Status = 'completed' THEN 1 END)  AS CompletedBookings,
        COUNT(CASE WHEN Status = 'ongoing'   THEN 1 END)  AS OngoingBookings,
        COUNT(CASE WHEN Status = 'cancelled' THEN 1 END)  AS CancelledBookings,
        ISNULL(SUM(CASE WHEN Status = 'completed' THEN TotalPrice ELSE 0 END), 0) AS TotalEarned,
        COUNT(DISTINCT RenterID)                           AS UniqueRenters
      FROM Bookings
      WHERE LenderID = @UserID
    `);
  return result.recordset[0];
}

async function getLenderHistory(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        b.BookingID,
        b.StartDate,
        b.EndDate,
        b.TotalPrice,
        b.Status,
        b.IsPaid,
        b.CreatedAt,
        a.Title        AS AssetTitle,
        a.AssetID,
        a.PricePerDay,
        ur.FullName    AS RenterName,
        ur.UserID      AS RenterID,
        ur.City        AS RenterCity,
        ur.ProfilePic  AS RenterProfilePic,
        c.Name         AS CategoryName,
        (SELECT TOP 1 ImageURL FROM AssetImages ai WHERE ai.AssetID = a.AssetID AND ai.IsPrimary = 1) AS AssetImage
      FROM Bookings b
      JOIN Assets     a  ON b.AssetID   = a.AssetID
      JOIN Users      ur ON b.RenterID  = ur.UserID
      LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
      WHERE b.LenderID = @UserID
      ORDER BY b.CreatedAt DESC
    `);
  return result.recordset;
}

async function getLenderEarningsByAsset(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        a.AssetID,
        a.Title                               AS AssetTitle,
        c.Name                                AS CategoryName,
        COUNT(b.BookingID)                    AS TotalBookings,
        ISNULL(SUM(b.TotalPrice), 0)          AS TotalEarned,
        AVG(CAST(b.TotalPrice AS FLOAT))      AS AvgEarningPerBooking
      FROM Assets a
      LEFT JOIN Bookings b ON b.AssetID = a.AssetID AND b.LenderID = @UserID AND b.Status = 'completed'
      LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
      WHERE a.OwnerID = @UserID
      GROUP BY a.AssetID, a.Title, c.Name
      ORDER BY TotalEarned DESC
    `);
  return result.recordset;
}

async function getLenderReviews(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        r.ReviewID,
        r.Rating,
        r.Comment,
        r.CreatedAt,
        u.FullName    AS ReviewerName,
        u.ProfilePic  AS ReviewerPic,
        a.Title       AS AssetTitle
      FROM Reviews r
      JOIN Users u ON r.ReviewerID = u.UserID
      LEFT JOIN Assets a ON r.AssetID = a.AssetID
      WHERE r.RevieweeID = @UserID
      ORDER BY r.CreatedAt DESC
    `);
  return result.recordset;
}

module.exports = {
  getBorrowerStats,
  getBorrowerHistory,
  getBorrowerReviews,
  getLenderStats,
  getLenderHistory,
  getLenderEarningsByAsset,
  getLenderReviews,
};