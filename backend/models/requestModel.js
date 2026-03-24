const { poolPromise, sql } = require('../config/db');

// GET all requests with search + filters
async function getAllRequests({ search, status, category, city, area, minBudget, maxBudget } = {}) {
  const pool = await poolPromise;
  const request = pool.request();

  let query = `
    SELECT 
      r.RequestID, r.Title, r.Description, r.Area, r.City,
      r.StartDate, r.EndDate, r.MaxBudget, r.Status, r.CreatedAt,
      r.RequesterID,
      u.FullName AS RequesterName,
      c.Name AS CategoryName,
      c.CategoryID,
      (SELECT COUNT(*) FROM Offers o WHERE o.RequestID = r.RequestID) AS OfferCount
    FROM Requests r
    JOIN Users u ON r.RequesterID = u.UserID
    LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
    WHERE 1=1
  `;

  if (search) {
    query += ` AND (r.Title LIKE @search OR r.Description LIKE @search)`;
    request.input('search', sql.NVarChar, `%${search}%`);
  }
  if (status) {
    query += ` AND r.Status = @status`;
    request.input('status', sql.NVarChar, status);
  }
  if (category) {
    query += ` AND c.Name = @category`;
    request.input('category', sql.NVarChar, category);
  }
  if (city) {
    query += ` AND r.City LIKE @city`;
    request.input('city', sql.NVarChar, `%${city}%`);
  }
  if (area) {
    query += ` AND r.Area LIKE @area`;
    request.input('area', sql.NVarChar, `%${area}%`);
  }
  if (minBudget) {
    query += ` AND r.MaxBudget >= @minBudget`;
    request.input('minBudget', sql.Decimal, parseFloat(minBudget));
  }
  if (maxBudget) {
    query += ` AND r.MaxBudget <= @maxBudget`;
    request.input('maxBudget', sql.Decimal, parseFloat(maxBudget));
  }

  query += ` ORDER BY r.CreatedAt DESC`;
  const result = await request.query(query);
  return result.recordset;
}

// GET filter options — categories + cities from actual live data
async function getFilterOptions() {
  const pool = await poolPromise;
  const [categories, cities] = await Promise.all([
    pool.request().query(`
      SELECT DISTINCT c.CategoryID, c.Name 
      FROM Categories c
      INNER JOIN Requests r ON r.CategoryID = c.CategoryID
      WHERE r.Status = 'open'
      ORDER BY c.Name
    `),
    pool.request().query(`
      SELECT DISTINCT City 
      FROM Requests 
      WHERE City IS NOT NULL AND Status = 'open'
      ORDER BY City
    `)
  ]);
  return {
    categories: categories.recordset.map(r => ({ id: r.CategoryID, name: r.Name })),
    cities: cities.recordset.map(r => r.City)
  };
}

// GET one request by ID
async function getRequestById(requestID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('requestID', sql.Int, requestID)
    .query(`
      SELECT 
        r.RequestID, r.Title, r.Description, r.Area, r.City,
        r.StartDate, r.EndDate, r.MaxBudget, r.Status, r.CreatedAt,
        r.RequesterID,
        u.FullName AS RequesterName,
        c.Name AS CategoryName, c.CategoryID,
        (SELECT COUNT(*) FROM Offers o WHERE o.RequestID = r.RequestID) AS OfferCount
      FROM Requests r
      JOIN Users u ON r.RequesterID = u.UserID
      LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
      WHERE r.RequestID = @requestID
    `);
  return result.recordset[0];
}

// GET requests by user
async function getRequestsByUser(requesterID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('requesterID', sql.Int, requesterID)
    .query(`
      SELECT 
        r.RequestID, r.Title, r.Description, r.Area, r.City,
        r.StartDate, r.EndDate, r.MaxBudget, r.Status, r.CreatedAt,
        r.RequesterID,
        u.FullName AS RequesterName,
        c.Name AS CategoryName,
        (SELECT COUNT(*) FROM Offers o WHERE o.RequestID = r.RequestID) AS OfferCount
      FROM Requests r
      JOIN Users u ON r.RequesterID = u.UserID
      LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
      WHERE r.RequesterID = @requesterID
      ORDER BY r.CreatedAt DESC
    `);
  return result.recordset;
}

// CREATE request
async function createRequest({ requesterID, categoryID, title, description, city, area, startDate, endDate, maxBudget }) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('requesterID', sql.Int, requesterID)
    .input('categoryID', sql.Int, categoryID || null)
    .input('title', sql.NVarChar, title)
    .input('description', sql.NVarChar, description)
    .input('city', sql.NVarChar, city)
    .input('area', sql.NVarChar, area)
    .input('startDate', sql.Date, startDate)
    .input('endDate', sql.Date, endDate)
    .input('maxBudget', sql.Decimal, maxBudget || null)
    .query(`
      INSERT INTO Requests (RequesterID, CategoryID, Title, Description, City, Area, StartDate, EndDate, MaxBudget, Status, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@requesterID, @categoryID, @title, @description, @city, @area, @startDate, @endDate, @maxBudget, 'open', GETDATE())
    `);
  return result.recordset[0];
}

// UPDATE request
async function updateRequest(requestID, requesterID, { categoryID, title, description, city, area, startDate, endDate, maxBudget }) {
  const pool = await poolPromise;
  const check = await pool.request()
    .input('requestID', sql.Int, requestID)
    .input('requesterID', sql.Int, requesterID)
    .query(`SELECT Status FROM Requests WHERE RequestID = @requestID AND RequesterID = @requesterID`);

  if (!check.recordset[0]) return { error: 'not found or not your request', status: 403 };
  if (['closed','fulfilled'].includes(check.recordset[0].Status))
    return { error: 'cannot edit a closed or fulfilled request', status: 400 };
  if (description && description.length < 5)
    return { error: 'description must be at least 5 characters', status: 400 };

  const result = await pool.request()
    .input('requestID', sql.Int, requestID)
    .input('categoryID', sql.Int, categoryID || null)
    .input('title', sql.NVarChar, title)
    .input('description', sql.NVarChar, description)
    .input('city', sql.NVarChar, city)
    .input('area', sql.NVarChar, area)
    .input('startDate', sql.Date, startDate)
    .input('endDate', sql.Date, endDate)
    .input('maxBudget', sql.Decimal, maxBudget || null)
    .query(`
      UPDATE Requests
      SET CategoryID=@categoryID, Title=@title, Description=@description,
          City=@city, Area=@area, StartDate=@startDate, EndDate=@endDate, MaxBudget=@maxBudget
      OUTPUT INSERTED.*
      WHERE RequestID = @requestID
    `);
  return result.recordset[0];
}

// DELETE request
async function deleteRequest(requestID, requesterID) {
  const pool = await poolPromise;
  const check = await pool.request()
    .input('requestID', sql.Int, requestID)
    .input('requesterID', sql.Int, requesterID)
    .query(`SELECT Status FROM Requests WHERE RequestID = @requestID AND RequesterID = @requesterID`);

  if (!check.recordset[0]) return { error: 'not found or not your request', status: 403 };
  if (check.recordset[0].Status === 'fulfilled')
    return { error: 'cannot delete a fulfilled request', status: 400 };

  const offerCheck = await pool.request()
    .input('requestID', sql.Int, requestID)
    .query(`SELECT COUNT(*) AS cnt FROM Offers WHERE RequestID = @requestID`);
  if (offerCheck.recordset[0].cnt > 0)
    return { error: 'cannot delete a request that already has offers', status: 400 };

  await pool.request()
    .input('requestID', sql.Int, requestID)
    .query(`DELETE FROM Requests WHERE RequestID = @requestID`);
  return { success: true };
}

// CLOSE request
async function closeRequest(requestID, requesterID) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('requestID', sql.Int, requestID)
    .input('requesterID', sql.Int, requesterID)
    .query(`
      UPDATE Requests SET Status = 'closed'
      OUTPUT INSERTED.*
      WHERE RequestID = @requestID AND RequesterID = @requesterID
    `);
  return result.recordset[0];
}

module.exports = {
  getAllRequests, getFilterOptions, getRequestById,
  getRequestsByUser, createRequest, updateRequest,
  deleteRequest, closeRequest
};
