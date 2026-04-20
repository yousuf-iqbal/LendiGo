const express = require('express');
const router = express.Router();
const sql = require('mssql');
const verifyToken = require('../middleware/verifyToken');

// Get bookings for current user
router.get('/my', verifyToken, async (req, res) => {
    try {
        const pool = global.pool;
        const userId = req.userID;
        const role = req.query.role || 'borrower';
        
        console.log('Fetching bookings for user:', userId, 'Role:', role);
        
        let query;
        if (role === 'lender') {
            query = `
                SELECT 
                    b.BookingID as booking_id,
                    b.StartDate as start_date,
                    b.EndDate as end_date,
                    b.TotalPrice as total_price,
                    b.Status,
                    b.Message,
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
                    b.StartDate as start_date,
                    b.EndDate as end_date,
                    b.TotalPrice as total_price,
                    b.Status,
                    b.Message,
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
        
        console.log(`Found ${result.recordset.length} bookings`);
        res.json(result.recordset);
        
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create new booking
router.post('/', verifyToken, async (req, res) => {
    try {
        const { asset_id, borrower_id, start_date, end_date, message } = req.body;
        const pool = global.pool;
        
        console.log('Creating booking:', { asset_id, borrower_id, start_date, end_date });
        
        const assetResult = await pool.request()
            .input('AssetId', sql.Int, asset_id)
            .query('SELECT OwnerID, PricePerDay FROM Assets WHERE AssetID = @AssetId');
        
        if (assetResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        const lender_id = assetResult.recordset[0].OwnerID;
        const pricePerDay = assetResult.recordset[0].PricePerDay;
        
        const start = new Date(start_date);
        const end = new Date(end_date);
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
            .input('Message', sql.NVarChar, message || '')
            .query(`
                INSERT INTO Bookings (AssetID, RenterID, LenderID, StartDate, EndDate, TotalPrice, Status, Message)
                OUTPUT INSERTED.BookingID
                VALUES (@AssetID, @RenterID, @LenderID, @StartDate, @EndDate, @TotalPrice, @Status, @Message)
            `);
        
        res.status(201).json({ 
            message: 'Booking request sent', 
            booking_id: result.recordset[0].BookingID 
        });
        
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update booking status
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const bookingId = req.params.id;
        const userId = req.userID;
        const pool = global.pool;
        
        const bookingResult = await pool.request()
            .input('BookingId', sql.Int, bookingId)
            .query('SELECT LenderID, RenterID FROM Bookings WHERE BookingID = @BookingId');
        
        if (bookingResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = bookingResult.recordset[0];
        const isLender = booking.LenderID === userId;
        const isRenter = booking.RenterID === userId;
        
        if (!isLender && !isRenter) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        await pool.request()
            .input('BookingId', sql.Int, bookingId)
            .input('Status', sql.NVarChar, status)
            .query('UPDATE Bookings SET Status = @Status WHERE BookingID = @BookingId');
        
        res.json({ message: `Booking ${status}` });
        
    } catch (err) {
        console.error('Error updating booking:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
