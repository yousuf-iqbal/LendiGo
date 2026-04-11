// backend/controllers/ratingController.js

const ratingModel = require('../models/ratingModel');

async function submitRating(req, res) {
  try {
    const { bookingID, revieweeID, rating, comment } = req.body;

    if (!bookingID || !revieweeID || !rating)
      return res.status(400).json({ error: 'bookingID, revieweeID and rating are required.' });

    if (isNaN(rating) || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'rating must be between 1 and 5.' });

    const result = await ratingModel.createRating(
      Number(bookingID),
      req.userID,
      Number(revieweeID),
      Number(rating),
      comment || null
    );

    if (result.error)
      return res.status(result.code).json({ error: result.error });

    res.status(201).json({ message: 'review submitted successfully.', rating: result.rating });
  } catch (err) {
    console.error('submitRating error:', err.message || err);
    res.status(500).json({ error: 'could not submit review.' });
  }
}

async function getUserReviews(req, res) {
  try {
    const userID = Number(req.params.userID);
    if (isNaN(userID))
      return res.status(400).json({ error: 'invalid userID.' });

    const [reviews, summary] = await Promise.all([
      ratingModel.getRatingsForUser(userID),
      ratingModel.getUserRatingSummary(userID),
    ]);

    res.json({
      userID,
      totalReviews: summary.TotalReviews,
      averageScore: summary.AverageScore ? Number(summary.AverageScore.toFixed(1)) : 0,
      reviews,
    });
  } catch (err) {
    console.error('getUserReviews error:', err.message || err);
    res.status(500).json({ error: 'could not fetch reviews.' });
  }
}

async function checkReviewed(req, res) {
  try {
    const bookingID = Number(req.params.bookingID);
    if (isNaN(bookingID))
      return res.status(400).json({ error: 'invalid bookingID.' });

    const reviewed = await ratingModel.hasUserReviewed(bookingID, req.userID);
    res.json({ reviewed });
  } catch (err) {
    console.error('checkReviewed error:', err.message || err);
    res.status(500).json({ error: 'could not check review status.' });
  }
}

async function getLeaderboard(req, res) {
  try {
    const leaderboard = await ratingModel.getLeaderboard();
    res.json(leaderboard);
  } catch (err) {
    console.error('getLeaderboard error:', err.message || err);
    res.status(500).json({ error: 'could not fetch leaderboard.' });
  }
}

module.exports = { submitRating, getUserReviews, checkReviewed, getLeaderboard };