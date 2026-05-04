const offerModel = require('../models/offerModel');
const bookingModel = require('../models/bookingModel');
const requestModel = require('../models/requestModel');
const { poolPromise, sql } = require('../config/db'); // ✅ Correct import

// Make notificationModel optional (won't crash if missing)
let notificationModel;
try {
  notificationModel = require('../models/notificationModel');
} catch (err) {
  console.warn('⚠️ Notification model not found - notifications disabled');
  notificationModel = {
    createNotification: async () => { /* noop */ }
  };
}

// Helper to safely parse IDs from URL params or body
const toInt = (val) => {
  const num = parseInt(val, 10);
  return Number.isFinite(num) ? num : null;
};

// ── CREATE ────────────────────────────────────────────────────────────────────
async function createOffer(req, res) {
  try {
    const { requestId, assetId, offeredPrice, message } = req.body;

    const reqIdInt = toInt(requestId);
    if (!reqIdInt) return res.status(400).json({ error: 'Valid Request ID is required' });
    if (!offeredPrice || parseFloat(offeredPrice) <= 0) {
      return res.status(400).json({ error: 'Valid offer price is required' });
    }

    const offerId = await offerModel.createOffer({
      requestId: reqIdInt,
      assetId: assetId ? toInt(assetId) : null,
      offeredPrice: parseFloat(offeredPrice),
      message: message?.trim(),
    }, req.userID);

    // Notify requester (optional - won't break if fails)
    try {
      const created = await offerModel.getOfferById(offerId);
      if (created && created.RequesterID) {
        await notificationModel.createNotification({
          userId: created.RequesterID,
          title: 'New Offer Received',
          message: `You received a new offer for your request.`,
          type: 'offer',
          relatedId: reqIdInt,
          relatedType: 'request'
        });
      }
    } catch (notifErr) {
      console.warn('Failed to send notification:', notifErr.message);
    }

    res.status(201).json({
      message: 'Offer submitted successfully',
      offerId,
      offer: { offeredPrice, message }
    });
  } catch (err) {
    console.error('Create offer error:', err);
    if (err.message.includes('already made an offer')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to submit offer' });
  }
}

// ── READ ─────────────────────────────────────────────────────────────────────
async function getOffersForRequest(req, res) {
  try {
    const reqIdInt = toInt(req.params.requestId);
    if (!reqIdInt) return res.status(400).json({ error: 'Invalid request ID' });
    const offers = await offerModel.getOffersByRequest(reqIdInt);
    res.json(offers);
  } catch (err) {
    console.error('Get offers error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch offers' });
  }
}

async function getMyOffers(req, res) {
  try {
    const offers = await offerModel.getOffersByLender(req.userID);
    res.json(offers);
  } catch (err) {
    console.error('Get my offers error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch your offers' });
  }
}

async function getIncomingOffers(req, res) {
  try {
    const offers = await offerModel.getIncomingOffersByRequester(req.userID);
    res.json(offers);
  } catch (err) {
    console.error('Get incoming offers error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch incoming offers' });
  }
}

// ── ACCEPT OFFER (Creates Booking) ───────────────────────────────────────────
async function acceptOffer(req, res) {
  try {
    const offerIdInt = toInt(req.params.offerId);
    if (!offerIdInt) return res.status(400).json({ error: 'Invalid offer ID' });
    const { startDate, endDate } = req.body;

    const offer = await offerModel.getOfferById(offerIdInt);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.Status !== 'pending') {
      return res.status(400).json({ error: 'This offer is no longer pending' });
    }

    // Casing-safe requester ID check
    const offerRequesterId = offer.RequesterID ?? offer.requesterId;
    if (Number(offerRequesterId) !== Number(req.userID)) {
      return res.status(403).json({ error: 'Unauthorized: You can only accept offers for your own requests' });
    }

    // Update offer status
    await offerModel.updateOfferStatus(offerIdInt, 'accepted', req.userID);

    // Create booking using poolPromise correctly (await the promise)
    const pool = await poolPromise;
    const bookingResult = await pool.request()
      .input('AssetID', sql.Int, offer.AssetID || null)
      .input('RenterID', sql.Int, req.userID) // Requester becomes renter
      .input('LenderID', sql.Int, offer.LenderID ?? offer.lenderId)
      .input('StartDate', sql.Date, offer.StartDate ?? offer.startDate)
      .input('EndDate', sql.Date, offer.EndDate ?? offer.endDate)
      .input('TotalPrice', sql.Decimal, offer.OfferedPrice)
      .input('Status', sql.NVarChar, 'pending')
      .input('OfferID', sql.Int, offerIdInt)
      .query(`
        INSERT INTO Bookings (AssetID, RenterID, LenderID, StartDate, EndDate, TotalPrice, Status, OfferID)
        OUTPUT INSERTED.BookingID
        VALUES (@AssetID, @RenterID, @LenderID, @StartDate, @EndDate, @TotalPrice, @Status, @OfferID)
      `);

    const bookingId = bookingResult.recordset[0].BookingID;

    // Notify lender (optional)
    try {
      await notificationModel.createNotification({
        userId: offer.LenderID,
        title: 'Offer Accepted!',
        message: `Your offer for "${offer.RequestTitle}" was accepted. Proceed to payment.`,
        type: 'booking',
        relatedId: bookingId,
        relatedType: 'booking'
      });
    } catch (notifErr) {
      console.warn('Failed to send notification:', notifErr.message);
    }

    res.json({
      message: 'Offer accepted. Booking created.',
      bookingId,
      nextStep: 'payment',
      paymentUrl: `/bookings/${bookingId}/payment`
    });
  } catch (err) {
    console.error('Accept offer error:', err);
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to accept offer' });
  }
}

// ── REJECT OFFER ─────────────────────────────────────────────────────────────
async function rejectOffer(req, res) {
  try {
    const offerIdInt = toInt(req.params.offerId);
    if (!offerIdInt) return res.status(400).json({ error: 'Invalid offer ID' });

    // Verify ownership before rejecting
    const offer = await offerModel.getOfferById(offerIdInt);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const offerRequesterId = offer.RequesterID ?? offer.requesterId;
    if (Number(offerRequesterId) !== Number(req.userID)) {
      return res.status(403).json({ error: 'Unauthorized: You can only reject offers for your own requests' });
    }

    await offerModel.updateOfferStatus(offerIdInt, 'declined', req.userID);

    // Notify lender (optional)
    try {
      await notificationModel.createNotification({
        userId: offer.LenderID,
        title: 'Offer Declined',
        message: `Your offer for "${offer.RequestTitle}" was declined.`,
        type: 'offer',
        relatedId: offerIdInt,
        relatedType: 'offer'
      });
    } catch (notifErr) {
      console.warn('Failed to send notification:', notifErr.message);
    }

    res.json({ message: 'Offer declined' });
  } catch (err) {
    console.error('Reject offer error:', err);
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to decline offer' });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
async function deleteOffer(req, res) {
  try {
    const offerIdInt = toInt(req.params.id);
    if (!offerIdInt) return res.status(400).json({ error: 'Invalid offer ID' });
    await offerModel.deleteOffer(offerIdInt, req.userID);
    res.json({ message: 'Offer deleted successfully' });
  } catch (err) {
    console.error('Delete offer error:', err);
    if (err.message.includes('Unauthorized')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to delete offer' });
  }
}

module.exports = {
  createOffer,
  getOffersForRequest,
  getMyOffers,
  getIncomingOffers,
  acceptOffer,
  rejectOffer,
  deleteOffer
};