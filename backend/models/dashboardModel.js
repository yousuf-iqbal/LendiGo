const { poolPromise, sql } = require('../config/db');

// ── BORROWER ─────────────────────────────────────────────────────────────────
async function getBorrowerStats(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT 
        COUNT(*) AS TotalBookings,
        COUNT(CASE WHEN Status = 'completed' THEN 1 END) AS CompletedBookings,
        COUNT(CASE WHEN Status = 'ongoing'   THEN 1 END) AS OngoingBookings,
        COUNT(CASE WHEN Status = 'cancelled' THEN 1 END) AS CancelledBookings,
        ISNULL(SUM(CASE WHEN Status = 'completed' THEN TotalPrice ELSE 0 END), 0) AS TotalSpent
      FROM Bookings
      WHERE RenterID = @UserID
    `);
  return result.recordset[0];
}

async function getBorrowerHistory(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT 
        b.BookingID, b.StartDate, b.EndDate, b.TotalPrice, b.Status, b.IsPaid, b.CreatedAt,
        a.Title AS AssetTitle, a.AssetID, a.PricePerDay,
        ul.FullName AS LenderName, ul.UserID AS LenderID, ul.City AS LenderCity, ul.ProfilePic AS LenderProfilePic,
        c.Name AS CategoryName,
        (SELECT TOP 1 ImageURL FROM AssetImages ai WHERE ai.AssetID = a.AssetID AND ai.IsPrimary = 1) AS AssetImage
      FROM Bookings b
      JOIN Assets a  ON b.AssetID  = a.AssetID
      JOIN Users ul  ON b.LenderID = ul.UserID
      LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
      WHERE b.RenterID = @UserID
      ORDER BY b.CreatedAt DESC
    `);
  return result.recordset;
}

async function getBorrowerReviews(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT 
        r.ReviewID, r.Rating, r.Comment, r.CreatedAt,
        u.FullName AS ReviewerName, u.ProfilePic AS ReviewerPic,
        a.Title AS AssetTitle
      FROM Reviews r
      JOIN Users u       ON r.ReviewerID = u.UserID
      LEFT JOIN Assets a ON r.AssetID    = a.AssetID
      WHERE r.RevieweeID = @UserID
      ORDER BY r.CreatedAt DESC
    `);
  return result.recordset;
}

// ── LENDER ────────────────────────────────────────────────────────────────────
async function getLenderStats(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT 
        COUNT(*) AS TotalBookings,
        COUNT(CASE WHEN Status = 'completed' THEN 1 END) AS CompletedBookings,
        COUNT(CASE WHEN Status = 'ongoing'   THEN 1 END) AS OngoingBookings,
        COUNT(CASE WHEN Status = 'cancelled' THEN 1 END) AS CancelledBookings,
        ISNULL(SUM(CASE WHEN Status = 'completed' THEN TotalPrice ELSE 0 END), 0) AS TotalEarned,
        COUNT(DISTINCT RenterID) AS UniqueRenters
      FROM Bookings
      WHERE LenderID = @UserID
    `);
  return result.recordset[0];
}

async function getLenderHistory(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT 
        b.BookingID, b.StartDate, b.EndDate, b.TotalPrice, b.Status, b.IsPaid, b.CreatedAt,
        a.Title AS AssetTitle, a.AssetID, a.PricePerDay,
        ur.FullName AS RenterName, ur.UserID AS RenterID, ur.City AS RenterCity, ur.ProfilePic AS RenterProfilePic,
        c.Name AS CategoryName,
        (SELECT TOP 1 ImageURL FROM AssetImages ai WHERE ai.AssetID = a.AssetID AND ai.IsPrimary = 1) AS AssetImage
      FROM Bookings b
      JOIN Assets a  ON b.AssetID  = a.AssetID
      JOIN Users ur  ON b.RenterID = ur.UserID
      LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
      WHERE b.LenderID = @UserID
      ORDER BY b.CreatedAt DESC
    `);
  return result.recordset;
}

async function getLenderEarningsByAsset(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT 
        a.AssetID, 
        a.Title AS AssetTitle, 
        a.IsActive,
        c.Name AS CategoryName,
        COUNT(b.BookingID) AS TotalBookings,
        ISNULL(SUM(b.TotalPrice), 0) AS TotalEarned,
        AVG(CAST(b.TotalPrice AS FLOAT)) AS AvgEarningPerBooking
      FROM Assets a
      LEFT JOIN Bookings b    ON b.AssetID  = a.AssetID AND b.LenderID = @UserID AND b.Status = 'completed'
      LEFT JOIN Categories c  ON a.CategoryID = c.CategoryID
      WHERE a.OwnerID = @UserID
      GROUP BY a.AssetID, a.Title, a.IsActive, c.Name
      ORDER BY TotalEarned DESC
    `);
  return result.recordset;
}

async function getLenderReviews(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT 
        r.ReviewID, r.Rating, r.Comment, r.CreatedAt,
        u.FullName AS ReviewerName, u.ProfilePic AS ReviewerPic,
        a.Title AS AssetTitle
      FROM Reviews r
      JOIN Users u       ON r.ReviewerID = u.UserID
      LEFT JOIN Assets a ON r.AssetID    = a.AssetID
      WHERE r.RevieweeID = @UserID
      ORDER BY r.CreatedAt DESC
    `);
  return result.recordset;
}

// ── COMPREHENSIVE STATS ───────────────────────────────────────────────────────
async function getComprehensiveStats(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT
        -- Assets owned
        (SELECT COUNT(*) FROM Assets WHERE OwnerID = @UserID) AS TotalAssets,
        
        -- Bookings as lender pending approval
        (SELECT COUNT(*) FROM Bookings WHERE LenderID = @UserID AND Status = 'pending') AS PendingBookings,
        
        -- Requests as requester still open
        (SELECT COUNT(*) FROM Requests WHERE RequesterID = @UserID AND Status = 'open') AS ActiveRequests,
        
        -- Offers made as lender still pending
        (SELECT COUNT(*) FROM Offers WHERE LenderID = @UserID AND Status = 'pending') AS PendingOffers,
        
        -- Completed bookings (either side)
        (SELECT COUNT(*) FROM Bookings 
         WHERE (LenderID = @UserID OR RenterID = @UserID) AND Status = 'completed') AS CompletedBookings,
        
        -- Wallet balance
        (SELECT ISNULL(Balance, 0) FROM Wallets WHERE UserID = @UserID) AS WalletBalance,
        
        -- Total earned as lender (completed)
        (SELECT ISNULL(SUM(TotalPrice), 0) FROM Bookings 
         WHERE LenderID = @UserID AND Status = 'completed') AS TotalEarned,
        
        -- Total spent as renter (completed)
        (SELECT ISNULL(SUM(TotalPrice), 0) FROM Bookings 
         WHERE RenterID = @UserID AND Status = 'completed') AS TotalSpent
    `);
  return result.recordset[0];
}

// ── RECENT ACTIVITY ───────────────────────────────────────────────────────────
async function getRecentActivity(userID, limit = 10) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .input('Limit',  sql.Int, limit)
    .query(`
      SELECT TOP (@Limit) * FROM (

        -- New bookings received as lender (in last 30 days)
        SELECT
          'booking_received' AS ActivityType,
          b.BookingID        AS EntityID,
          b.CreatedAt        AS Timestamp,
          u.FullName         AS UserName,
          u.ProfilePic       AS UserPic,
          CONCAT('New booking received for ', ISNULL(a.Title, 'an item')) AS Description,
          b.Status           AS Status
        FROM Bookings b
        JOIN Users u       ON b.RenterID  = u.UserID
        LEFT JOIN Assets a ON b.AssetID   = a.AssetID
        WHERE b.LenderID = @UserID AND b.CreatedAt >= DATEADD(day, -30, GETDATE())

        UNION ALL

        -- Offers received on my requests (in last 30 days)
        SELECT
          'offer_received' AS ActivityType,
          o.OfferID        AS EntityID,
          o.CreatedAt      AS Timestamp,
          u.FullName       AS UserName,
          u.ProfilePic     AS UserPic,
          CONCAT('New offer received on your request: ', ISNULL(r.Title, 'your request')) AS Description,
          o.Status         AS Status
        FROM Offers o
        JOIN Users u    ON o.LenderID   = u.UserID
        JOIN Requests r ON o.RequestID  = r.RequestID
        WHERE r.RequesterID = @UserID AND o.CreatedAt >= DATEADD(day, -30, GETDATE())

        UNION ALL

        -- Bookings confirmed (in last 30 days)
        SELECT
          'booking_confirmed' AS ActivityType,
          b.BookingID         AS EntityID,
          ISNULL(b.UpdatedAt, b.CreatedAt) AS Timestamp,
          u.FullName          AS UserName,
          u.ProfilePic        AS UserPic,
          CONCAT('Booking confirmed: ', ISNULL(a.Title, 'your booking')) AS Description,
          b.Status            AS Status
        FROM Bookings b
        JOIN Users u       ON b.LenderID = u.UserID
        LEFT JOIN Assets a ON b.AssetID  = a.AssetID
        WHERE b.RenterID = @UserID AND b.Status IN ('confirmed', 'ongoing', 'completed')
          AND ISNULL(b.UpdatedAt, b.CreatedAt) >= DATEADD(day, -30, GETDATE())

        UNION ALL

        -- Payments received as lender (in last 30 days)
        SELECT
          'payment_received'  AS ActivityType,
          t.TransactionID     AS EntityID,
          t.CreatedAt         AS Timestamp,
          u.FullName          AS UserName,
          u.ProfilePic        AS UserPic,
          CONCAT('Payment received: Rs. ', FORMAT(t.Amount, 'N0')) AS Description,
          'completed'         AS Status
        FROM Transactions t
        JOIN Wallets wTo   ON t.ToWalletID   = wTo.WalletID   AND wTo.UserID   = @UserID
        JOIN Wallets wFrom ON t.FromWalletID = wFrom.WalletID
        JOIN Users u       ON wFrom.UserID   = u.UserID
        WHERE t.Type = 'payment' AND t.CreatedAt >= DATEADD(day, -30, GETDATE())

      ) AS Combined
      ORDER BY Timestamp DESC
    `);
  return result.recordset;
}

// ── MONTHLY EARNINGS ──────────────────────────────────────────────────────────
async function getMonthlyEarnings(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.Int, userID)
    .query(`
      WITH Months AS (
        SELECT DATEFROMPARTS(YEAR(GETDATE()), 1, 1) AS MonthDate
        UNION ALL
        SELECT DATEADD(month, 1, MonthDate) FROM Months WHERE DATEADD(month, 1, MonthDate) <= GETDATE()
      )
      SELECT
        Months.MonthDate AS Month,
        ISNULL(SUM(b.TotalPrice), 0) AS Earnings,
        ISNULL(COUNT(b.BookingID), 0) AS BookingCount
      FROM Months
      LEFT JOIN Bookings b ON 
        b.LenderID = @UserID
        AND b.Status = 'completed'
        AND YEAR(b.CreatedAt) = YEAR(Months.MonthDate)
        AND MONTH(b.CreatedAt) = MONTH(Months.MonthDate)
      GROUP BY Months.MonthDate
      ORDER BY Months.MonthDate DESC
      OPTION (MAXRECURSION 12)
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
  getComprehensiveStats,
  getRecentActivity,
  getMonthlyEarnings,
};