const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// GET offers for a request
router.get('/request/:requestID', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('requestID', sql.Int, req.params.requestID)
      .query(`
        SELECT o.OfferID, o.RequestID, o.LenderID, o.OfferedPrice, o.Message, o.Status, o.CreatedAt,
               u.FullName as LenderName, u.City as LenderCity, u.Area as LenderArea
        FROM Offers o
        LEFT JOIN Users u ON o.LenderID = u.UserID
        WHERE o.RequestID = @requestID
        ORDER BY o.CreatedAt DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching offers:', err);
    res.status(500).json({ error: 'Could not fetch offers' });
  }
});

// GET my offers
router.get('/my', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('lenderID', sql.Int, req.userID)
      .query(`
        SELECT o.*, r.Title as RequestTitle
        FROM Offers o
        JOIN Requests r ON o.RequestID = r.RequestID
        WHERE o.LenderID = @lenderID
        ORDER BY o.CreatedAt DESC
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching my offers:', err);
    res.status(500).json({ error: 'Could not fetch your offers' });
  }
});

// POST create offer
router.post('/', verifyToken, async (req, res) => {
  try {
    const { requestID, offeredPrice, message } = req.body;
    
    if (!requestID || !offeredPrice) {
      return res.status(400).json({ error: 'Request ID and price are required' });
    }
    
    const pool = await poolPromise;
    
    // Check if request exists and is open
    const requestCheck = await pool.request()
      .input('requestID', sql.Int, requestID)
      .query('SELECT Status FROM Requests WHERE RequestID = @requestID');
    
    if (requestCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (requestCheck.recordset[0].Status !== 'open') {
      return res.status(400).json({ error: 'This request is no longer open' });
    }
    
    // Check if user already made an offer
    const existingOffer = await pool.request()
      .input('requestID', sql.Int, requestID)
      .input('lenderID', sql.Int, req.userID)
      .query('SELECT OfferID FROM Offers WHERE RequestID = @requestID AND LenderID = @lenderID');
    
    if (existingOffer.recordset.length > 0) {
      // Update existing offer
      await pool.request()
        .input('requestID', sql.Int, requestID)
        .input('lenderID', sql.Int, req.userID)
        .input('offeredPrice', sql.Decimal, offeredPrice)
        .input('message', sql.NVarChar, message || null)
        .query(`
          UPDATE Offers 
          SET OfferedPrice = @offeredPrice, Message = @message, CreatedAt = GETDATE()
          WHERE RequestID = @requestID AND LenderID = @lenderID
        `);
      
      res.json({ message: 'Offer updated successfully' });
    } else {
      // Create new offer
      await pool.request()
        .input('requestID', sql.Int, requestID)
        .input('lenderID', sql.Int, req.userID)
        .input('offeredPrice', sql.Decimal, offeredPrice)
        .input('message', sql.NVarChar, message || null)
        .query(`
          INSERT INTO Offers (RequestID, LenderID, OfferedPrice, Message, Status, CreatedAt)
          VALUES (@requestID, @lenderID, @offeredPrice, @message, 'pending', GETDATE())
        `);
      
      res.status(201).json({ message: 'Offer created successfully' });
    }
  } catch (err) {
    console.error('Create offer error:', err);
    res.status(500).json({ error: err.message || 'Could not submit offer' });
  }
});

// PATCH accept offer
router.patch('/:id/accept', verifyToken, async (req, res) => {
  try {
    const offerID = req.params.id;
    const pool = await poolPromise;
    
    // Get offer details
    const offer = await pool.request()
      .input('offerID', sql.Int, offerID)
      .query(`
        SELECT o.*, r.RequesterID, r.Status as RequestStatus
        FROM Offers o
        JOIN Requests r ON o.RequestID = r.RequestID
        WHERE o.OfferID = @offerID
      `);
    
    if (offer.recordset.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    // Check if user is the request owner
    if (offer.recordset[0].RequesterID !== req.userID) {
      return res.status(403).json({ error: 'You can only accept offers on your own requests' });
    }
    
    // Check if request is still open
    if (offer.recordset[0].RequestStatus !== 'open') {
      return res.status(400).json({ error: 'This request is no longer open' });
    }
    
    // Accept this offer
    await pool.request()
      .input('offerID', sql.Int, offerID)
      .query('UPDATE Offers SET Status = "accepted" WHERE OfferID = @offerID');
    
    // Reject all other offers on this request
    await pool.request()
      .input('requestID', sql.Int, offer.recordset[0].RequestID)
      .input('offerID', sql.Int, offerID)
      .query('UPDATE Offers SET Status = "rejected" WHERE RequestID = @requestID AND OfferID != @offerID AND Status = "pending"');
    
    // Close the request
    await pool.request()
      .input('requestID', sql.Int, offer.recordset[0].RequestID)
      .query('UPDATE Requests SET Status = "fulfilled" WHERE RequestID = @requestID');
    
    res.json({ message: 'Offer accepted successfully' });
  } catch (err) {
    console.error('Accept offer error:', err);
    res.status(500).json({ error: 'Could not accept offer' });
  }
});

// PATCH reject offer
router.patch('/:id/reject', verifyToken, async (req, res) => {
  try {
    const offerID = req.params.id;
    const pool = await poolPromise;
    
    // Get offer details
    const offer = await pool.request()
      .input('offerID', sql.Int, offerID)
      .query(`
        SELECT o.*, r.RequesterID
        FROM Offers o
        JOIN Requests r ON o.RequestID = r.RequestID
        WHERE o.OfferID = @offerID
      `);
    
    if (offer.recordset.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    // Check if user is the request owner
    if (offer.recordset[0].RequesterID !== req.userID) {
      return res.status(403).json({ error: 'You can only reject offers on your own requests' });
    }
    
    // Reject the offer
    await pool.request()
      .input('offerID', sql.Int, offerID)
      .query('UPDATE Offers SET Status = "rejected" WHERE OfferID = @offerID');
    
    res.json({ message: 'Offer rejected successfully' });
  } catch (err) {
    console.error('Reject offer error:', err);
    res.status(500).json({ error: 'Could not reject offer' });
  }
});

module.exports = router;