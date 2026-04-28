const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { poolPromise } = require('../config/db'); // ✅ Import poolPromise

// Temporary placeholder routes
router.get('/borrower', verifyToken, (req, res) => {
    res.json({ message: 'Borrower dashboard - coming soon' });
});

router.get('/lender', verifyToken, (req, res) => {
    res.json({ message: 'Lender dashboard - coming soon' });
});

module.exports = router;
