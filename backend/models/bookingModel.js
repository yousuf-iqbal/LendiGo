const sql = require('mssql');

async function getBookingsByUser(userID, role) {
    try {
        const pool = global.pool;
        const column = role === 'lender' ? 'LenderID' : 'RenterID';
        
        const result = await pool.request()
            .input('UserID', sql.Int, userID)  // Changed to Int
            .query(`
                SELECT 
                    b.BookingID,
                    b.StartDate,
                    b.EndDate,
                    b.TotalPrice,
                    b.Status,
                    b.IsPaid,
                    b.CreatedAt,
                    a.Title AS AssetTitle,
                    lender.FullName AS LenderName,
                    renter.FullName AS RenterName
                FROM Bookings b
                LEFT JOIN Assets a ON b.AssetID = a.AssetID
                LEFT JOIN Users lender ON b.LenderID = lender.UserID
                LEFT JOIN Users renter ON b.RenterID = renter.UserID
                WHERE b.${column} = @UserID
                ORDER BY b.CreatedAt DESC
            `);
        
        return result.recordset;
    } catch (err) {
        console.error('getBookingsByUser error:', err);
        throw err;
    }
}

async function getBookingByID(bookingID) {
    try {
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
        
        return result.recordset[0];
    } catch (err) {
        console.error('getBookingByID error:', err);
        throw err;
    }
}

module.exports = { getBookingsByUser, getBookingByID };
