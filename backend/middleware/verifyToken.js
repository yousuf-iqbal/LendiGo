const { admin } = require('../config/firebase');
const { poolPromise, sql } = require('../config/db');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided', code: 'NO_TOKEN' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userEmail = decodedToken.email;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, userEmail)
      .query(`
        SELECT UserID, FullName, Email, Role, IsBanned
        FROM Users
        WHERE Email = @email
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const dbUser = result.recordset[0];
    if (dbUser.IsBanned) {
      return res.status(403).json({ error: 'Your account has been suspended.', code: 'USER_BANNED' });
    }

    req.userID = dbUser.UserID;
    req.userEmail = dbUser.Email;
    req.userName = dbUser.FullName;
    req.userRole = dbUser.Role || 'user';
    req.firebaseUser = decodedToken;

    next();
  } catch (err) {
    console.error('verifyToken error:', err.message);

    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'token-expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.code === 'auth/invalid-token' || err.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid token format.', code: 'INVALID_TOKEN' });
    }

    return res.status(403).json({ error: 'Authentication failed', code: 'AUTH_FAILED' });
  }
};

module.exports = verifyToken;
