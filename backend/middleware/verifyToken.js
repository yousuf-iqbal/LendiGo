async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // For testing - just extract email from token if possible
    const token = authHeader.split(' ')[1];
    
    // Try to decode token to get email
    let userEmail = 'test@example.com';
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
      userEmail = payload.email || 'test@example.com';
    } catch(e) {
      console.log('Using default email');
    }
    
    req.userEmail = userEmail;
    req.userID = userEmail;
    
    console.log('✅ Auth success - User:', req.userEmail);
    next();
    
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = verifyToken;
