const admin = require('firebase-admin');
const { poolPromise, sql } = require('../config/db');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  try {
    // Try to load service account - create this file from Firebase Console
    // Go to Firebase Console → Project Settings → Service Accounts → Generate New Private Key
    const serviceAccount = require('../config/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.error('Firebase Admin init error:', err.message);
    console.log('Using mock mode - all users treated as UserID 1');
  }
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // If Firebase Admin is not initialized, use mock mode
    if (!admin.apps.length) {
      console.log('Mock mode: using UserID 1');
      req.userID = 1;
      req.userEmail = 'mock@example.com';
      return next();
    }
    
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email;
    
    console.log('Token verified for email:', email);
    
    // Find user by email in database
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT UserID, FullName, Email FROM Users WHERE Email = @email');
    
    if (result.recordset.length === 0) {
      console.log('User not found in database for email:', email);
      return res.status(404).json({ error: 'User not found in database. Please sign up first.' });
    }
    
    // Set the actual user ID from database
    req.userID = result.recordset[0].UserID;
    req.userEmail = email;
    req.userName = result.recordset[0].FullName;
    
    console.log('User authenticated:', req.userID, req.userEmail);
    next();
    
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token. Please login again.' });
  }
};

module.exports = verifyToken;