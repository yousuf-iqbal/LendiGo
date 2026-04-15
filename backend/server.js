const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getPool } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const offerRoutes = require('./routes/offerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const assetRoutes = require('./routes/assetRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database connection
(async () => {
    try {
        global.pool = await getPool();
        console.log('? Database pool ready');
    } catch (err) {
        console.error('? Database failed:', err.message);
    }
})();

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/assets', assetRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Udhaari backend running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`?? Server running on port ${PORT}`));

