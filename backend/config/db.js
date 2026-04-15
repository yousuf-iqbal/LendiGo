const sql = require('mssql');

const config = {
    server: 'localhost',
    port: 1433,
    user: 'sa',
    password: 'Admin123!',
    database: 'UdhaariDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

let pool = null;

async function getPool() {
    if (pool && pool.connected) {
        return pool;
    }
    
    try {
        pool = await sql.connect(config);
        console.log('✅ SQL Server connected');
        return pool;
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        throw err;
    }
}

module.exports = { getPool, sql };
