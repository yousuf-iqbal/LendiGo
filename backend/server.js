const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

// Add fetch polyfill for Node.js (if Node version < 18)
const fetch = require('node-fetch');
global.fetch = fetch;

const { poolPromise, sql } = require('./config/db');
const { admin } = require('./config/firebase');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const offerRoutes = require('./routes/offerRoutes');
const assetRoutes = require('./routes/assetRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const walletRoutes = require('./routes/walletRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mapRoutes = require('./routes/mapRoutes');

const app = express();
app.use(cors());
app.use(express.json());

(async () => {
  try {
    global.pool = await poolPromise;
    console.log('Database connected and stored globally');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
})();

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/map', mapRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Udhaari backend is running' });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

async function getSocketUser(token) {
  const decodedToken = await admin.auth().verifyIdToken(token);
  const pool = await poolPromise;
  const result = await pool.request()
    .input('Email', sql.NVarChar, decodedToken.email)
    .query('SELECT UserID, FullName, Email, Role, IsBanned FROM Users WHERE Email = @Email');

  const user = result.recordset[0];
  if (!user || user.IsBanned) return null;
  return user;
}

async function getBookingParticipant(pool, bookingID, userID) {
  const result = await pool.request()
    .input('BookingID', sql.Int, bookingID)
    .input('UserID', sql.Int, userID)
    .query(`
      SELECT BookingID, RenterID, LenderID
      FROM Bookings
      WHERE BookingID = @BookingID AND (RenterID = @UserID OR LenderID = @UserID)
    `);
  return result.recordset[0];
}

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));

    const user = await getSocketUser(token);
    if (!user) return next(new Error('User not found or banned'));

    socket.userID = user.UserID;
    socket.userName = user.FullName;
    socket.userRole = user.Role || 'user';
    next();
  } catch {
    next(new Error('Socket authentication failed'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userID}`);

  socket.on('join_booking', async (bookingID, ack) => {
    try {
      const parsedBookingID = parseInt(bookingID, 10);
      const pool = await poolPromise;
      const booking = await getBookingParticipant(pool, parsedBookingID, socket.userID);
      if (!booking) throw new Error('Not authorized for this booking chat');

      socket.join(`booking:${parsedBookingID}`);
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('send_message', async (payload, ack) => {
    try {
      const bookingID = parseInt(payload?.bookingID, 10);
      const body = String(payload?.body || '').trim();
      if (!Number.isFinite(bookingID)) throw new Error('Invalid booking ID');
      if (!body) throw new Error('Message cannot be empty');
      if (body.length > 2000) throw new Error('Message is too long');

      const pool = await poolPromise;
      const booking = await getBookingParticipant(pool, bookingID, socket.userID);
      if (!booking) throw new Error('Not authorized for this booking chat');

      const receiverID = Number(booking.RenterID) === Number(socket.userID)
        ? booking.LenderID
        : booking.RenterID;

      const result = await pool.request()
        .input('BookingID', sql.Int, bookingID)
        .input('SenderID', sql.Int, socket.userID)
        .input('ReceiverID', sql.Int, receiverID)
        .input('Body', sql.NVarChar, body)
        .query(`
          INSERT INTO Messages (BookingID, SenderID, ReceiverID, Body, IsRead, SentAt)
          OUTPUT INSERTED.MessageID, INSERTED.BookingID, INSERTED.SenderID, INSERTED.ReceiverID,
                 INSERTED.Body, INSERTED.IsRead, INSERTED.SentAt
          VALUES (@BookingID, @SenderID, @ReceiverID, @Body, 0, GETDATE())
        `);

      const message = {
        ...result.recordset[0],
        SenderName: socket.userName,
      };

      io.to(`booking:${bookingID}`).emit('message:new', message);
      io.to(`user:${receiverID}`).emit('message:notification', message);
      ack?.({ ok: true, message });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });
});

app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
  throw err;
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
});