const sql = require('mssql');

async function getMyBookings(req, res) {
    try {
        const userEmail = req.userEmail;
        const role = req.query.role === 'lender' ? 'lender' : 'borrower';
        
        console.log('📊 Getting bookings for:', userEmail, 'Role:', role);
        
        const pool = global.pool;
        
        const userResult = await pool.request()
            .input('Email', sql.NVarChar, userEmail)
            .query('SELECT UserID FROM Users WHERE Email = @Email');
        
        if (!userResult.recordset || userResult.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found', email: userEmail });
        }
        
        const userID = userResult.recordset[0].UserID;
        console.log('👤 UserID:', userID);
        
        let query;
        if (role === 'borrower') {
            query = `
                SELECT 
                    b.BookingID,
                    b.StartDate,
                    b.EndDate,
                    b.TotalPrice,
                    b.Status,
                    b.IsPaid,
                    a.Title AS AssetTitle,
                    lender.FullName AS LenderName
                FROM Bookings b
                LEFT JOIN Assets a ON b.AssetID = a.AssetID
                LEFT JOIN Users lender ON b.LenderID = lender.UserID
                WHERE b.RenterID = @UserID
                ORDER BY b.CreatedAt DESC
            `;
        } else {
            query = `
                SELECT 
                    b.BookingID,
                    b.StartDate,
                    b.EndDate,
                    b.TotalPrice,
                    b.Status,
                    b.IsPaid,
                    a.Title AS AssetTitle,
                    renter.FullName AS RenterName
                FROM Bookings b
                LEFT JOIN Assets a ON b.AssetID = a.AssetID
                LEFT JOIN Users renter ON b.RenterID = renter.UserID
                WHERE b.LenderID = @UserID
                ORDER BY b.CreatedAt DESC
            `;
        }
        
        const result = await pool.request()
            .input('UserID', sql.Int, userID)
            .query(query);
        
        console.log(`✅ Found ${result.recordset.length} bookings`);
        res.json(result.recordset);
        
    } catch (err) {
        console.error('❌ getMyBookings error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getBookingDetail(req, res) {
    try {
        const bookingID = parseInt(req.params.id);
        const pool = global.pool;
        
        const result = await pool.request()
            .input('BookingID', sql.Int, bookingID)
            .query(`
                SELECT 
                    b.BookingID,
                    b.StartDate,
                    b.EndDate,
                    b.TotalPrice,
                    b.Status,
                    b.IsPaid,
                    a.Title AS AssetTitle,
                    lender.FullName AS LenderName,
                    renter.FullName AS RenterName
                FROM Bookings b
                LEFT JOIN Assets a ON b.AssetID = a.AssetID
                LEFT JOIN Users lender ON b.LenderID = lender.UserID
                LEFT JOIN Users renter ON b.RenterID = renter.UserID
                WHERE b.BookingID = @BookingID
            `);
        
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(result.recordset[0]);
        
    } catch (err) {
        console.error('getBookingDetail error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function updateBookingStatus(req, res) {
    try {
        const bookingID = parseInt(req.params.id);
        const { status } = req.body;
        const userEmail = req.userEmail;
        
        const validStatuses = ['pending', 'confirmed', 'ongoing', 'returned', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const pool = global.pool;
        
        const userResult = await pool.request()
            .input('Email', sql.NVarChar, userEmail)
            .query('SELECT UserID FROM Users WHERE Email = @Email');
        
        const userID = userResult.recordset[0].UserID;
        
        const bookingResult = await pool.request()
            .input('BookingID', sql.Int, bookingID)
            .query('SELECT Status, LenderID, RenterID FROM Bookings WHERE BookingID = @BookingID');
        
        if (!bookingResult.recordset || bookingResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = bookingResult.recordset[0];
        
        const isLender = booking.LenderID === userID;
        const isRenter = booking.RenterID === userID;
        
        if (!isLender && !isRenter) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        await pool.request()
            .input('BookingID', sql.Int, bookingID)
            .input('Status', sql.NVarChar, status)
            .query('UPDATE Bookings SET Status = @Status WHERE BookingID = @BookingID');
        
        res.json({ message: `Booking ${bookingID} status updated to ${status}` });
        
    } catch (err) {
        console.error('updateBookingStatus error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function markBookingPaid(req, res) {
    try {
        const bookingID = parseInt(req.params.id);
        const userEmail = req.userEmail;
        
        const pool = global.pool;
        
        const userResult = await pool.request()
            .input('Email', sql.NVarChar, userEmail)
            .query('SELECT UserID FROM Users WHERE Email = @Email');
        
        const userID = userResult.recordset[0].UserID;
        
        const bookingResult = await pool.request()
            .input('BookingID', sql.Int, bookingID)
            .query('SELECT LenderID, IsPaid FROM Bookings WHERE BookingID = @BookingID');
        
        if (!bookingResult.recordset || bookingResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        const booking = bookingResult.recordset[0];
        
        if (booking.LenderID !== userID) {
            return res.status(403).json({ error: 'Only lender can mark as paid' });
        }
        
        if (booking.IsPaid) {
            return res.status(400).json({ error: 'Already marked as paid' });
        }
        
        await pool.request()
            .input('BookingID', sql.Int, bookingID)
            .query('UPDATE Bookings SET IsPaid = 1 WHERE BookingID = @BookingID');
        
        res.json({ message: `Booking ${bookingID} marked as paid` });
        
    } catch (err) {
        console.error('markBookingPaid error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { 
    getMyBookings, 
    getBookingDetail, 
    updateBookingStatus, 
    markBookingPaid 
};
