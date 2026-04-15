const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const sql = require('mssql');

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
        console.log('✅ Firebase Admin initialized');
    } catch (err) {
        console.error('❌ Firebase init error:', err.message);
    }
}

// POST /api/auth/login - Verify Firebase token and return user
router.post('/login', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        const pool = global.pool;
        
        // Check if user exists
        const result = await pool.request()
            .input('Email', sql.NVarChar, decodedToken.email)
            .query('SELECT UserID, FullName, Email, Phone, City, Area, CNIC, ProfilePic, IsVerified, Role FROM Users WHERE Email = @Email');
        
        let user;
        if (result.recordset.length === 0) {
            // Create new user with default values
            const insertResult = await pool.request()
                .input('Email', sql.NVarChar, decodedToken.email)
                .input('FullName', sql.NVarChar, decodedToken.name || decodedToken.email.split('@')[0])
                .input('Phone', sql.NVarChar, '')
                .input('City', sql.NVarChar, '')
                .input('Area', sql.NVarChar, '')
                .input('CNIC', sql.NVarChar, '')
                .input('ProfilePic', sql.NVarChar, '')
                .input('Role', sql.NVarChar, 'user')
                .query(`INSERT INTO Users (Email, FullName, Phone, City, Area, CNIC, ProfilePic, Role) 
                        OUTPUT INSERTED.* 
                        VALUES (@Email, @FullName, @Phone, @City, @Area, @CNIC, @ProfilePic, @Role)`);
            user = insertResult.recordset[0];
        } else {
            user = result.recordset[0];
        }
        
        // Return full user data
        res.json({ 
            user: {
                id: user.UserID,
                email: user.Email,
                fullName: user.FullName || '',
                phone: user.Phone || '',
                city: user.City || '',
                area: user.Area || '',
                cnic: user.CNIC || '',
                profilePic: user.ProfilePic || '',
                isVerified: user.IsVerified || false,
                role: user.Role || 'user'
            },
            token 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(401).json({ error: err.message });
    }
});

// PUT /api/auth/profile - Update profile (fullName, phone, city, area, cnic)
router.put('/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        const { fullName, phone, city, area, cnic } = req.body;
        const pool = global.pool;
        
        // Update all fields including cnic
        await pool.request()
            .input('Email', sql.NVarChar, decodedToken.email)
            .input('FullName', sql.NVarChar, fullName || '')
            .input('Phone', sql.NVarChar, phone || '')
            .input('City', sql.NVarChar, city || '')
            .input('Area', sql.NVarChar, area || '')
            .input('CNIC', sql.NVarChar, cnic || '')
            .query(`UPDATE Users SET 
                    FullName = @FullName, 
                    Phone = @Phone, 
                    City = @City, 
                    Area = @Area,
                    CNIC = @CNIC
                    WHERE Email = @Email`);
        
        // Return updated user
        const updatedUser = await pool.request()
            .input('Email', sql.NVarChar, decodedToken.email)
            .query('SELECT UserID, FullName, Email, Phone, City, Area, CNIC, ProfilePic, IsVerified, Role FROM Users WHERE Email = @Email');
        
        const user = updatedUser.recordset[0];
        res.json({ 
            message: 'Profile updated successfully',
            user: {
                id: user.UserID,
                email: user.Email,
                fullName: user.FullName || '',
                phone: user.Phone || '',
                city: user.City || '',
                area: user.Area || '',
                cnic: user.CNIC || '',
                profilePic: user.ProfilePic || '',
                isVerified: user.IsVerified || false,
                role: user.Role || 'user'
            }
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/avatar - Upload profile picture
router.post('/avatar', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        const { profilePicUrl } = req.body;
        const pool = global.pool;
        
        await pool.request()
            .input('Email', sql.NVarChar, decodedToken.email)
            .input('ProfilePic', sql.NVarChar, profilePicUrl || '')
            .query(`UPDATE Users SET ProfilePic = @ProfilePic WHERE Email = @Email`);
        
        // Return updated user
        const updatedUser = await pool.request()
            .input('Email', sql.NVarChar, decodedToken.email)
            .query('SELECT UserID, FullName, Email, Phone, City, Area, CNIC, ProfilePic, IsVerified, Role FROM Users WHERE Email = @Email');
        
        const user = updatedUser.recordset[0];
        res.json({ 
            message: 'Profile picture updated successfully',
            user: {
                id: user.UserID,
                email: user.Email,
                fullName: user.FullName || '',
                phone: user.Phone || '',
                city: user.City || '',
                area: user.Area || '',
                cnic: user.CNIC || '',
                profilePic: user.ProfilePic || '',
                isVerified: user.IsVerified || false,
                role: user.Role || 'user'
            }
        });
    } catch (err) {
        console.error('Upload avatar error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
