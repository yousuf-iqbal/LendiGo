const express = require('express');
const router = express.Router();
const sql = require('mssql');
const verifyToken = require('../middleware/verifyToken');

// Get all categories for dropdown
router.get('/categories', async (req, res) => {
    try {
        const pool = global.pool;
        const result = await pool.request()
            .query('SELECT CategoryID as id, Name as name FROM Categories ORDER BY Name');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all open requests
router.get('/', async (req, res) => {
    try {
        const pool = global.pool;
        const result = await pool.request()
            .query(`
                SELECT 
                    r.RequestID as id,
                    r.Title as title,
                    r.Description as description,
                    r.MaxBudget as maxBudget,
                    r.StartDate as startDate,
                    r.EndDate as endDate,
                    r.Status as status,
                    r.CreatedAt as createdAt,
                    u.FullName as requesterName,
                    u.UserID as requesterId,
                    c.Name as categoryName
                FROM Requests r
                LEFT JOIN Users u ON r.RequesterID = u.UserID
                LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
                ORDER BY r.CreatedAt DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching requests:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get single request by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = global.pool;
        const result = await pool.request()
            .input('RequestID', sql.Int, req.params.id)
            .query(`
                SELECT 
                    r.RequestID as id,
                    r.Title as title,
                    r.Description as description,
                    r.MaxBudget as maxBudget,
                    r.StartDate as startDate,
                    r.EndDate as endDate,
                    r.Status as status,
                    r.CreatedAt as createdAt,
                    r.City as city,
                    r.Area as area,
                    u.FullName as requesterName,
                    u.UserID as requesterId,
                    c.Name as categoryName,
                    c.CategoryID as categoryId
                FROM Requests r
                LEFT JOIN Users u ON r.RequesterID = u.UserID
                LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
                WHERE r.RequestID = @RequestID
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching request:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a request (only owner can delete)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const pool = global.pool;
        
        // Check if user is the owner
        const checkResult = await pool.request()
            .input('RequestID', sql.Int, req.params.id)
            .input('RequesterID', sql.Int, req.userID)
            .query('SELECT RequestID FROM Requests WHERE RequestID = @RequestID AND RequesterID = @RequesterID');
        
        if (checkResult.recordset.length === 0) {
            return res.status(403).json({ error: 'You can only delete your own requests' });
        }
        
        await pool.request()
            .input('RequestID', sql.Int, req.params.id)
            .query('DELETE FROM Requests WHERE RequestID = @RequestID');
        
        res.json({ message: 'Request deleted successfully' });
    } catch (err) {
        console.error('Error deleting request:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update request status (close/open) - only owner
router.patch('/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const pool = global.pool;
        
        // Check if user is the owner
        const checkResult = await pool.request()
            .input('RequestID', sql.Int, req.params.id)
            .input('RequesterID', sql.Int, req.userID)
            .query('SELECT RequestID FROM Requests WHERE RequestID = @RequestID AND RequesterID = @RequesterID');
        
        if (checkResult.recordset.length === 0) {
            return res.status(403).json({ error: 'You can only modify your own requests' });
        }
        
        await pool.request()
            .input('RequestID', sql.Int, req.params.id)
            .input('Status', sql.NVarChar, status)
            .query('UPDATE Requests SET Status = @Status WHERE RequestID = @RequestID');
        
        res.json({ message: `Request ${status}` });
    } catch (err) {
        console.error('Error updating request status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create a new request
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, description, categoryId, startDate, endDate, maxBudget, city, area } = req.body;
        const pool = global.pool;
        
        const result = await pool.request()
            .input('Title', sql.NVarChar, title)
            .input('Description', sql.NVarChar, description || '')
            .input('CategoryID', sql.Int, categoryId || null)
            .input('StartDate', sql.Date, startDate)
            .input('EndDate', sql.Date, endDate)
            .input('MaxBudget', sql.Decimal, maxBudget || null)
            .input('City', sql.NVarChar, city || '')
            .input('Area', sql.NVarChar, area || '')
            .input('RequesterID', sql.Int, req.userID)
            .query(`
                INSERT INTO Requests (Title, Description, CategoryID, StartDate, EndDate, MaxBudget, City, Area, RequesterID, Status)
                OUTPUT INSERTED.RequestID
                VALUES (@Title, @Description, @CategoryID, @StartDate, @EndDate, @MaxBudget, @City, @Area, @RequesterID, 'open')
            `);
        
        res.status(201).json({ message: 'Request created', requestId: result.recordset[0].RequestID });
    } catch (err) {
        console.error('Error creating request:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
