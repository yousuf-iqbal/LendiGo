const express  = require('express');
const router   = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { getBorrowerDashboard, getLenderDashboard } = require('../controllers/dashboardController');

// Both routes require auth
router.get('/borrower', verifyToken, getBorrowerDashboard);
router.get('/lender',   verifyToken, getLenderDashboard);

module.exports = router;