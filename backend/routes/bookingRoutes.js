const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const verifyToken = require('../middleware/verifyToken');

router.get('/my', verifyToken, bookingController.getMyBookings);
router.get('/:id', verifyToken, bookingController.getBookingById);
router.patch('/:id/status', verifyToken, bookingController.updateStatus);

module.exports = router;
