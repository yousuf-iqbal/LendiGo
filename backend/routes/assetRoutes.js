const express = require('express');
const router = express.Router();
const sql = require('mssql');
const verifyToken = require('../middleware/verifyToken');

// Get all assets (public)
router.get('/', async (req, res) => {
    try {
        const pool = global.pool;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const result = await pool.request()
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
            availability_status: a.IsActive == 1 || a.IsActive == true ? 'available' : 'unavailable'
        }));
        
        res.json(assets);
    } catch (err) {
        console.error('Error fetching assets:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get single asset
router.get('/:id', async (req, res) => {
    try {
        const assetId = parseInt(req.params.id);
        
        if (isNaN(assetId)) {
            return res.status(400).json({ error: 'Invalid asset ID' });
        }
        
        const pool = global.pool;
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const result = await pool.request()
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
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        
        const asset = result.recordset[0];
        const responseAsset = {
            asset_id: asset.asset_id,
            name: asset.name,
            description: asset.description,
            price_per_day: asset.price_per_day,
            location: asset.location,
            owner_id: asset.owner_id,
            category: asset.category,
            owner_name: asset.owner_name,
            availability_status: asset.IsActive == 1 || asset.IsActive == true ? 'available' : 'unavailable'
        };
        
        res.json(responseAsset);
    } catch (err) {
        console.error('Error fetching asset:', err);
        res.status(500).json({ error: err.message });
    }
});

// CREATE asset - POST
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, description, category, price_per_day, location, owner_id } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Asset name is required' });
        }
        
        const pool = global.pool;
        
        let categoryId = null;
        if (category) {
            const catResult = await pool.request()
                .input('Name', sql.NVarChar, category)
                .query('SELECT CategoryID FROM Categories WHERE Name = @Name');
            if (catResult.recordset.length > 0) {
                categoryId = catResult.recordset[0].CategoryID;
            }
        }
        
        const result = await pool.request()
            .input('Title', sql.NVarChar, name)
            .input('Description', sql.NVarChar, description || '')
            .input('CategoryID', sql.Int, categoryId)
            .input('PricePerDay', sql.Decimal, parseFloat(price_per_day) || 0)
            .input('City', sql.NVarChar, location || '')
            .input('OwnerID', sql.Int, parseInt(owner_id))
            .input('IsActive', sql.Bit, 1)
            .query(`
                INSERT INTO Assets (Title, Description, CategoryID, PricePerDay, City, OwnerID, IsActive)
                OUTPUT INSERTED.AssetID
                VALUES (@Title, @Description, @CategoryID, @PricePerDay, @City, @OwnerID, @IsActive)
            `);
        
        res.status(201).json({ 
            message: 'Asset created successfully', 
            asset_id: result.recordset[0].AssetID 
        });
    } catch (err) {
        console.error('Error creating asset:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update asset availability
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { isActive } = req.body;
        const pool = global.pool;
        
        await pool.request()
            .input('AssetId', sql.Int, req.params.id)
            .input('IsActive', sql.Bit, isActive)
            .query('UPDATE Assets SET IsActive = @IsActive WHERE AssetID = @AssetId');
        
        res.json({ message: 'Asset updated' });
    } catch (err) {
        console.error('Error updating asset:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete asset
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const pool = global.pool;
        
        await pool.request()
            .input('AssetId', sql.Int, req.params.id)
            .query('DELETE FROM Assets WHERE AssetID = @AssetId');
        
        res.json({ message: 'Asset deleted' });
    } catch (err) {
        console.error('Error deleting asset:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
