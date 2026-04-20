const sql = require('mssql');

async function getAllRequests(filters = {}) {
    try {
        const pool = global.pool;
        if (!pool) {
            throw new Error('Database not connected');
        }
        
        const result = await pool.request()
            .query(`
                SELECT 
                    r.RequestID,
                    r.Title,
                    r.Description,
                    r.MaxBudget,
                    r.StartDate,
                    r.EndDate,
                    r.Status,
                    r.CreatedAt,
                    u.FullName AS RequesterName,
                    c.Name AS CategoryName
                FROM Requests r
                LEFT JOIN Users u ON r.RequesterID = u.UserID
                LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
                ORDER BY r.CreatedAt DESC
            `);
        return result.recordset;
    } catch (err) {
        console.error('Database error:', err);
        throw err;
    }
}

async function getFilterOptions() {
    try {
        const pool = global.pool;
        if (!pool) {
            throw new Error('Database not connected');
        }
        
        const cities = await pool.request()
            .query(`SELECT DISTINCT City FROM Requests WHERE City IS NOT NULL AND City != ''`);
        
        return {
            cities: cities.recordset.map(c => c.City)
        };
    } catch (err) {
        console.error('Database error:', err);
        throw err;
    }
}

module.exports = { getAllRequests, getFilterOptions };
