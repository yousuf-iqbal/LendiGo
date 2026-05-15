const express = require('express');
const { poolPromise, sql } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

router.get('/conversations', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, req.userID)
      .query(`
        SELECT
          b.BookingID,
          b.Status,
          b.AssetID,
          COALESCE(a.Title, r.Title, 'Booking chat') AS Title,
          CASE WHEN b.RenterID = @UserID THEN lender.FullName ELSE renter.FullName END AS OtherUserName,
          CASE WHEN b.RenterID = @UserID THEN lender.UserID ELSE renter.UserID END AS OtherUserID,
          CASE WHEN b.RenterID = @UserID THEN lender.ProfilePic ELSE renter.ProfilePic END AS OtherUserPic,
          MAX(m.SentAt) AS LastMessageAt,
          COUNT(CASE WHEN m.ReceiverID = @UserID AND m.IsRead = 0 THEN 1 END) AS UnreadCount
        FROM Bookings b
        JOIN Users renter ON renter.UserID = b.RenterID
        JOIN Users lender ON lender.UserID = b.LenderID
        LEFT JOIN Assets a ON a.AssetID = b.AssetID
        LEFT JOIN Offers o ON o.OfferID = b.OfferID
        LEFT JOIN Requests r ON r.RequestID = o.RequestID
        LEFT JOIN Messages m ON m.BookingID = b.BookingID
        WHERE b.RenterID = @UserID OR b.LenderID = @UserID
        GROUP BY b.BookingID, b.Status, b.AssetID, a.Title, r.Title,
                 b.RenterID, lender.FullName, lender.UserID, lender.ProfilePic,
                 renter.FullName, renter.UserID, renter.ProfilePic
        ORDER BY LastMessageAt DESC, b.BookingID DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/bookings/:bookingId/messages', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId, 10);
    if (!Number.isFinite(bookingId)) return res.status(400).json({ error: 'Invalid booking ID' });

    const pool = await poolPromise;
    const participant = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .input('UserID', sql.Int, req.userID)
      .query(`
        SELECT BookingID FROM Bookings
        WHERE BookingID = @BookingID AND (RenterID = @UserID OR LenderID = @UserID)
      `);

    if (participant.recordset.length === 0) {
      return res.status(403).json({ error: 'You can only open chats for your own bookings' });
    }

    await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .input('UserID', sql.Int, req.userID)
      .query('UPDATE Messages SET IsRead = 1 WHERE BookingID = @BookingID AND ReceiverID = @UserID');

    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT
          m.MessageID, m.BookingID, m.SenderID, m.ReceiverID, m.Body, m.IsRead, m.SentAt,
          sender.FullName AS SenderName,
          sender.ProfilePic AS SenderPic
        FROM Messages m
        JOIN Users sender ON sender.UserID = m.SenderID
        WHERE m.BookingID = @BookingID
        ORDER BY m.SentAt ASC, m.MessageID ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
