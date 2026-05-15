const express = require('express');
const { poolPromise, sql } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');
const walletModel = require('../models/walletModel');

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/summary', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Users) AS Users,
        (SELECT COUNT(*) FROM Assets) AS Assets,
        (SELECT COUNT(*) FROM Requests) AS Requests,
        (SELECT COUNT(*) FROM Offers) AS Offers,
        (SELECT COUNT(*) FROM Bookings) AS Bookings,
        (SELECT COUNT(*) FROM Reviews) AS Reviews,
        (SELECT COUNT(*) FROM Transactions) AS Transactions,
        (SELECT COALESCE(SUM(Balance), 0) FROM Wallets) AS WalletBalance
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Admin summary error:', err);
    res.status(500).json({ error: 'Failed to load summary' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserID, FullName, Email, Phone, City, Area, CNIC, IsVerified, IsBanned, Role, SignupMethod, CreatedAt
      FROM Users
      ORDER BY CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { fullName, email, phone, city, area, cnic, role = 'user', isVerified = true } = req.body;
    if (!fullName?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('FullName', sql.NVarChar, fullName.trim())
      .input('Email', sql.NVarChar, email.trim())
      .input('Phone', sql.NVarChar, phone || '')
      .input('City', sql.NVarChar, city || '')
      .input('Area', sql.NVarChar, area || null)
      .input('CNIC', sql.NVarChar, cnic || '')
      .input('Role', sql.NVarChar, role === 'admin' ? 'admin' : 'user')
      .input('IsVerified', sql.Bit, !!isVerified)
      .query(`
        INSERT INTO Users (FullName, Email, Phone, City, Area, CNIC, Role, IsVerified, SignupMethod)
        OUTPUT INSERTED.UserID
        VALUES (@FullName, @Email, @Phone, @City, @Area, @CNIC, @Role, @IsVerified, 'admin-created')
      `);

    await walletModel.createWallet(result.recordset[0].UserID, 5000);
    res.status(201).json({ message: 'User created', userId: result.recordset[0].UserID });
  } catch (err) {
    console.error('Admin create user error:', err);
    res.status(500).json({ error: err.number === 2627 ? 'Email already exists' : 'Failed to create user' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { fullName, phone, city, area, cnic, role, isVerified, isBanned } = req.body;
    if (!Number.isFinite(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const pool = await poolPromise;
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('FullName', sql.NVarChar, fullName || null)
      .input('Phone', sql.NVarChar, phone || null)
      .input('City', sql.NVarChar, city || null)
      .input('Area', sql.NVarChar, area || null)
      .input('CNIC', sql.NVarChar, cnic || null)
      .input('Role', sql.NVarChar, role === 'admin' ? 'admin' : 'user')
      .input('IsVerified', sql.Bit, isVerified === undefined ? null : !!isVerified)
      .input('IsBanned', sql.Bit, isBanned === undefined ? null : !!isBanned)
      .query(`
        UPDATE Users
        SET FullName = COALESCE(@FullName, FullName),
            Phone = COALESCE(@Phone, Phone),
            City = COALESCE(@City, City),
            Area = @Area,
            CNIC = COALESCE(@CNIC, CNIC),
            Role = COALESCE(@Role, Role),
            IsVerified = COALESCE(@IsVerified, IsVerified),
            IsBanned = COALESCE(@IsBanned, IsBanned)
        WHERE UserID = @UserID
      `);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (userId === req.userID) return res.status(400).json({ error: 'You cannot delete your own admin account' });

    const pool = await poolPromise;
    await pool.request().input('UserID', sql.Int, userId).query('DELETE FROM Users WHERE UserID = @UserID');
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Cannot delete user with related records. Ban the user instead.' });
  }
});

router.get('/categories', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query('SELECT CategoryID, Name, Description, IconURL FROM Categories ORDER BY Name');
  res.json(result.recordset);
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const pool = await poolPromise;
    const result = await pool.request()
      .input('Name', sql.NVarChar, name.trim())
      .input('Description', sql.NVarChar, description || null)
      .query('INSERT INTO Categories (Name, Description) OUTPUT INSERTED.* VALUES (@Name, @Description)');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req, res) => {
  const { name, description } = req.body;
  const pool = await poolPromise;
  await pool.request()
    .input('CategoryID', sql.Int, req.params.id)
    .input('Name', sql.NVarChar, name)
    .input('Description', sql.NVarChar, description || null)
    .query('UPDATE Categories SET Name = @Name, Description = @Description WHERE CategoryID = @CategoryID');
  res.json({ message: 'Category updated' });
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('CategoryID', sql.Int, req.params.id).query('DELETE FROM Categories WHERE CategoryID = @CategoryID');
    res.json({ message: 'Category deleted' });
  } catch {
    res.status(400).json({ error: 'Cannot delete category while records use it' });
  }
});

router.get('/assets', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT a.AssetID, a.Title, a.Description, a.PricePerDay, a.City, a.Area, a.IsActive, a.CreatedAt,
           u.FullName AS OwnerName, c.Name AS CategoryName
    FROM Assets a
    JOIN Users u ON u.UserID = a.OwnerID
    LEFT JOIN Categories c ON c.CategoryID = a.CategoryID
    ORDER BY a.CreatedAt DESC
  `);
  res.json(result.recordset);
});

router.put('/assets/:id', async (req, res) => {
  const { title, description, pricePerDay, city, area, isActive } = req.body;
  const pool = await poolPromise;
  await pool.request()
    .input('AssetID', sql.Int, req.params.id)
    .input('Title', sql.NVarChar, title || null)
    .input('Description', sql.NVarChar, description || null)
    .input('PricePerDay', sql.Decimal(10, 2), pricePerDay === undefined ? null : pricePerDay)
    .input('City', sql.NVarChar, city || null)
    .input('Area', sql.NVarChar, area || null)
    .input('IsActive', sql.Bit, isActive === undefined ? null : !!isActive)
    .query(`
      UPDATE Assets
      SET Title = COALESCE(@Title, Title),
          Description = COALESCE(@Description, Description),
          PricePerDay = COALESCE(@PricePerDay, PricePerDay),
          City = COALESCE(@City, City),
          Area = @Area,
          IsActive = COALESCE(@IsActive, IsActive)
      WHERE AssetID = @AssetID
    `);
  res.json({ message: 'Asset updated' });
});

router.delete('/assets/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('AssetID', sql.Int, req.params.id).query('DELETE FROM Assets WHERE AssetID = @AssetID');
    res.json({ message: 'Asset deleted' });
  } catch {
    res.status(400).json({ error: 'Cannot delete asset with related records' });
  }
});

router.get('/requests', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT r.RequestID, r.Title, r.Description, r.Status, r.MaxBudget, r.StartDate, r.EndDate, r.City, r.Area, r.CreatedAt,
           u.FullName AS RequesterName, c.Name AS CategoryName
    FROM Requests r
    JOIN Users u ON u.UserID = r.RequesterID
    LEFT JOIN Categories c ON c.CategoryID = r.CategoryID
    ORDER BY r.CreatedAt DESC
  `);
  res.json(result.recordset);
});

router.put('/requests/:id', async (req, res) => {
  const { title, status } = req.body;
  const pool = await poolPromise;
  await pool.request()
    .input('RequestID', sql.Int, req.params.id)
    .input('Title', sql.NVarChar, title || null)
    .input('Status', sql.NVarChar, status || null)
    .query('UPDATE Requests SET Title = COALESCE(@Title, Title), Status = COALESCE(@Status, Status), UpdatedAt = GETDATE() WHERE RequestID = @RequestID');
  res.json({ message: 'Request updated' });
});

router.delete('/requests/:id', async (req, res) => {
  const pool = await poolPromise;
  await pool.request().input('RequestID', sql.Int, req.params.id).query('DELETE FROM Requests WHERE RequestID = @RequestID');
  res.json({ message: 'Request deleted' });
});

router.get('/offers', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT o.OfferID, o.OfferedPrice, o.Status, o.CreatedAt, o.Message,
           r.Title AS RequestTitle, u.FullName AS LenderName
    FROM Offers o
    JOIN Requests r ON r.RequestID = o.RequestID
    JOIN Users u ON u.UserID = o.LenderID
    ORDER BY o.CreatedAt DESC
  `);
  res.json(result.recordset);
});

router.put('/offers/:id', async (req, res) => {
  const pool = await poolPromise;
  await pool.request()
    .input('OfferID', sql.Int, req.params.id)
    .input('Status', sql.NVarChar, req.body.status || null)
    .query('UPDATE Offers SET Status = @Status WHERE OfferID = @OfferID');
  res.json({ message: 'Offer updated' });
});

router.delete('/offers/:id', async (req, res) => {
  const pool = await poolPromise;
  await pool.request().input('OfferID', sql.Int, req.params.id).query('DELETE FROM Offers WHERE OfferID = @OfferID');
  res.json({ message: 'Offer deleted' });
});

router.get('/bookings', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT b.BookingID, b.Status, b.TotalPrice, b.IsPaid, b.StartDate, b.EndDate, b.CreatedAt,
           COALESCE(a.Title, r.Title, 'Booking') AS Title,
           renter.FullName AS RenterName,
           lender.FullName AS LenderName
    FROM Bookings b
    JOIN Users renter ON renter.UserID = b.RenterID
    JOIN Users lender ON lender.UserID = b.LenderID
    LEFT JOIN Assets a ON a.AssetID = b.AssetID
    LEFT JOIN Offers o ON o.OfferID = b.OfferID
    LEFT JOIN Requests r ON r.RequestID = o.RequestID
    ORDER BY b.CreatedAt DESC
  `);
  res.json(result.recordset);
});

router.put('/bookings/:id', async (req, res) => {
  const pool = await poolPromise;
  await pool.request()
    .input('BookingID', sql.Int, req.params.id)
    .input('Status', sql.NVarChar, req.body.status)
    .input('IsPaid', sql.Bit, req.body.isPaid === undefined ? null : !!req.body.isPaid)
    .query('UPDATE Bookings SET Status = COALESCE(@Status, Status), IsPaid = COALESCE(@IsPaid, IsPaid), UpdatedAt = GETDATE() WHERE BookingID = @BookingID');
  res.json({ message: 'Booking updated' });
});

router.delete('/bookings/:id', async (req, res) => {
  const pool = await poolPromise;
  await pool.request().input('BookingID', sql.Int, req.params.id).query('DELETE FROM Bookings WHERE BookingID = @BookingID');
  res.json({ message: 'Booking deleted' });
});

router.get('/reviews', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT r.ReviewID, r.Rating, r.Comment, r.CreatedAt,
           reviewer.FullName AS ReviewerName,
           reviewee.FullName AS RevieweeName,
           a.Title AS AssetTitle
    FROM Reviews r
    JOIN Users reviewer ON reviewer.UserID = r.ReviewerID
    JOIN Users reviewee ON reviewee.UserID = r.RevieweeID
    LEFT JOIN Assets a ON a.AssetID = r.AssetID
    ORDER BY r.CreatedAt DESC
  `);
  res.json(result.recordset);
});

router.delete('/reviews/:id', async (req, res) => {
  const pool = await poolPromise;
  await pool.request().input('ReviewID', sql.Int, req.params.id).query('DELETE FROM Reviews WHERE ReviewID = @ReviewID');
  res.json({ message: 'Review deleted' });
});

router.get('/transactions', async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT t.TransactionID, t.Amount, t.Type, t.CreatedAt, t.BookingID,
           uFrom.FullName AS FromUser, uTo.FullName AS ToUser
    FROM Transactions t
    LEFT JOIN Wallets wFrom ON wFrom.WalletID = t.FromWalletID
    LEFT JOIN Wallets wTo ON wTo.WalletID = t.ToWalletID
    LEFT JOIN Users uFrom ON uFrom.UserID = wFrom.UserID
    LEFT JOIN Users uTo ON uTo.UserID = wTo.UserID
    ORDER BY t.CreatedAt DESC
  `);
  res.json(result.recordset);
});

module.exports = router;
