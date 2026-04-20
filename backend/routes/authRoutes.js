const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const sql = require('mssql');
const verifyToken = require('../middleware/verifyToken');

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

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        const pool = global.pool;
        
        const result = await pool.request()
            .input('Email', sql.NVarChar, decodedToken.email)
            .query('SELECT UserID, FullName, Email, Phone, City, Area, CNIC, ProfilePic, IsVerified, Role FROM Users WHERE Email = @Email');
        
        let user;
        if (result.recordset.length === 0) {
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
        
        res.json({ 
            user: {
                id: user.UserID,
                email: user.Email,
                FullName: user.FullName || '',
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

// POST /api/auth/register
router.post('/register', verifyToken, async (req, res) => {
    try {
        const { FullName, phone, city, area, cnic } = req.body;
        const userEmail = req.userEmail;
        const userId = req.userID;
        
        const pool = global.pool;
        
        await pool.request()
            .input('Email', sql.NVarChar, userEmail)
            .input('FullName', sql.NVarChar, FullName)
            .input('Phone', sql.NVarChar, phone || '')
            .input('City', sql.NVarChar, city || '')
            .input('Area', sql.NVarChar, area || '')
            .input('CNIC', sql.NVarChar, cnic || '')
            .query(`
                UPDATE Users 
                SET FullName = @FullName, 
                    Phone = @Phone, 
                    City = @City, 
                    Area = @Area, 
                    CNIC = @CNIC 
                WHERE Email = @Email
            `);
        
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
    try {
        const pool = global.pool;
        const result = await pool.request()
            .input('Email', sql.NVarChar, req.userEmail)
            .query('SELECT UserID as id, FullName, Email, Phone, City, Area, CNIC, ProfilePic FROM Users WHERE Email = @Email');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

