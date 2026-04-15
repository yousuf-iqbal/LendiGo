const sql = require('mssql');

// Try different connection configs
const configs = [
    {
        name: "Option 1: Localhost with instance",
        config: {
            server: 'localhost',
            user: 'sa',
            password: 'Admin123!',
            database: 'UdhaariDB',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                instanceName: 'SQLSERVER2025'
            }
        }
    },
    {
        name: "Option 2: Full server name with instance",
        config: {
            server: 'DESKTOP-AJ1U7KD',
            user: 'sa',
            password: 'Admin123!',
            database: 'UdhaariDB',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                instanceName: 'SQLSERVER2025'
            }
        }
    },
    {
        name: "Option 3: Server with backslash",
        config: {
            server: 'localhost\\SQLSERVER2025',
            user: 'sa',
            password: 'Admin123!',
            database: 'UdhaariDB',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        }
    },
    {
        name: "Option 4: Server with port",
        config: {
            server: 'localhost',
            port: 1433,
            user: 'sa',
            password: 'Admin123!',
            database: 'UdhaariDB',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        }
    }
];

async function testConnection() {
    console.log('Testing SQL Server connections...\n');
    
    for (const item of configs) {
        try {
            console.log(`Trying ${item.name}...`);
            await sql.connect(item.config);
            console.log(`SUCCESS with ${item.name}!\n`);
            
            const result = await sql.query`SELECT COUNT(*) as UserCount FROM Users`;
            console.log(`Users in database: ${result.recordset[0].UserCount}`);
            
            await sql.close();
            console.log('\nConnection working! Use this config in your app.');
            return;
        } catch (err) {
            console.log(`Failed: ${err.message}\n`);
        }
    }
    
    console.log('All connection attempts failed.');
}

testConnection();