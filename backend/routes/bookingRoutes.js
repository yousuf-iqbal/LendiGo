const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

// ✅ GET /bookings/my - MUST COME FIRST
router.get('/my', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const userId = req.userID;
    const role = req.query.role || 'borrower';
    
    console.log('🔍 Fetching bookings for user:', userId, 'Role:', role);
    
    let query;
    if (role === 'lender') {
      query = `
        SELECT 
          b.BookingID as booking_id,
          b.BookingID as BookingID,
          a.AssetID as asset_id,
          b.StartDate as start_date,
          b.EndDate as end_date,
          b.TotalPrice as total_price,
          b.Status,
          b.Status as status,
          b.IsPaid as is_paid,
          a.Title as asset_name,
          u.FullName as borrower_name,
          u.UserID as borrower_id
        FROM Bookings b
        JOIN Assets a ON b.AssetID = a.AssetID
        JOIN Users u ON b.RenterID = u.UserID
        WHERE b.LenderID = @UserId
        ORDER BY b.CreatedAt DESC
      `;
    } else {
      query = `
        SELECT 
          b.BookingID as booking_id,
          b.BookingID as BookingID,
          a.AssetID as asset_id,
          b.StartDate as start_date,
          b.EndDate as end_date,
          b.TotalPrice as total_price,
          b.Status,
          b.Status as status,
          b.IsPaid as is_paid,
          a.Title as asset_name,
          u.FullName as lender_name,
          u.UserID as lender_id
        FROM Bookings b
        JOIN Assets a ON b.AssetID = a.AssetID
        JOIN Users u ON b.LenderID = u.UserID
        WHERE b.RenterID = @UserId
        ORDER BY b.CreatedAt DESC
      `;
    }

    const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .query(query);

    console.log(`✅ Found ${result.recordset.length} bookings`);
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Error fetching bookings:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET /bookings/:id - MUST COME AFTER /my
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    console.log('🔍 Fetching booking ID:', bookingId, 'for user:', req.userID);
    
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingId)
      .query(`
        SELECT 
          b.BookingID,
          b.StartDate,
          b.EndDate,
          b.TotalPrice,
          b.Status,
          ISNULL(a.Title, r.Title) AS AssetTitle,
          a.AssetID,
          c.Name AS CategoryName,
          uLender.FullName AS LenderName,
          uLender.UserID AS LenderID,
          uLender.ProfilePic AS LenderProfilePic,
          uLender.Phone AS LenderPhone,
          uRenter.FullName AS RenterName,
          uRenter.UserID AS RenterID,
          o.OfferedPrice,
          o.Message AS OfferMessage,
          r.Title AS RequestTitle
        FROM Bookings b
        LEFT JOIN Assets a ON b.AssetID = a.AssetID
        LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
        LEFT JOIN Offers o ON b.OfferID = o.OfferID
        LEFT JOIN Requests r ON o.RequestID = r.RequestID
        JOIN Users uLender ON b.LenderID = uLender.UserID
        JOIN Users uRenter ON b.RenterID = uRenter.UserID
        WHERE b.BookingID = @BookingID
      `);

    console.log('📊 Query result count:', result.recordset.length);

    if (result.recordset.length === 0) {
      console.log('⚠️ No booking found with ID:', bookingId);
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.recordset[0];
    console.log('🔐 Checking authorization: booking.lenderId=', booking.LenderID, 'booking.renterId=', booking.RenterID, 'req.userID=', req.userID);
    
    if (booking.LenderID !== req.userID && booking.RenterID !== req.userID) {
      console.log('❌ Unauthorized access attempt');
      return res.status(403).json({ error: 'Unauthorized to view this booking' });
    }

    console.log('✅ Booking fetched successfully');
    res.json(booking);
  } catch (err) {
    console.error('❌ Error fetching booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /bookings/
router.post('/', verifyToken, async (req, res) => {
  try {
    const { asset_id, start_date, end_date } = req.body;
    const pool = await poolPromise;
    const borrower_id = req.userID;
    
    if (!asset_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'asset_id, start_date and end_date are required' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    
    const assetResult = await pool.request()
      .input('AssetId', sql.Int, asset_id)
      .query('SELECT OwnerID, PricePerDay, IsActive FROM Assets WHERE AssetID = @AssetId');

    if (assetResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const lender_id = assetResult.recordset[0].OwnerID;
    const pricePerDay = assetResult.recordset[0].PricePerDay;
    const isActive = assetResult.recordset[0].IsActive;

    if (!isActive) {
      return res.status(400).json({ error: 'This asset is currently unavailable' });
    }
    if (Number(lender_id) === Number(req.userID)) {
      return res.status(400).json({ error: 'You cannot book your own asset' });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const total_price = pricePerDay * days;

    const result = await pool.request()
      .input('AssetID', sql.Int, asset_id)
      .input('RenterID', sql.Int, borrower_id)
      .input('LenderID', sql.Int, lender_id)
      .input('StartDate', sql.Date, start_date)
      .input('EndDate', sql.Date, end_date)
      .input('TotalPrice', sql.Decimal, total_price)
      .input('Status', sql.NVarChar, 'pending')
      .query(`
        INSERT INTO Bookings (AssetID, RenterID, LenderID, StartDate, EndDate, TotalPrice, Status)
        OUTPUT INSERTED.BookingID
        VALUES (@AssetID, @RenterID, @LenderID, @StartDate, @EndDate, @TotalPrice, @Status)
      `);

    const newBookingId = result.recordset[0].BookingID;
    console.log('✅ Booking created with ID:', newBookingId);
    
    res.status(201).json({ 
      message: 'Booking request sent', 
      bookingId: newBookingId 
    });
  } catch (err) {
    console.error('❌ Error creating booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /bookings/:id/status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    const userId = req.userID;
    const pool = await poolPromise;
    
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['ongoing', 'completed', 'cancelled'],
      ongoing: ['returned', 'completed'],
      returned: ['completed'],
    };
    
    const bookingResult = await pool.request()
      .input('BookingId', sql.Int, bookingId)
      .query('SELECT LenderID, RenterID, Status FROM Bookings WHERE BookingID = @BookingId');
    
    if (bookingResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.recordset[0];
    const isLender = booking.LenderID === userId;
    const isRenter = booking.RenterID === userId;

    if (!isLender && !isRenter) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const currentStatus = String(booking.Status).toLowerCase();
    const nextStatus = String(status || '').toLowerCase();
    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      return res.status(400).json({ error: `Cannot transition from ${currentStatus} to ${nextStatus}` });
    }
    if (nextStatus === 'confirmed' && !isLender) {
      return res.status(403).json({ error: 'Only the lender can confirm a booking' });
    }
    if (['ongoing', 'returned', 'completed'].includes(nextStatus) && !isLender) {
      return res.status(403).json({ error: 'Only the lender can update rental progress' });
    }

    await pool.request()
      .input('BookingId', sql.Int, bookingId)
      .input('Status', sql.NVarChar, nextStatus)
      .query('UPDATE Bookings SET Status = @Status, UpdatedAt = GETDATE() WHERE BookingID = @BookingId');

    res.json({ message: `Booking ${nextStatus}` });
  } catch (err) {
    console.error('❌ Error updating booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// Accept a booking (lender only) - changes status to 'confirmed' and enables payment
router.patch('/:id/accept', verifyToken, async (req, res) => {
  try {
    const { acceptBooking } = require('../controllers/bookingController');
    await acceptBooking(req, res);
  } catch (err) {
    console.error('Accept booking route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reject a booking (lender only) - changes status to 'cancelled'
router.patch('/:id/reject', verifyToken, async (req, res) => {
  try {
    const { rejectBooking } = require('../controllers/bookingController');
    await rejectBooking(req, res);
  } catch (err) {
    console.error('Reject booking route error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
