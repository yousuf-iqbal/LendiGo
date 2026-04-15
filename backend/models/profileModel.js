const { poolPromise, sql } = require('../config/db');

async function getProfileByUserID(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        u.UserID,
        u.FullName,
        u.Email,
        u.Phone,
        u.City,
        u.Area,
        u.ProfilePic,
        u.IsVerified,
        u.IsBanned,
        u.Role,
        u.CreatedAt,
        ISNULL(AVG(CAST(r.Rating AS FLOAT)), 0)   AS AverageRating,
        COUNT(r.ReviewID)                          AS TotalReviews,
        COUNT(DISTINCT b_lend.BookingID)           AS TotalLendings,
        COUNT(DISTINCT b_rent.BookingID)           AS TotalRentals
      FROM Users u
      LEFT JOIN Reviews  r      ON r.RevieweeID   = u.UserID
      LEFT JOIN Bookings b_lend ON b_lend.LenderID = u.UserID AND b_lend.Status = 'completed'
      LEFT JOIN Bookings b_rent ON b_rent.RenterID = u.UserID AND b_rent.Status = 'completed'
      WHERE u.UserID = @UserID
      GROUP BY
        u.UserID, u.FullName, u.Email, u.Phone, u.City, u.Area,
        u.ProfilePic, u.IsVerified, u.IsBanned, u.Role, u.CreatedAt
    `);
  return result.recordset[0];
}

async function getProfileByEmail(email) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Email', sql.NVarChar, email)
    .query(`
      SELECT
        u.UserID,
        u.FullName,
        u.Email,
        u.Phone,
        u.City,
        u.Area,
        u.ProfilePic,
        u.IsVerified,
        u.IsBanned,
        u.Role,
        u.CreatedAt,
        ISNULL(AVG(CAST(r.Rating AS FLOAT)), 0)   AS AverageRating,
        COUNT(r.ReviewID)                          AS TotalReviews,
        COUNT(DISTINCT b_lend.BookingID)           AS TotalLendings,
        COUNT(DISTINCT b_rent.BookingID)           AS TotalRentals
      FROM Users u
      LEFT JOIN Reviews  r      ON r.RevieweeID   = u.UserID
      LEFT JOIN Bookings b_lend ON b_lend.LenderID = u.UserID AND b_lend.Status = 'completed'
      LEFT JOIN Bookings b_rent ON b_rent.RenterID = u.UserID AND b_rent.Status = 'completed'
      WHERE u.Email = @Email
      GROUP BY
        u.UserID, u.FullName, u.Email, u.Phone, u.City, u.Area,
        u.ProfilePic, u.IsVerified, u.IsBanned, u.Role, u.CreatedAt
    `);
  return result.recordset[0];
}

async function updateProfile(userID, { fullName, phone, city, area }) {
  const pool = await poolPromise;

  // phone uniqueness check (exclude self)
  if (phone) {
    const check = await pool.request()
      .input('Phone', sql.NVarChar, phone)
      .input('UserID', sql.NVarChar, userID)
      .query(`SELECT UserID FROM Users WHERE Phone = @Phone AND UserID != @UserID`);
    if (check.recordset[0]) {
      return { error: 'phone number already in use by another account.', code: 409 };
    }
  }

  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .input('FullName', sql.NVarChar, fullName   || null)
    .input('Phone',    sql.NVarChar, phone      || null)
    .input('City',     sql.NVarChar, city       || null)
    .input('Area',     sql.NVarChar, area       || null)
    .query(`
      UPDATE Users
      SET
        FullName = ISNULL(@FullName, FullName),
        Phone    = ISNULL(@Phone,    Phone),
        City     = ISNULL(@City,     City),
        Area     = ISNULL(@Area,     Area)
      OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Phone, INSERTED.City, INSERTED.Area
      WHERE UserID = @UserID
    `);
  return { updated: result.recordset[0] };
}

async function updateProfilePicture(userID, profilePicUrl) {
  const pool = await poolPromise;
  await pool.request()
    .input('UserID',     sql.NVarChar, userID)
    .input('ProfilePic', sql.NVarChar, profilePicUrl)
    .query(`UPDATE Users SET ProfilePic = @ProfilePic WHERE UserID = @UserID`);
}

async function getPublicAssets(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        a.AssetID,
        a.Title,
        a.Description,
        a.PricePerDay,
        a.City,
        a.Area,
        a.IsActive,
        a.CreatedAt,
        c.Name AS CategoryName,
        (SELECT TOP 1 ImageURL FROM AssetImages ai WHERE ai.AssetID = a.AssetID AND ai.IsPrimary = 1) AS PrimaryImage
      FROM Assets a
      LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
      WHERE a.OwnerID = @UserID AND a.IsActive = 1
      ORDER BY a.CreatedAt DESC
    `);
  return result.recordset;
}

async function getPublicReviews(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', sql.NVarChar, userID)
    .query(`
      SELECT
        r.ReviewID,
        r.Rating,
        r.Comment,
        r.CreatedAt,
        u.FullName   AS ReviewerName,
        u.ProfilePic AS ReviewerPic,
        a.Title      AS AssetTitle
      FROM Reviews r
      JOIN Users u ON r.ReviewerID = u.UserID
      LEFT JOIN Assets a ON r.AssetID = a.AssetID
      WHERE r.RevieweeID = @UserID
      ORDER BY r.CreatedAt DESC
    `);
  return result.recordset;
}

module.exports = {
  getProfileByUserID,
  getProfileByEmail,
  updateProfile,
  updateProfilePicture,
  getPublicAssets,
  getPublicReviews,
};