const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

// Get user profile
router.get('/me', verifyToken, (req, res) => {
    res.json({ message: 'Profile endpoint', user: req.user });
});

// Update profile
router.put('/', verifyToken, (req, res) => {
    res.json({ message: 'Profile updated' });
});

// Get public profile
router.get('/:userId', (req, res) => {
    res.json({ message: `Public profile for user ${req.params.userId}` });
});

module.exports = router;
