const { poolPromise, sql } = require('../config/db');

const publicUserSelect = `
  UserID, FullName, Email, Phone, City, Area, CNIC, CNICPicture,
  ProfilePic, IsVerified, IsBanned, Role, CreatedAt, SignupMethod
`;

async function getMe(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, req.userID)
      .query(`SELECT ${publicUserSelect} FROM Users WHERE UserID = @UserID`);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ user: result.recordset[0] });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
}

async function updateMe(req, res) {
  try {
    const { fullName, phone, city, area, cnic } = req.body;

    if (!fullName?.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (phone && !/^03\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone must be 11 digits starting with 03' });
    }
    if (cnic && !/^\d{13}$/.test(String(cnic).replace(/-/g, ''))) {
      return res.status(400).json({ error: 'CNIC must be exactly 13 digits' });
    }

    const pool = await poolPromise;

    if (phone) {
      const duplicatePhone = await pool.request()
        .input('Phone', sql.NVarChar, phone)
        .input('UserID', sql.Int, req.userID)
        .query('SELECT UserID FROM Users WHERE Phone = @Phone AND UserID <> @UserID');

      if (duplicatePhone.recordset.length > 0) {
        return res.status(409).json({ error: 'Phone number already registered' });
      }
    }

    const result = await pool.request()
      .input('UserID', sql.Int, req.userID)
      .input('FullName', sql.NVarChar, fullName.trim())
      .input('Phone', sql.NVarChar, phone || null)
      .input('City', sql.NVarChar, city?.trim() || null)
      .input('Area', sql.NVarChar, area?.trim() || null)
      .input('CNIC', sql.NVarChar, cnic ? String(cnic).replace(/-/g, '') : null)
      .query(`
        UPDATE Users
        SET FullName = @FullName,
            Phone = @Phone,
            City = @City,
            Area = @Area,
            CNIC = @CNIC
        OUTPUT INSERTED.${publicUserSelect.replaceAll(', ', ', INSERTED.')}
        WHERE UserID = @UserID
      `);

    res.json({ message: 'Profile updated', user: result.recordset[0] });
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

async function uploadAvatar(req, res) {
  try {
    const file = req.file || req.files?.profilePic?.[0];
    if (!file) {
      return res.status(400).json({ error: 'Profile image is required' });
    }

    const profilePic = file.path;
    const pool = await poolPromise;
    await pool.request()
      .input('UserID', sql.Int, req.userID)
      .input('ProfilePic', sql.NVarChar, profilePic)
      .query('UPDATE Users SET ProfilePic = @ProfilePic WHERE UserID = @UserID');

    res.json({ message: 'Profile picture updated', profilePic });
  } catch (err) {
    console.error('uploadAvatar error:', err);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
}

async function getPublicProfile(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .query(`
        SELECT
          u.UserID, u.FullName, u.City, u.Area, u.ProfilePic, u.CreatedAt,
          COALESCE(AVG(CAST(r.Rating AS FLOAT)), 0) AS AverageRating,
          COUNT(r.ReviewID) AS ReviewCount
        FROM Users u
        LEFT JOIN Reviews r ON r.RevieweeID = u.UserID
        WHERE u.UserID = @UserID
        GROUP BY u.UserID, u.FullName, u.City, u.Area, u.ProfilePic, u.CreatedAt
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ user: result.recordset[0] });
  } catch (err) {
    console.error('getPublicProfile error:', err);
    res.status(500).json({ error: 'Failed to load public profile' });
  }
}

module.exports = {
  getMe,
  updateMe,
  uploadAvatar,
  getPublicProfile,
};
