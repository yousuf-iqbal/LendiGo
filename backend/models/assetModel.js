const sql = require('mssql');

async function getAllAssets() {
    const pool = global.pool;
    const result = await pool.request()
        .query(`
            SELECT 
                a.AssetID as id,
                a.Title as title,
                a.PricePerDay as pricePerDay,
                a.City as city,
                a.Area as area,
                c.Name as category,
                u.FullName as ownerName
            FROM Assets a
            LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
            LEFT JOIN Users u ON a.OwnerID = u.UserID
            WHERE a.IsActive = 1
        `);
    return result.recordset;
}

async function getAssetById(id) {
    const pool = global.pool;
    const result = await pool.request()
        .input('AssetID', sql.Int, id)
        .query(`
            SELECT 
                a.AssetID as id,
                a.Title as title,
                a.Description as description,
                a.PricePerDay as pricePerDay,
                a.City as city,
                a.Area as area,
                c.Name as category,
                u.FullName as ownerName
            FROM Assets a
            LEFT JOIN Categories c ON a.CategoryID = c.CategoryID
            LEFT JOIN Users u ON a.OwnerID = u.UserID
            WHERE a.AssetID = @AssetID
        `);
    return result.recordset[0];
}

async function getAssetsByCategory(categoryId) {
    const pool = global.pool;
    const result = await pool.request()
        .input('CategoryID', sql.Int, categoryId)
        .query(`
            SELECT 
                a.AssetID as id,
                a.Title as title,
                a.PricePerDay as pricePerDay,
                a.City as city
            FROM Assets a
            WHERE a.CategoryID = @CategoryID AND a.IsActive = 1
        `);
    return result.recordset;
}

async function searchAssets(keyword) {
    const pool = global.pool;
    const result = await pool.request()
        .input('Keyword', sql.NVarChar, `%${keyword}%`)
        .query(`
            SELECT 
                a.AssetID as id,
                a.Title as title,
                a.PricePerDay as pricePerDay,
                a.City as city
            FROM Assets a
            WHERE a.IsActive = 1 
            AND a.Title LIKE @Keyword
        `);
    return result.recordset;
}

module.exports = { getAllAssets, getAssetById, getAssetsByCategory, searchAssets };
