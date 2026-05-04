const bookingModel = require('../models/bookingModel');

async function getMyBookings(req, res) {
  try {
    const bookings = await bookingModel.getBookingsByUser(req.userID);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

async function getBookingById(req, res) {
  try {
    const booking = await bookingModel.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'booking not found' });
    if (booking.RenterID !== req.userID && booking.LenderID !== req.userID) {
      return res.status(403).json({ error: 'not authorized' });
    }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const result = await bookingModel.updateBookingStatus(req.params.id, req.userID, status);
    if (result.error) return res.status(result.code).json({ error: result.error });
    res.json({ booking: result.booking, message: `booking ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

async function acceptBooking(req, res) {
  try {
    const bookingID = req.params.id;
    const userID = req.userID;
    
    const result = await bookingModel.acceptBooking(bookingID, userID);
    
    if (result.error) {
      return res.status(result.code).json({ error: result.error });
    }
    
    res.json({ 
      message: 'Booking accepted', 
      booking: result.booking,
      nextStep: 'payment',
      paymentUrl: `/bookings/${bookingID}/payment`
    });
  } catch (err) {
    console.error('Accept booking error:', err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = { getMyBookings, getBookingById, updateStatus, acceptBooking };
