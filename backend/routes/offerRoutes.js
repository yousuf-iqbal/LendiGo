const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  createOffer,
  getOffersForRequest,
  getMyOffers,
  acceptOffer,
  rejectOffer,
    deleteOffer,
  getIncomingOffers
} = require('../controllers/offerController');

// Create new offer (lender)

router.post('/', verifyToken, createOffer);

// Get all offers for a specific request (anyone can view)
router.get('/request/:requestId', getOffersForRequest);

// Get offers made by current user (lender view)
router.get('/my', verifyToken, getMyOffers);
// Get all offers received by current user (requester view)
router.get('/incoming', verifyToken, getIncomingOffers);
// Get offers received by current user (requester view)


// Accept an offer (requester only) - creates booking
router.patch('/:offerId/accept', verifyToken, acceptOffer);

// Reject an offer (requester only)
router.patch('/:offerId/reject', verifyToken, rejectOffer);

// Delete own offer (lender only)
router.delete('/:id', verifyToken, deleteOffer);


module.exports = router;