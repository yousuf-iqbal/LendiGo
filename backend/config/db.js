const sql = require('mssql');

const dbConfig = {
    server: 'localhost',
    port: 1433,
    user: 'sa',
    password: 'Admin123!',
    database: 'UdhaariDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
};

let pool = null;

async function poolPromise() {
    if (pool && pool.connected) {
        return pool;
    }
    
    try {
        console.log('Connecting to SQL Server...');
        pool = await sql.connect(dbConfig);
        console.log('✅ SQL Server connected');
        return pool;
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        throw err;
    }
}

module.exports = { poolPromise, sql };
