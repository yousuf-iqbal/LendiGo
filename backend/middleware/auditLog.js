const sql = require('mssql');

const auditLog = async (req, action, details) => {
  try {
    const pool = global.pool;
    await pool.request()
      .input('UserID', sql.Int, req.userID || null)
      .input('Action', sql.NVarChar, action)
      .input('Details', sql.NVarChar, JSON.stringify(details))
      .input('IPAddress', sql.NVarChar, req.ip)
      .query(`
        INSERT INTO AuditLogs (UserID, Action, Details, IPAddress, CreatedAt)
        VALUES (@UserID, @Action, @Details, @IPAddress, GETDATE())
      `);
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

module.exports = auditLog;