const sql = require('mssql');

async function createRequest(data, userId) {
    const pool = global.pool;
    const result = await pool.request()
        .input('Title', sql.NVarChar, data.title)
        .input('Description', sql.NVarChar, data.description)
        .input('CategoryID', sql.Int, data.categoryID)
        .input('StartDate', sql.Date, data.startDate)
        .input('EndDate', sql.Date, data.endDate)
        .input('MaxBudget', sql.Decimal, data.maxBudget)
        .input('City', sql.NVarChar, data.city)
        .input('Area', sql.NVarChar, data.area)
        .input('RequesterID', sql.Int, userId)
        .query(`
            INSERT INTO Requests (Title, Description, CategoryID, StartDate, EndDate, MaxBudget, City, Area, RequesterID, Status)
            VALUES (@Title, @Description, @CategoryID, @StartDate, @EndDate, @MaxBudget, @City, @Area, @RequesterID, 'open')
        `);
    return { id: result.recordset?.[0]?.RequestID };
}

async function getAllRequests() {
    const pool = global.pool;
    const result = await pool.request()
        .query(`
            SELECT r.RequestID, r.Title, r.Description, r.MaxBudget, r.StartDate, r.EndDate, r.Status, r.CreatedAt,
                   u.FullName AS RequesterName, c.Name AS CategoryName
            FROM Requests r
            LEFT JOIN Users u ON r.RequesterID = u.UserID
            LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
            ORDER BY r.CreatedAt DESC
        `);
    return result.recordset;
}

module.exports = { createRequest, getAllRequests };
