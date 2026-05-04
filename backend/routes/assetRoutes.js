const express = require('express');
const router = express.Router();
const sql = require('mssql');
const verifyToken = require('../middleware/verifyToken');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Configure Cloudinary storage for image uploads
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'udhaari/assets',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }),
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
}).array('images', 5); // Allow up to 5 images

// Add this NEW route BEFORE the existing GET / route:

// GET /api/assets/my - Fetch ONLY current user's assets (including inactive)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const pool = global.pool;
    if (!pool) return res.status(500).json({ error: 'Database not connected' });

    const result = await pool.request()
      .input('OwnerId', sql.Int, req.userID)
      .query(`
        SELECT 
          a.AssetID as asset_id,
          a.Title as name,
          a.Description as description,
          a.PricePerDay as price_per_day,
          a.City as location,
          a.IsActive,
          a.OwnerID as owner_id,
          c.Name as category,
          u.FullName as owner_name,
          (SELECT TOP 1 ImageURL FROM AssetImages WHERE AssetID = a.AssetID AND IsPrimary = 1) as primary_image
        FROM Assets a
        LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
        LEFT JOIN Users u ON a.OwnerID = u.UserID
        WHERE a.OwnerID = @OwnerId  -- ✅ No IsActive filter!
        ORDER BY a.CreatedAt DESC
      `);
    
    const assets = result.recordset.map(a => ({
      asset_id: a.asset_id,
      name: a.name,
      description: a.description,
      price_per_day: a.price_per_day,
      location: a.location,
      owner_id: a.owner_id,
      category: a.category,
      owner_name: a.owner_name,
      primary_image: a.primary_image,
      availability_status: a.IsActive == 1 || a.IsActive == true ? 'available' : 'unavailable'
    }));
    
    res.json(assets);
  } catch (err) {
    console.error('Error fetching user assets:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets - Fetch all active assets with images
router.get('/', async (req, res) => {
  try {
    const pool = global.pool;
    if (!pool) return res.status(500).json({ error: 'Database not connected' });

    const result = await pool.request().query(`
      SELECT 
        a.AssetID as asset_id,
        a.Title as name,
        a.Description as description,
        a.PricePerDay as price_per_day,
        a.City as location,
        a.IsActive,
        a.OwnerID as owner_id,
        c.Name as category,
        u.FullName as owner_name,
        (SELECT TOP 1 ImageURL FROM AssetImages WHERE AssetID = a.AssetID AND IsPrimary = 1) as primary_image
      FROM Assets a
      LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
      LEFT JOIN Users u ON a.OwnerID = u.UserID
      WHERE a.IsActive = 1
      ORDER BY a.CreatedAt DESC
    `);
    
    const assets = result.recordset.map(a => ({
      asset_id: a.asset_id,
      name: a.name,
      description: a.description,
      price_per_day: a.price_per_day,
      location: a.location,
      owner_id: a.owner_id,
      category: a.category,
      owner_name: a.owner_name,
      primary_image: a.primary_image,
      availability_status: a.IsActive == 1 || a.IsActive == true ? 'available' : 'unavailable'
    }));
    
    res.json(assets);
  } catch (err) {
    console.error('Error fetching assets:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/:id - Fetch single asset with ALL images
router.get('/:id', async (req, res) => {
  try {
    const assetId = parseInt(req.params.id);
    if (isNaN(assetId)) return res.status(400).json({ error: 'Invalid asset ID' });
    
    const pool = global.pool;
    if (!pool) return res.status(500).json({ error: 'Database not connected' });

    const [assetResult, imagesResult] = await Promise.all([
      pool.request()
        .input('AssetId', sql.Int, assetId)
        .query(`
          SELECT 
            a.AssetID as asset_id,
            a.Title as name,
            a.Description as description,
            a.PricePerDay as price_per_day,
            a.City as location,
            a.IsActive,
            a.OwnerID as owner_id,
            c.Name as category,
            u.FullName as owner_name
          FROM Assets a
          LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
          LEFT JOIN Users u ON a.OwnerID = u.UserID
          WHERE a.AssetID = @AssetId
        `),
      pool.request()
        .input('AssetId', sql.Int, assetId)
        .query('SELECT ImageURL, IsPrimary FROM AssetImages WHERE AssetID = @AssetId ORDER BY IsPrimary DESC, ImageID ASC')
    ]);

    if (assetResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = assetResult.recordset[0];
    res.json({
      asset_id: asset.asset_id,
      name: asset.name,
      description: asset.description,
      price_per_day: asset.price_per_day,
      location: asset.location,
      owner_id: asset.owner_id,
      category: asset.category,
      owner_name: asset.owner_name,
      availability_status: asset.IsActive == 1 || asset.IsActive == true ? 'available' : 'unavailable',
      images: imagesResult.recordset
    });

  } catch (err) {
    console.error('Error fetching asset:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets - Create new asset WITH images
router.post('/', verifyToken, upload, async (req, res) => {
  try {
    const { name, description, category, price_per_day, location } = req.body;
    const pool = global.pool;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Asset name is required' });
    }
    if (!price_per_day || parseFloat(price_per_day) < 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ error: 'Location is required' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    // Find or create category
    let categoryId = null;
    if (category) {
      const catResult = await pool.request()
        .input('Name', sql.NVarChar, category)
        .query('SELECT CategoryID FROM Categories WHERE Name = @Name');
      
      if (catResult.recordset.length > 0) {
        categoryId = catResult.recordset[0].CategoryID;
      } else {
        // Auto-create category if doesn't exist
        const newCat = await pool.request()
          .input('Name', sql.NVarChar, category)
          .query('INSERT INTO Categories (Name) OUTPUT INSERTED.CategoryID VALUES (@Name)');
        categoryId = newCat.recordset[0].CategoryID;
      }
    }

    // Create asset
    const assetResult = await pool.request()
      .input('Title', sql.NVarChar, name.trim())
      .input('Description', sql.NVarChar, description || '')
      .input('CategoryID', sql.Int, categoryId)
      .input('PricePerDay', sql.Decimal, parseFloat(price_per_day))
      .input('City', sql.NVarChar, location.trim())
      .input('OwnerID', sql.Int, req.userID)
      .input('IsActive', sql.Bit, 1)
      .query(`
        INSERT INTO Assets (Title, Description, CategoryID, PricePerDay, City, OwnerID, IsActive)
        OUTPUT INSERTED.AssetID
        VALUES (@Title, @Description, @CategoryID, @PricePerDay, @City, @OwnerID, @IsActive)
      `);

    const assetId = assetResult.recordset[0].AssetID;

    // Save images to AssetImages table
    const imagePromises = req.files.map((file, index) => 
      pool.request()
        .input('AssetID', sql.Int, assetId)
        .input('ImageURL', sql.NVarChar, file.path)
        .input('IsPrimary', sql.Bit, index === 0 ? 1 : 0)
        .query('INSERT INTO AssetImages (AssetID, ImageURL, IsPrimary) VALUES (@AssetID, @ImageURL, @IsPrimary)')
    );
    await Promise.all(imagePromises);

    res.status(201).json({ 
      message: 'Asset created successfully', 
      asset_id: assetId,
      images: req.files.map(f => f.path)
    });

  } catch (err) {
    console.error('Error creating asset:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/assets/:id - Edit/Update asset details (owner only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, category, price_per_day, location } = req.body;
    const assetId = parseInt(req.params.id);
    const pool = global.pool;

    // Check ownership
    const checkResult = await pool.request()
      .input('AssetId', sql.Int, assetId)
      .input('OwnerId', sql.Int, req.userID)
      .query('SELECT AssetID FROM Assets WHERE AssetID = @AssetId AND OwnerID = @OwnerId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(403).json({ error: 'You can only edit your own assets' });
    }

    // Find or create category
    let categoryId = null;
    if (category) {
      const catResult = await pool.request()
        .input('Name', sql.NVarChar, category)
        .query('SELECT CategoryID FROM Categories WHERE Name = @Name');
      if (catResult.recordset.length > 0) {
        categoryId = catResult.recordset[0].CategoryID;
      }
    }

    // Update asset
    await pool.request()
      .input('AssetId', sql.Int, assetId)
      .input('Title', sql.NVarChar, name?.trim())
      .input('Description', sql.NVarChar, description || '')
      .input('CategoryID', sql.Int, categoryId)
      .input('PricePerDay', sql.Decimal, parseFloat(price_per_day) || 0)
      .input('City', sql.NVarChar, location?.trim())
      .query(`
        UPDATE Assets 
        SET Title = ISNULL(@Title, Title),
            Description = ISNULL(@Description, Description),
            CategoryID = ISNULL(@CategoryID, CategoryID),
            PricePerDay = ISNULL(@PricePerDay, PricePerDay),
            City = ISNULL(@City, City)
        WHERE AssetID = @AssetId
      `);

    res.json({ message: 'Asset updated successfully' });

  } catch (err) {
    console.error('Error updating asset:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/assets/:id - Toggle availability OR hide asset (owner only)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { isActive, isHidden } = req.body; // Can update either or both
    const assetId = parseInt(req.params.id);
    const pool = global.pool;

    // Check ownership
    const checkResult = await pool.request()
      .input('AssetId', sql.Int, assetId)
      .input('OwnerId', sql.Int, req.userID)
      .query('SELECT AssetID FROM Assets WHERE AssetID = @AssetId AND OwnerID = @OwnerId');
    
    if (checkResult.recordset.length === 0) {
      return res.status(403).json({ error: 'You can only modify your own assets' });
    }

    const updates = [];
    const inputs = { AssetId: assetId };

    if (isActive !== undefined) {
      updates.push('IsActive = @IsActive');
      inputs.IsActive = isActive;
    }

    const request = pool.request().input('AssetId', sql.Int, assetId);
    Object.entries(inputs).forEach(([key, value]) => {
      if (key !== 'AssetId') {
        request.input(key, key.includes('Id') ? sql.Int : sql.Bit, value);
      }
    });

    await request.query(`
      UPDATE Assets SET ${updates.join(', ')}
      WHERE AssetID = @AssetId
    `);

    res.json({ message: 'Asset updated' });

  } catch (err) {
    console.error('Error updating asset:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/assets/:id - Delete asset (owner only)
// DELETE /api/assets/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const pool = global.pool;
    await pool.request()
      .input('AssetId', sql.Int, req.params.id)
      .query('DELETE FROM Assets WHERE AssetID = @AssetId');

    res.json({ message: 'Asset deleted successfully' });

  } catch (err) {
    console.error('Error deleting asset:', err);
    
    // ✅ Catch Foreign Key Constraint Error (Error 547)
    if (err.number === 547) {
      return res.status(400).json({ 
        error: 'Cannot delete asset. It has booking history attached to it.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to delete asset.' });
  }
});
module.exports = router;