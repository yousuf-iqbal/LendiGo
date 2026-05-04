// backend/config/db.js
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { 
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  }
};

// ✅ Migration: Add StartDate and EndDate columns to Offers table if they don't exist
async function runMigrations(pool) {
  try {
    const migrationQuery = `
      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Offers' AND COLUMN_NAME = 'StartDate')
      BEGIN
        ALTER TABLE Offers ADD StartDate DATE NULL;
      END

      IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Offers' AND COLUMN_NAME = 'EndDate')
      BEGIN
        ALTER TABLE Offers ADD EndDate DATE NULL;
      END
    `;
    await pool.request().query(migrationQuery);
    console.log('✅ Database migrations completed');
  } catch (err) {
    console.error('⚠️  Migration warning:', err.message);
    // Don't fail startup for migration issues
  }
}

// ✅ Create pool promise that resolves to the connected pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(async pool => {
    console.log('✅ Connected to SQL Server');
    await runMigrations(pool); // Run migrations after connecting
    return pool; // Return the connected pool
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    throw err; // Re-throw so server knows connection failed
  });

// ✅ Export both sql and poolPromise
module.exports = { sql, poolPromise };