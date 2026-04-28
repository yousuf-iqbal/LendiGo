const admin = require('firebase-admin');
const { poolPromise, sql } = require('../config/db');

// Initialize Firebase Admin ONCE
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../config/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.error('❌ Firebase Admin init failed:', err.message);
  }
}

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔍 verifyToken - Auth Header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🎫 Token extracted, length:', token.length);

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ Firebase token verified for:', decodedToken.email);

    const userEmail = decodedToken.email;

    // Find user in database
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, userEmail)
      .query('SELECT UserID, FullName, Email FROM Users WHERE Email = @email');

    if (result.recordset.length === 0) {
      console.log('❌ User not found in DB:', userEmail);
      return res.status(404).json({ error: 'User not found' });
    }

    // Attach user to request
    req.userID = result.recordset[0].UserID;
    req.userEmail = userEmail;
    req.userName = result.recordset[0].FullName;

    console.log(`✅ Authenticated: UserID ${req.userID} (${userEmail})`);
    next();

  } catch (err) {
    console.error('❌ verifyToken ERROR:', err.message);
    console.error('Error code:', err.code);
    
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    if (err.code === 'auth/invalid-token' || err.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid token format.' });
    }

    return res.status(403).json({ error: 'Authentication failed: ' + err.message });
  }
};

module.exports = verifyToken;