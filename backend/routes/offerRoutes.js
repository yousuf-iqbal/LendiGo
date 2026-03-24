const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  req.userID = 1;
  next();
};

router.get('/request/:requestID', async (req, res) => {
  try {
    const requestID = parseInt(req.params.requestID, 10);
    if (isNaN(requestID)) {
      return res.status(400).json({ error: 'Invalid requestID' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('requestID', sql.Int, requestID)
      .query('SELECT * FROM Offers WHERE RequestID = @requestID');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('lenderID', sql.Int, req.userID)
      .query(`
        SELECT o.*, r.Title AS RequestTitle, r.CategoryID,
               c.Name AS RequestCategory, u.FullName AS RequesterName
        FROM Offers o
        JOIN Requests r ON o.RequestID = r.RequestID
        JOIN Categories c ON r.CategoryID = c.CategoryID
        JOIN Users u ON r.RequesterID = u.UserID
        WHERE o.LenderID = @lenderID
        ORDER BY o.CreatedAt DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { requestID, offeredPrice, message } = req.body;
    const parsedRequestID = parseInt(requestID, 10);
    if (isNaN(parsedRequestID)) {
      return res.status(400).json({ error: 'Invalid requestID' });
    }

    console.log('Creating offer:', { requestID: parsedRequestID, offeredPrice, message });
    const pool = await poolPromise;
    await pool.request()
      .input('requestID', sql.Int, parsedRequestID)
      .input('lenderID', sql.Int, req.userID)
      .input('offeredPrice', sql.Decimal, offeredPrice)
      .input('message', sql.NVarChar, message || null)
      .query('INSERT INTO Offers (RequestID, LenderID, OfferedPrice, Message, CreatedAt) VALUES (@requestID, @lenderID, @offeredPrice, @message, GETDATE())');
    res.status(201).json({ message: 'Offer created' });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:offerID/accept', verifyToken, async (req, res) => {
  try {
    const offerID = parseInt(req.params.offerID, 10);
    if (isNaN(offerID)) return res.status(400).json({ error: 'Invalid offerID' });

    const pool = await poolPromise;

    // Get the offer to find the requestID
    const offerResult = await pool.request()
      .input('offerID', sql.Int, offerID)
      .query('SELECT * FROM Offers WHERE OfferID = @offerID');

    if (offerResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const offer = offerResult.recordset[0];

    // Accept this offer
    await pool.request()
      .input('offerID', sql.Int, offerID)
      .query("UPDATE Offers SET Status = 'accepted' WHERE OfferID = @offerID");

    // Reject all other offers for the same request
    await pool.request()
      .input('requestID', sql.Int, offer.RequestID)
      .input('offerID', sql.Int, offerID)
      .query("UPDATE Offers SET Status = 'rejected' WHERE RequestID = @requestID AND OfferID <> @offerID");

    // Close the request
    await pool.request()
      .input('requestID', sql.Int, offer.RequestID)
      .query("UPDATE Requests SET Status = 'closed' WHERE RequestID = @requestID");

    res.json({ message: 'Offer accepted and request closed' });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:offerID/reject', verifyToken, async (req, res) => {
  try {
    const offerID = parseInt(req.params.offerID, 10);
    if (isNaN(offerID)) return res.status(400).json({ error: 'Invalid offerID' });

    const pool = await poolPromise;
    await pool.request()
      .input('offerID', sql.Int, offerID)
      .query("UPDATE Offers SET Status = 'rejected' WHERE OfferID = @offerID");

    res.json({ message: 'Offer rejected' });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
