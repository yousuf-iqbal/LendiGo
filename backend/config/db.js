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

async function runMigrations(pool) {
  try {
    const migrationQuery = `
      IF OBJECT_ID('Users', 'U') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'SignupMethod')
      BEGIN
        ALTER TABLE Users ADD SignupMethod NVARCHAR(50) DEFAULT 'email';
      END

      IF OBJECT_ID('Offers', 'U') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Offers' AND COLUMN_NAME = 'StartDate')
      BEGIN
        ALTER TABLE Offers ADD StartDate DATE NULL;
      END

      IF OBJECT_ID('Offers', 'U') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Offers' AND COLUMN_NAME = 'EndDate')
      BEGIN
        ALTER TABLE Offers ADD EndDate DATE NULL;
      END

      IF OBJECT_ID('Bookings', 'U') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Bookings' AND COLUMN_NAME = 'UpdatedAt')
      BEGIN
        ALTER TABLE Bookings ADD UpdatedAt DATETIME DEFAULT GETDATE();
      END

      IF OBJECT_ID('Requests', 'U') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Requests' AND COLUMN_NAME = 'UpdatedAt')
      BEGIN
        ALTER TABLE Requests ADD UpdatedAt DATETIME NULL;
      END

      IF OBJECT_ID('Notifications', 'U') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Notifications' AND COLUMN_NAME = 'RelatedID')
      BEGIN
        ALTER TABLE Notifications ADD RelatedID INT NULL;
      END

      IF OBJECT_ID('Notifications', 'U') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Notifications' AND COLUMN_NAME = 'RelatedType')
      BEGIN
        ALTER TABLE Notifications ADD RelatedType NVARCHAR(50) NULL;
      END

      IF OBJECT_ID('Notifications', 'U') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Notifications' AND COLUMN_NAME = 'ReadAt')
      BEGIN
        ALTER TABLE Notifications ADD ReadAt DATETIME NULL;
      END

      IF OBJECT_ID('AuditLogs', 'U') IS NULL
      BEGIN
        CREATE TABLE AuditLogs (
          AuditLogID INT PRIMARY KEY IDENTITY(1,1),
          UserID INT NULL,
          Action NVARCHAR(100) NOT NULL,
          Details NVARCHAR(MAX) NULL,
          IPAddress NVARCHAR(100) NULL,
          CreatedAt DATETIME DEFAULT GETDATE()
        );
      END

      IF OBJECT_ID('Messages', 'U') IS NULL
      BEGIN
        CREATE TABLE Messages (
          MessageID INT PRIMARY KEY IDENTITY(1,1),
          SenderID INT NOT NULL,
          ReceiverID INT NOT NULL,
          BookingID INT NULL,
          Body NVARCHAR(2000) NOT NULL,
          IsRead BIT DEFAULT 0,
          SentAt DATETIME DEFAULT GETDATE()
        );
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
