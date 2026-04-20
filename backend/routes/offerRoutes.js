const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

// Temporary placeholder routes
router.get('/', (req, res) => {
    res.json([]);
});

router.post('/', verifyToken, (req, res) => {
    res.json({ message: 'Offer created' });
});

module.exports = router;
