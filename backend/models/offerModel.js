
const { poolPromise, sql } = require('../config/db');

// ── CREATE ────────────────────────────────────────────────────────────────────
async function createOffer(data, lenderID) {
  const pool = await poolPromise;

  // Check for duplicate offer (same lender, same request)
  const existing = await pool.request()
    .input('RequestID', sql.Int, Number(data.requestId))
    .input('LenderID', sql.Int, Number(lenderID))
    .query('SELECT OfferID FROM Offers WHERE RequestID = @RequestID AND LenderID = @LenderID');

  if (existing.recordset.length > 0) {
    throw new Error('You have already made an offer for this request');
  }

  const result = await pool.request()
    .input('RequestID', sql.Int, Number(data.requestId))
    .input('LenderID', sql.Int, Number(lenderID))
    .input('AssetID', sql.Int, data.assetId ? Number(data.assetId) : null)
    .input('OfferedPrice', sql.Decimal(10, 2), parseFloat(data.offeredPrice))
    .input('Message', sql.NVarChar, data.message || '')
    .input('StartDate', sql.Date, data.startDate || null)
    .input('EndDate', sql.Date, data.endDate || null)
    .query(`
      INSERT INTO Offers (RequestID, LenderID, AssetID, OfferedPrice, Message, StartDate, EndDate, Status)
      OUTPUT INSERTED.OfferID
      VALUES (@RequestID, @LenderID, @AssetID, @OfferedPrice, @Message, @StartDate, @EndDate, 'pending')
    `);
  return result.recordset[0].OfferID;
}

// ── READ ─────────────────────────────────────────────────────────────────────
async function getOffersByRequest(requestId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('RequestID', sql.Int, Number(requestId))
    .query(`
      SELECT
        o.OfferID, o.OfferedPrice, o.Message, o.Status, o.CreatedAt,
        ISNULL(o.StartDate, NULL) AS StartDate,
        ISNULL(o.EndDate, NULL) AS EndDate,
        u.FullName AS LenderName, u.UserID AS LenderID, u.ProfilePic AS LenderPic, u.Phone AS LenderPhone,
        a.Title AS AssetTitle, a.AssetID, a.PricePerDay,
        (SELECT TOP 1 ImageURL FROM AssetImages WHERE AssetID = a.AssetID AND IsPrimary = 1) AS AssetImage
      FROM Offers o
      JOIN Users u ON o.LenderID = u.UserID
      LEFT JOIN Assets a ON o.AssetID = a.AssetID
      WHERE o.RequestID = @RequestID
      ORDER BY o.CreatedAt DESC
    `);
  return result.recordset;
}

async function getOffersByLender(lenderID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('LenderID', sql.Int, Number(lenderID))
    .query(`
      SELECT
        o.OfferID, o.OfferedPrice, o.Message, o.Status, o.CreatedAt,
        ISNULL(o.StartDate, r.StartDate) AS StartDate,
        ISNULL(o.EndDate, r.EndDate) AS EndDate,
        r.Title AS RequestTitle, r.RequestID, r.StartDate AS RequestStartDate, r.EndDate AS RequestEndDate,
        u.FullName AS RequesterName, u.UserID AS RequesterID
      FROM Offers o
      JOIN Requests r ON o.RequestID = r.RequestID
      JOIN Users u ON r.RequesterID = u.UserID
      WHERE o.LenderID = @LenderID
      ORDER BY o.CreatedAt DESC
    `);
  return result.recordset;
}

async function getOfferById(offerId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('OfferID', sql.Int, Number(offerId))
    .query(`
      SELECT
        o.OfferID, o.OfferedPrice, o.Message, o.Status, o.CreatedAt,
        ISNULL(o.StartDate, r.StartDate) AS OfferStartDate,
        ISNULL(o.EndDate, r.EndDate) AS OfferEndDate,
        r.Title AS RequestTitle, r.RequestID, r.StartDate AS RequestStartDate, r.EndDate AS RequestEndDate, r.MaxBudget,
        u.FullName AS RequesterName, u.UserID AS RequesterID, u.ProfilePic AS RequesterPic, u.Phone AS RequesterPhone,
        a.Title AS AssetTitle, a.AssetID, a.PricePerDay,
        o.LenderID
      FROM Offers o
      JOIN Requests r ON o.RequestID = r.RequestID
      JOIN Users u ON r.RequesterID = u.UserID
      LEFT JOIN Assets a ON o.AssetID = a.AssetID
      WHERE o.OfferID = @OfferID
    `);
  return result.recordset[0];
}

// ── UPDATE ───────────────────────────────────────────────────────────────────
async function updateOfferStatus(offerId, status, requesterID) {
  const pool = await poolPromise;

  // Verify offer belongs to requester's request
  const check = await pool.request()
    .input('OfferID', sql.Int, Number(offerId))
    .input('RequesterID', sql.Int, Number(requesterID))
    .query(`
      SELECT o.OfferID FROM Offers o
      JOIN Requests r ON o.RequestID = r.RequestID
      WHERE o.OfferID = @OfferID AND r.RequesterID = @RequesterID
    `);

  if (check.recordset.length === 0) {
    throw new Error('Unauthorized: You can only manage offers for your own requests');
  }

  // ⚠️ NOTE: Offers table has NO UpdatedAt column in your schema — removed it.
  await pool.request()
    .input('OfferID', sql.Int, Number(offerId))
    .input('Status', sql.NVarChar, status)
    .query('UPDATE Offers SET Status = @Status WHERE OfferID = @OfferID');
}

// ── DELETE ───────────────────────────────────────────────────────────────────
async function deleteOffer(offerId, lenderID) {
  const pool = await poolPromise;

  const check = await pool.request()
    .input('OfferID', sql.Int, Number(offerId))
    .input('LenderID', sql.Int, Number(lenderID))
    .query('SELECT OfferID FROM Offers WHERE OfferID = @OfferID AND LenderID = @LenderID');

  if (check.recordset.length === 0) {
    throw new Error('Unauthorized: You can only delete your own offers');
  }

  await pool.request()
    .input('OfferID', sql.Int, Number(offerId))
    .query('DELETE FROM Offers WHERE OfferID = @OfferID');
}

async function getIncomingOffersByRequester(requesterID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('RequesterID', sql.Int, Number(requesterID))
    .query(`
      SELECT
        o.OfferID,
        o.OfferedPrice,
        o.Message,
        o.Status,
        o.CreatedAt,
        ISNULL(o.StartDate, r.StartDate) AS OfferStartDate,
        ISNULL(o.EndDate, r.EndDate) AS OfferEndDate,
        r.RequestID,
        r.Title AS RequestTitle,
        r.Description AS RequestDescription,
        r.MaxBudget,
        r.StartDate AS RequestStartDate,
        r.EndDate AS RequestEndDate,
        u.FullName AS LenderName,
        u.UserID AS LenderID,
        u.ProfilePic AS LenderPic
      FROM Offers o
      JOIN Requests r ON o.RequestID = r.RequestID
      JOIN Users u ON o.LenderID = u.UserID
      WHERE r.RequesterID = @RequesterID
      ORDER BY o.CreatedAt DESC
    `);
  return result.recordset;
}

module.exports = {
  createOffer,
  getOffersByRequest,
  getOffersByLender,
  getOfferById,
  updateOfferStatus,
  deleteOffer,
  getIncomingOffersByRequester,
};
