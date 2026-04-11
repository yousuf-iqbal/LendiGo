const { poolPromise, sql } = require('../config/db');
const bookingModel = require('./bookingModel');

async function getOffersByRequest(requestID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('RequestID', requestID)
    .query(`
      SELECT
        o.OfferID, o.RequestID, o.LenderID, o.OfferedPrice, o.Message, o.Status, o.CreatedAt,
        u.FullName AS LenderName, u.City AS LenderCity, u.Area AS LenderArea, u.ProfilePic AS LenderPic,
        COALESCE((SELECT AVG(CAST(Rating AS FLOAT)) FROM Reviews WHERE RevieweeID = o.LenderID), 0) AS LenderRating
      FROM Offers o
      JOIN Users u ON o.LenderID = u.UserID
      WHERE o.RequestID = @RequestID
      ORDER BY o.CreatedAt ASC
    `);
  return result.recordset;
}

async function getOffersByUser(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('UserID', userID)
    .query(`
      SELECT
        o.OfferID, o.OfferedPrice, o.Message, o.Status, o.CreatedAt,
        r.Title AS RequestTitle, r.CategoryID, r.RequestID, r.StartDate, r.EndDate,
        c.Name AS RequestCategory,
        u.FullName AS RequesterName
      FROM Offers o
      JOIN Requests r ON o.RequestID = r.RequestID
      LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
      JOIN Users u ON r.RequesterID = u.UserID
      WHERE o.LenderID = @UserID
      ORDER BY o.CreatedAt DESC
    `);
  return result.recordset;
}

async function getOfferById(offerID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('OfferID', offerID)
    .query(`
      SELECT o.OfferID, o.RequestID, o.LenderID, o.OfferedPrice, o.Message, o.Status, o.CreatedAt,
             r.RequesterID, r.StartDate, r.EndDate, r.Title AS RequestTitle
      FROM Offers o
      JOIN Requests r ON o.RequestID = r.RequestID
      WHERE o.OfferID = @OfferID
    `);
  return result.recordset[0];
}

async function createOffer(requestID, lenderID, offeredPrice, message) {
  const pool = await poolPromise;

  const ownerCheck = await pool.request()
    .input('RequestID', requestID)
    .input('LenderID', lenderID)
    .query(`SELECT RequesterID FROM Requests WHERE RequestID = @RequestID`);

  if (!ownerCheck.recordset[0]) return { error: 'request not found.', code: 404 };
  if (ownerCheck.recordset[0].RequesterID === lenderID) {
    return { error: 'you cannot make an offer on your own request.', code: 400 };
  }

  const statusCheck = await pool.request()
    .input('RequestID', requestID)
    .query(`SELECT Status FROM Requests WHERE RequestID = @RequestID`);
  if (statusCheck.recordset[0].Status !== 'open') {
    return { error: 'this request is no longer open.', code: 400 };
  }

  try {
    const result = await pool.request()
      .input('RequestID', requestID)
      .input('LenderID', lenderID)
      .input('OfferedPrice', offeredPrice)
      .input('Message', message || null)
      .query(`
        INSERT INTO Offers (RequestID, LenderID, OfferedPrice, Message, Status, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@RequestID, @LenderID, @OfferedPrice, @Message, 'pending', GETDATE())
      `);
    return { offer: result.recordset[0] };
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return { error: 'you have already made an offer on this request.', code: 409 };
    }
    throw err;
  }
}

async function acceptOffer(offerID, requesterID) {
  const pool = await poolPromise;

  const check = await pool.request()
    .input('OfferID', offerID)
    .query(`
      SELECT o.RequestID, o.LenderID, o.OfferedPrice, o.AssetID,
             r.RequesterID, r.Status AS RequestStatus,
             r.StartDate, r.EndDate
      FROM Offers o
      JOIN Requests r ON o.RequestID = r.RequestID
      WHERE o.OfferID = @OfferID
    `);

  if (!check.recordset[0]) return { error: 'offer not found.', code: 404 };
  const offer = check.recordset[0];

  if (offer.RequesterID !== requesterID) {
    return { error: 'only the requester can accept an offer.', code: 403 };
  }
  if (offer.RequestStatus !== 'open') {
    return { error: 'this request is no longer open.', code: 400 };
  }

  const requestID = offer.RequestID;

  await pool.request()
    .input('OfferID', offerID)
    .query(`UPDATE Offers SET Status = 'accepted' WHERE OfferID = @OfferID`);

  await pool.request()
    .input('RequestID', requestID)
    .input('OfferID', offerID)
    .query(`UPDATE Offers SET Status = 'rejected' WHERE RequestID = @RequestID AND OfferID != @OfferID`);

  await pool.request()
    .input('RequestID', requestID)
    .query(`UPDATE Requests SET Status = 'closed' WHERE RequestID = @RequestID`);

  // auto-create booking
  let durationDays = 1;
  if (offer.StartDate && offer.EndDate) {
    const start = new Date(offer.StartDate);
    const end = new Date(offer.EndDate);
    durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
  }
  const totalPrice = parseFloat(offer.OfferedPrice) * durationDays;

  const booking = await bookingModel.createBooking({
    assetID: offer.AssetID || null,
    offerID,
    renterID: requesterID,
    lenderID: offer.LenderID,
    startDate: offer.StartDate,
    endDate: offer.EndDate,
    totalPrice,
  });

  return { success: true, requestID, booking };
}

async function rejectOffer(offerID, requesterID) {
  const pool = await poolPromise;

  const check = await pool.request()
    .input('OfferID', offerID)
    .query(`
      SELECT r.RequesterID
      FROM Offers o
      JOIN Requests r ON o.RequestID = r.RequestID
      WHERE o.OfferID = @OfferID
    `);

  if (!check.recordset[0]) return { error: 'offer not found.', code: 404 };
  if (check.recordset[0].RequesterID !== requesterID) {
    return { error: 'only the requester can reject an offer.', code: 403 };
  }

  await pool.request()
    .input('OfferID', offerID)
    .query(`UPDATE Offers SET Status = 'rejected' WHERE OfferID = @OfferID`);

  return { success: true };
}

module.exports = { getOffersByRequest, getOffersByUser, getOfferById, createOffer, acceptOffer, rejectOffer };
