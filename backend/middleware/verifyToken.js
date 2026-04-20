const { admin } = require('../config/firebase');
const { poolPromise, sql } = require('../config/db');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const idToken = authHeader.split(' ')[1];
        
        // Check if admin is initialized
        if (!admin || !admin.auth) {
            console.warn('Firebase Admin not initialized - using test mode');
            // Test mode - accept any token
            req.userID = 1;
            req.userEmail = 'khushbakhtsohail101@gmail.com';
            return next();
        }
        
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const email = decodedToken.email;
        
        const pool = await poolPromise();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT UserID, FullName, Email FROM Users WHERE Email = @email');
            
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found. Please sign up first.' });
        }
        
        req.userID = result.recordset[0].UserID;
        req.userEmail = email;
        req.userName = result.recordset[0].FullName;
        
        console.log(`✅ Auth OK: UserID=${req.userID} (${req.userEmail})`);
        return next();
        
    } catch (err) {
        console.error('Token verification error:', err.message);
        
        // Fallback to test mode for development
        console.warn('Using test mode - accepting any token');
        req.userID = 1;
        req.userEmail = 'khushbakhtsohail101@gmail.com';
        return next();
    }
};
