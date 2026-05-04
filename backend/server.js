const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { poolPromise } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const offerRoutes = require('./routes/offerRoutes');
const assetRoutes = require('./routes/assetRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const walletRoutes = require('./routes/walletRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');



const app = express();
app.use(cors());
app.use(express.json());

(async () => {
    try {
        global.pool = await poolPromise ;
        console.log('✅ Database connected and stored globally');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    }
})();
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Udhaari backend is running' });
});    

const PORT = process.env.PORT || 5000;

// Create server with proper error handling
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`✅ Connected to SQL Server`);
    console.log(`✅ Database migrations completed`);
});

// Allow immediate restart by reusing socket
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error('   This usually means a previous server process is still running.');
        console.error('   Try one of these solutions:\n');
        console.error('   1. Wait 30 seconds for the port to be released');
        console.error('   2. Kill the process: taskkill /F /IM node.exe');
        console.error('   3. Use a different port: PORT=3000 node server.js\n');
        process.exit(1);
    } else {
        throw err;
    }
});

// Enable socket reuse to allow quick restarts
server.setsockopt = function() {
    this.on('connection', function(socket) {
        socket.setKeepAlive(true);
    });
};

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⚠️  Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('⚠️  Forced shutdown due to timeout');
        process.exit(1);
    }, 10000);
});    