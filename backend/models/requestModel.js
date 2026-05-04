const { poolPromise, sql } = require('../config/db');

// ── CREATE ────────────────────────────────────────────────────────────────────
async function createRequest(data, requesterID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Title', sql.NVarChar, data.title)
    .input('Description', sql.NVarChar, data.description || '')
    .input('CategoryID', sql.Int, data.categoryId || null)
    .input('StartDate', sql.Date, data.startDate)
    .input('EndDate', sql.Date, data.endDate)
    .input('MaxBudget', sql.Decimal, data.maxBudget || null)
    .input('City', sql.NVarChar, data.city || '')
    .input('Area', sql.NVarChar, data.area || '')
    .input('RequesterID', sql.Int, requesterID)
    .query(`
      INSERT INTO Requests (Title, Description, CategoryID, StartDate, EndDate, MaxBudget, City, Area, RequesterID, Status)
      OUTPUT INSERTED.RequestID
      VALUES (@Title, @Description, @CategoryID, @StartDate, @EndDate, @MaxBudget, @City, @Area, @RequesterID, 'open')
    `);
  return result.recordset[0].RequestID;
}

// ── READ ─────────────────────────────────────────────────────────────────────
async function getAllRequests(filters = {}) {
  const pool = await poolPromise;
  const request = pool.request();

  let whereClauses = ["r.Status = 'open'"];

  if (filters.categoryId) {
    whereClauses.push('r.CategoryID = @CategoryId');
    request.input('CategoryId', sql.Int, filters.categoryId);
  }
  if (filters.city) {
    whereClauses.push('r.City LIKE @City');
    request.input('City', sql.NVarChar, `%${filters.city}%`);
  }
  if (filters.minBudget) {
    whereClauses.push('r.MaxBudget >= @MinBudget');
    request.input('MinBudget', sql.Decimal, filters.minBudget);
  }
  if (filters.maxBudget) {
    whereClauses.push('r.MaxBudget <= @MaxBudget');
    request.input('MaxBudget', sql.Decimal, filters.maxBudget);
  }

  const whereClause = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const result = await request.query(`
    SELECT 
      r.RequestID, r.Title, r.Description, r.MaxBudget, r.StartDate, r.EndDate, r.Status, r.CreatedAt,
      u.FullName AS RequesterName, u.UserID AS RequesterID, u.ProfilePic AS RequesterPic,
      c.Name AS CategoryName
    FROM Requests r
    LEFT JOIN Users u ON r.RequesterID = u.UserID
    LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
    ${whereClause}
    ORDER BY r.CreatedAt DESC
  `);
  return result.recordset;
}

async function getRequestById(requestId) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('RequestID', sql.Int, requestId)
    .query(`
      SELECT 
        r.RequestID, r.Title, r.Description, r.MaxBudget, r.StartDate, r.EndDate, r.Status, r.CreatedAt,
        r.City, r.Area,
        u.FullName AS RequesterName, u.UserID AS RequesterID, u.ProfilePic AS RequesterPic, u.Phone AS RequesterPhone,
        c.Name AS CategoryName, c.CategoryID
      FROM Requests r
      LEFT JOIN Users u ON r.RequesterID = u.UserID
      LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
      WHERE r.RequestID = @RequestID
    `);
  return result.recordset[0];
}

// ✅ FIXED: was using global.pool — now uses poolPromise correctly
async function getRequestsByUser(userID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('RequesterID', sql.Int, userID)
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
        c.Name as categoryName,
        (SELECT COUNT(*) FROM Offers o WHERE o.RequestID = r.RequestID) as offerCount
      FROM Requests r
      LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
      WHERE r.RequesterID = @RequesterID
      ORDER BY r.CreatedAt DESC
    `);
  return result.recordset;
}

async function getFilterOptions() {
  const pool = await poolPromise;
  const [cities, categories] = await Promise.all([
    pool.request().query(`SELECT DISTINCT City FROM Requests WHERE City IS NOT NULL AND City != '' ORDER BY City`),
    pool.request().query(`SELECT CategoryID, Name FROM Categories ORDER BY Name`)
  ]);
  return {
    cities: cities.recordset.map(c => c.City),
    categories: categories.recordset
  };
}

// ── UPDATE ───────────────────────────────────────────────────────────────────
async function updateRequest(requestId, data, userID) {
  const pool = await poolPromise;

  const check = await pool.request()
    .input('RequestID', sql.Int, requestId)
    .input('UserID', sql.Int, userID)
    .query('SELECT RequestID FROM Requests WHERE RequestID = @RequestID AND RequesterID = @UserID');

  if (check.recordset.length === 0) {
    throw new Error('Unauthorized: You can only edit your own requests');
  }

  await pool.request()
    .input('RequestID', sql.Int, requestId)
    .input('Title', sql.NVarChar, data.title)
    .input('Description', sql.NVarChar, data.description)
    .input('CategoryID', sql.Int, data.categoryId || null)
    .input('StartDate', sql.Date, data.startDate)
    .input('EndDate', sql.Date, data.endDate)
    .input('MaxBudget', sql.Decimal, data.maxBudget || null)
    .input('City', sql.NVarChar, data.city)
    .input('Area', sql.NVarChar, data.area)
    .query(`
      UPDATE Requests 
      SET Title = @Title, Description = @Description, CategoryID = @CategoryID,
          StartDate = @StartDate, EndDate = @EndDate, MaxBudget = @MaxBudget,
          City = @City, Area = @Area, UpdatedAt = GETDATE()
      WHERE RequestID = @RequestID
    `);
}

async function updateRequestStatus(requestId, status, userID) {
  const pool = await poolPromise;

  const check = await pool.request()
    .input('RequestID', sql.Int, requestId)
    .input('UserID', sql.Int, userID)
    .query('SELECT RequestID FROM Requests WHERE RequestID = @RequestID AND RequesterID = @UserID');

  if (check.recordset.length === 0) {
    throw new Error('Unauthorized: You can only modify your own requests');
  }

  await pool.request()
    .input('RequestID', sql.Int, requestId)
    .input('Status', sql.NVarChar, status)
    .query('UPDATE Requests SET Status = @Status, UpdatedAt = GETDATE() WHERE RequestID = @RequestID');
}

// ── DELETE ───────────────────────────────────────────────────────────────────
async function deleteRequest(requestId, userID) {
  const pool = await poolPromise;

  const check = await pool.request()
    .input('RequestID', sql.Int, requestId)
    .input('UserID', sql.Int, userID)
    .query('SELECT RequestID FROM Requests WHERE RequestID = @RequestID AND RequesterID = @UserID');

  if (check.recordset.length === 0) {
    throw new Error('Unauthorized: You can only delete your own requests');
  }

  await pool.request()
    .input('RequestID', sql.Int, requestId)
    .query('DELETE FROM Requests WHERE RequestID = @RequestID');
}

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  getRequestsByUser,
  getFilterOptions,
  updateRequest,
  updateRequestStatus,
  deleteRequest,
};