const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const { validateLocation, DEFAULT_CITY } = require('../utils/lahoreGeo');

// Get all categories for dropdown
router.get('/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT CategoryID as id, Name as name FROM Categories ORDER BY Name');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get filter options for request forms/search
router.get('/filters', async (req, res) => {
  try {
    const pool = await poolPromise;
    const [categories, cities] = await Promise.all([
      pool.request().query('SELECT CategoryID as id, Name as name FROM Categories ORDER BY Name'),
      pool.request().query(`
        SELECT DISTINCT City as city
        FROM Requests
        WHERE City IS NOT NULL AND City <> ''
        ORDER BY City
      `),
    ]);

    res.json({
      categories: categories.recordset,
      cities: cities.recordset.map(r => r.city),
    });
  } catch (err) {
    console.error('Error fetching request filters:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET /requests/my — Get current user's own requests (MUST be before /:id)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('RequesterID', sql.Int, req.userID)
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
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching my requests:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET /requests/my-requests — Get current user's requests for My Requests Page (formatted for frontend)
router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, req.userID)
      .query(`
        SELECT 
          r.RequestID,
          r.Title,
          r.Description,
          r.Status,
          r.CategoryID,
          c.Name as CategoryName,
          r.MaxBudget as BudgetPerDay,
          r.StartDate,
          r.EndDate,
          r.CreatedAt,
          (SELECT COUNT(*) FROM Offers o WHERE o.RequestID = r.RequestID) as OffersCount
        FROM Requests r
        LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
        WHERE r.RequesterID = @UserID
        ORDER BY r.CreatedAt DESC
      `);
    
    console.log(`✅ [GET /my-requests] UserID: ${req.userID}, Found ${result.recordset.length} requests`);
    res.json({ data: result.recordset });
  } catch (err) {
    console.error('❌ Error fetching my requests:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all open requests (optional ?hasLocation=true for map)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const hasLocation = req.query.hasLocation === 'true';

    if (hasLocation) {
      const result = await pool.request().query(`
        SELECT
          r.RequestID as id,
          r.Title as title,
          r.Area as area,
          r.City as city,
          r.MaxBudget as maxBudget,
          r.Latitude as lat,
          r.Longitude as lng,
          r.CreatedAt as createdAt,
          c.Name as categoryName
        FROM Requests r
        LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
        WHERE r.Status = 'open'
          AND r.Latitude IS NOT NULL
          AND r.Longitude IS NOT NULL
        ORDER BY r.CreatedAt DESC
      `);
      return res.json(result.recordset.map((row) => ({
        ...row,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
      })));
    }

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
          r.City as city,
          r.Area as area,
          u.FullName as requesterName,
          u.UserID as requesterId,
          u.ProfilePic as requesterPic,
          c.Name as categoryName
        FROM Requests r
        LEFT JOIN Users u ON r.RequesterID = u.UserID
        LEFT JOIN Categories c ON r.CategoryID = c.CategoryID
        WHERE r.Status = 'open'
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
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('RequestID', sql.Int, requestId)
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
          r.Latitude as lat,
          r.Longitude as lng,
          u.FullName as requesterName,
          u.UserID as requesterId,
          u.ProfilePic as requesterPic,
          c.Name as categoryName,
          c.CategoryID as categoryId,
          c.CategoryID as categoryID
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

// Update a request (only owner can edit)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (!Number.isFinite(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const {
      title,
      description,
      categoryId,
      categoryID,
      startDate,
      endDate,
      maxBudget,
      city,
      area,
      lat,
      lng,
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    if (maxBudget !== undefined && maxBudget !== null && maxBudget !== '' && Number(maxBudget) < 0) {
      return res.status(400).json({ error: 'Budget cannot be negative' });
    }

    const location = validateLocation({ area, lat, lng, city });
    if (!location.valid) {
      return res.status(400).json({ error: location.errors[0] });
    }

    const pool = await poolPromise;
    const checkResult = await pool.request()
      .input('RequestID', sql.Int, requestId)
      .input('RequesterID', sql.Int, req.userID)
      .query('SELECT RequestID FROM Requests WHERE RequestID = @RequestID AND RequesterID = @RequesterID');

    if (checkResult.recordset.length === 0) {
      return res.status(403).json({ error: 'You can only edit your own requests' });
    }

    await pool.request()
      .input('RequestID', sql.Int, requestId)
      .input('Title', sql.NVarChar, title.trim())
      .input('Description', sql.NVarChar, description || '')
      .input('CategoryID', sql.Int, categoryId || categoryID || null)
      .input('StartDate', sql.Date, startDate)
      .input('EndDate', sql.Date, endDate)
      .input('MaxBudget', sql.Decimal(10, 2), maxBudget === '' ? null : maxBudget || null)
      .input('City', sql.NVarChar, location.city)
      .input('Area', sql.NVarChar, location.area)
      .input('Latitude', sql.Decimal(9, 6), location.lat)
      .input('Longitude', sql.Decimal(9, 6), location.lng)
      .query(`
        UPDATE Requests
        SET Title = @Title,
            Description = @Description,
            CategoryID = @CategoryID,
            StartDate = @StartDate,
            EndDate = @EndDate,
            MaxBudget = @MaxBudget,
            City = @City,
            Area = @Area,
            Latitude = @Latitude,
            Longitude = @Longitude,
            UpdatedAt = GETDATE()
        WHERE RequestID = @RequestID
      `);

    res.json({ message: 'Request updated successfully' });
  } catch (err) {
    console.error('Error updating request:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a request (only owner can delete)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const pool = await poolPromise;
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
    const validStatuses = ['open', 'fulfilled', 'closed', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid request status' });
    }
    const pool = await poolPromise;

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
    const { title, description, categoryId, startDate, endDate, maxBudget, city, area, lat, lng } = req.body;

    const location = validateLocation({ area, lat, lng, city });
    if (!location.valid) {
      return res.status(400).json({ error: location.errors[0] });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input('Title', sql.NVarChar, title)
      .input('Description', sql.NVarChar, description || '')
      .input('CategoryID', sql.Int, categoryId || null)
      .input('StartDate', sql.Date, startDate)
      .input('EndDate', sql.Date, endDate)
      .input('MaxBudget', sql.Decimal, maxBudget || null)
      .input('City', sql.NVarChar, location.city)
      .input('Area', sql.NVarChar, location.area)
      .input('Latitude', sql.Decimal(9, 6), location.lat)
      .input('Longitude', sql.Decimal(9, 6), location.lng)
      .input('RequesterID', sql.Int, req.userID)
      .query(`
        INSERT INTO Requests (Title, Description, CategoryID, StartDate, EndDate, MaxBudget, City, Area, Latitude, Longitude, RequesterID, Status)
        OUTPUT INSERTED.RequestID, INSERTED.Title, INSERTED.Area, INSERTED.MaxBudget, INSERTED.Latitude, INSERTED.Longitude
        VALUES (@Title, @Description, @CategoryID, @StartDate, @EndDate, @MaxBudget, @City, @Area, @Latitude, @Longitude, @RequesterID, 'open')
      `);

    const created = result.recordset[0];
    const requestId = created.RequestID;
    const mapPayload = {
      id: requestId,
      _id: requestId,
      title,
      area: location.area,
      city: DEFAULT_CITY,
      lat: location.lat,
      lng: location.lng,
      maxBudget: maxBudget ? parseFloat(maxBudget) : null,
      markerType: 'request',
      isNew: true,
    };

    const io = req.app.get('io');
    if (io) io.emit('new_request', mapPayload);

    res.status(201).json({ message: 'Request created', requestId, ...mapPayload });
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
