const requestModel = require('../models/requestModel');
const sql = require('mssql');

async function createRequest(req, res) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        
        // Get user ID from email
        const admin = require('firebase-admin');
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        const pool = global.pool;
        const userResult = await pool.request()
            .input('Email', sql.NVarChar, decodedToken.email)
            .query('SELECT UserID FROM Users WHERE Email = @Email');
        
        if (!userResult.recordset.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userId = userResult.recordset[0].UserID;
        const request = await requestModel.createRequest(req.body, userId);
        res.status(201).json({ message: 'Request created', request });
    } catch (err) {
        console.error('createRequest error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getAllRequests(req, res) {
    try {
        const requests = await requestModel.getAllRequests();
        res.json(requests);
    } catch (err) {
        console.error('getAllRequests error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createRequest, getAllRequests };
