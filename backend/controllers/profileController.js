const sql = require('mssql');

async function getMyProfile(req, res) {
  try {
    const userEmail = req.userEmail;
    console.log('Getting profile for email:', userEmail);
    
    const pool = global.pool;
    
    // Fix: Use NVARCHAR for email, not INT
    const result = await pool.request()
      .input('Email', sql.NVarChar, userEmail)
      .query(`
        SELECT 
          UserID,
          FullName,
          Email,
          Phone,
          City,
          Area,
          ProfilePic,
          IsVerified,
          Role,
          CreatedAt
        FROM Users 
        WHERE Email = @Email
      `);
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.recordset[0]);
    
  } catch (err) {
    console.error('getMyProfile error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function getPublicProfile(req, res) {
  try {
    const userID = req.params.userID;
    const pool = global.pool;
    
    const result = await pool.request()
      .input('UserID', sql.NVarChar, String(userID))
      .query(`
        SELECT 
          UserID,
          FullName,
          City,
          Area,
          ProfilePic,
          IsVerified,
          Role
        FROM Users 
        WHERE UserID = @UserID
      `);
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.recordset[0]);
    
  } catch (err) {
    console.error('getPublicProfile error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const userEmail = req.userEmail;
    const { fullName, phone, city, area } = req.body;
    
    const pool = global.pool;
    
    const result = await pool.request()
      .input('Email', sql.NVarChar, userEmail)
      .input('FullName', sql.NVarChar, fullName || null)
      .input('Phone', sql.NVarChar, phone || null)
      .input('City', sql.NVarChar, city || null)
      .input('Area', sql.NVarChar, area || null)
      .query(`
        UPDATE Users 
        SET 
          FullName = ISNULL(@FullName, FullName),
          Phone = ISNULL(@Phone, Phone),
          City = ISNULL(@City, City),
          Area = ISNULL(@Area, Area)
        WHERE Email = @Email
      `);
    
    res.json({ message: 'Profile updated successfully' });
    
  } catch (err) {
    console.error('updateProfile error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

async function uploadAvatar(req, res) {
  try {
    // Placeholder - implement cloudinary upload here
    res.json({ message: 'Avatar upload endpoint - coming soon' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getMyProfile, getPublicProfile, updateProfile, uploadAvatar };
