// backend/routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const verifyToken = require('../middleware/verifyToken');

// All wallet routes are protected
router.use(verifyToken);

// Get wallet balance
router.get('/balance', walletController.getBalance);

// Get transaction history
router.get('/transactions', walletController.getTransactions);

// Top-up wallet
router.post('/topup', walletController.topUp);

// Pay for booking (challan flow)
router.post('/pay-booking', walletController.payBooking);

module.exports = router; // ✅ Export the router, not an object