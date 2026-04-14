// backend/routes/ratingRoutes.js

const express     = require('express');
const router      = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  submitRating,
  getUserReviews,
  checkReviewed,
  getLeaderboard,
} = require('../controllers/ratingController');

router.get('/leaderboard',      getLeaderboard);
router.get('/user/:userID',     getUserReviews);
router.get('/check/:bookingID', verifyToken, checkReviewed);
router.post('/',                verifyToken, submitRating);

module.exports = router;