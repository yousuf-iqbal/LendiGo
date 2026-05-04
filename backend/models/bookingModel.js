const { poolPromise, sql } = require('../config/db');

async function createBooking({ assetID, offerID, renterID, lenderID, startDate, endDate, totalPrice }) {
  const pool = await poolPromise();
  const result = await pool.request()
    .input('assetID', sql.Int, parseInt(assetID) || null)
    .input('offerID', sql.Int, parseInt(offerID))
    .input('renterID', sql.Int, parseInt(renterID))
    .input('lenderID', sql.Int, parseInt(lenderID))
    .input('startDate', sql.Date, startDate)
    .input('endDate', sql.Date, endDate)
    .input('totalPrice', sql.Decimal, totalPrice)
    .query(`
      INSERT INTO Bookings (AssetID, OfferID, RenterID, LenderID, StartDate, EndDate, TotalPrice, Status, IsPaid, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@assetID, @offerID, @renterID, @lenderID, @startDate, @endDate, @totalPrice, 'pending', 0, GETDATE())
    `);
  return result.recordset[0];
}

async function getBookingsByUser(userID) {
  const pool = await poolPromise();
  const result = await pool.request()
    .input('userID', sql.Int, parseInt(userID))
    .query(`
      SELECT
        b.BookingID, b.Status, b.StartDate, b.EndDate, b.TotalPrice, b.IsPaid, b.CreatedAt,
        b.RenterID, b.LenderID,
        renter.FullName AS RenterName,
        lender.FullName AS LenderName,
        a.Title AS AssetTitle,
        a.AssetID,
        r.Title AS RequestTitle,
        o.OfferedPrice
      FROM Bookings b
      JOIN Users renter ON b.RenterID = renter.UserID
      JOIN Users lender ON b.LenderID = lender.UserID
      LEFT JOIN Assets a ON b.AssetID = a.AssetID
      LEFT JOIN Offers o ON b.OfferID = o.OfferID
      LEFT JOIN Requests r ON o.RequestID = r.RequestID
      WHERE b.RenterID = @userID OR b.LenderID = @userID
      ORDER BY b.CreatedAt DESC
    `);
  return result.recordset;
}

async function getBookingById(bookingID) {
  const pool = await poolPromise();
  const result = await pool.request()
    .input('bookingID', sql.Int, parseInt(bookingID))
    .query(`
      SELECT
        b.BookingID, b.Status, b.StartDate, b.EndDate, b.TotalPrice, b.IsPaid, b.CreatedAt,
        b.RenterID, b.LenderID,
        renter.FullName AS RenterName,
        lender.FullName AS LenderName,
        a.Title AS AssetTitle,
        r.Title AS RequestTitle,
        o.OfferedPrice
      FROM Bookings b
      JOIN Users renter ON b.RenterID = renter.UserID
      JOIN Users lender ON b.LenderID = lender.UserID
      LEFT JOIN Assets a ON b.AssetID = a.AssetID
      LEFT JOIN Offers o ON b.OfferID = o.OfferID
      LEFT JOIN Requests r ON o.RequestID = r.RequestID
      WHERE b.BookingID = @bookingID
    `);
  return result.recordset[0];
}

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['ongoing', 'cancelled'],
  ongoing: ['returned'],
  returned: ['completed'],
};

async function updateBookingStatus(bookingID, userID, newStatus) {
  const pool = await poolPromise();
  const booking = await getBookingById(bookingID);
  if (!booking) return { error: 'booking not found', code: 404 };
  if (booking.RenterID !== userID && booking.LenderID !== userID) {
    return { error: 'not authorized', code: 403 };
  }

  const allowed = VALID_TRANSITIONS[booking.Status] || [];
  if (!allowed.includes(newStatus)) {
    return { error: `cannot transition from ${booking.Status} to ${newStatus}`, code: 400 };
  }

  // only lender can confirm/cancel from pending; renter can also cancel
  if (newStatus === 'confirmed' && booking.LenderID !== userID) {
    return { error: 'only lender can confirm bookings', code: 403 };
  }

  const result = await pool.request()
    .input('bookingID', sql.Int, parseInt(bookingID))
    .input('status', sql.NVarChar, newStatus)
    .query(`
      UPDATE Bookings SET Status = @status OUTPUT INSERTED.*
      WHERE BookingID = @bookingID
    `);
  return { booking: result.recordset[0] };
}

async function acceptBooking(bookingID, userID) {
  const pool = await poolPromise;
  
  // Verify booking exists and user is the lender
  const booking = await getBookingById(bookingID);
  if (!booking) return { error: 'booking not found', code: 404 };
  if (booking.LenderID !== userID) {
    return { error: 'only lender can accept bookings', code: 403 };
  }
  if (booking.Status !== 'pending') {
    return { error: `cannot accept booking with status ${booking.Status}`, code: 400 };
  }

  // Update status to 'accepted'
  const result = await pool.request()
    .input('bookingID', sql.Int, parseInt(bookingID))
    .input('status', sql.NVarChar, 'accepted')
    .query(`UPDATE Bookings SET Status = @status, UpdatedAt = GETDATE() OUTPUT INSERTED.* WHERE BookingID = @bookingID`);
  
  return { booking: result.recordset[0] };
}

module.exports = { createBooking, getBookingsByUser, getBookingById, updateBookingStatus, acceptBooking };
