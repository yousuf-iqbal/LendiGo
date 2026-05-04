const { 
  getBorrowerStats, getBorrowerHistory, getBorrowerReviews,
  getLenderStats, getLenderHistory, getLenderEarningsByAsset, getLenderReviews 
} = require('../models/dashboardModel');

async function getBorrowerDashboard(req, res) {
  try {
    const userID = req.userID;
    
    const [stats, history, reviews] = await Promise.all([
      getBorrowerStats(userID),
      getBorrowerHistory(userID),
      getBorrowerReviews(userID)
    ]);

    res.json({
      success: true,
      stats,
      history,
      reviews
    });
  } catch (err) {
    console.error('Borrower dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getLenderDashboard(req, res) {
  try {
    const userID = req.userID;
    
    const [stats, history, earnings, reviews] = await Promise.all([
      getLenderStats(userID),
      getLenderHistory(userID),
      getLenderEarningsByAsset(userID),
      getLenderReviews(userID)
    ]);

    res.json({
      success: true,
      stats,
      history,
      earnings,
      reviews
    });
  } catch (err) {
    console.error('Lender dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getBorrowerDashboard, getLenderDashboard };