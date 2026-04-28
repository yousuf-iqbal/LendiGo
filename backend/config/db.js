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

// ✅ Create pool promise that resolves to the connected pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to SQL Server');
    return pool; // Return the connected pool
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    throw err; // Re-throw so server knows connection failed
  });

// ✅ Export both sql and poolPromise
module.exports = { sql, poolPromise };