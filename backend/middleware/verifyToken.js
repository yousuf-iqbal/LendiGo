// backend/middleware/verifyToken.js
const admin = require('firebase-admin');
const { poolPromise, sql } = require('../config/db');

// Initialize Firebase Admin ONCE at module load (not per request)
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../config/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized at module load');
  } catch (err) {
    console.error('❌ Firebase Admin init failed:', err.message);
    console.log('💡 Make sure serviceAccountKey.json exists in backend/config/');
  }
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Check for Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // ✅ CRITICAL: Extract email correctly from decoded token
    const userEmail = decodedToken.email;  // ← Use this variable name
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Invalid token: no email found' });
    }
    
    console.log('🔐 Token verified for email:', userEmail);
    
    // Find user in database by email
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, userEmail)  // ← Use userEmail here
      .query('SELECT UserID, FullName, Email FROM Users WHERE Email = @email');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found in database' });
    }
    
    // Attach user info to request for downstream handlers
    req.userID = result.recordset[0].UserID;
    req.userEmail = userEmail;
    req.userName = result.recordset[0].FullName;
    
    console.log(`✅ Authenticated: UserID ${req.userID} (${userEmail})`);
    next();
    
  } catch (err) {
    console.error('Token verification failed:', err.message);
    
    // Handle specific Firebase auth errors
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    if (err.code === 'auth/invalid-token') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = verifyToken;