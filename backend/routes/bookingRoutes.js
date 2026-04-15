const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const bookingController = require('../controllers/bookingController');

router.get('/', verifyToken, bookingController.getMyBookings);
router.get('/:id', verifyToken, bookingController.getBookingDetail);
router.patch('/:id/status', verifyToken, bookingController.updateBookingStatus);
router.patch('/:id/paid', verifyToken, bookingController.markBookingPaid);

module.exports = router;
