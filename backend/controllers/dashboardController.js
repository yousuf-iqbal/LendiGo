const {
  getBorrowerStats,
  getBorrowerHistory,
  getBorrowerReviews,
  getLenderStats,
  getLenderHistory,
  getLenderEarningsByAsset,
  getLenderReviews,
  getComprehensiveStats,
  getRecentActivity,
  getMonthlyEarnings,
} = require('../models/dashboardModel');

// ── BORROWER DASHBOARD ─────────────────────────────────────────────────────
const getBorrowerDashboard = async (req, res) => {
  try {
    const userID = req.userID;
    if (!userID) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const [stats, history, reviews] = await Promise.all([
      getBorrowerStats(userID),
      getBorrowerHistory(userID),
      getBorrowerReviews(userID),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: stats || {},
        history: history || [],
        reviews: reviews || [],
      },
    });
  } catch (error) {
    console.error('Error fetching borrower dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load borrower dashboard',
    });
  }
};

// ── LENDER DASHBOARD ───────────────────────────────────────────────────────
const getLenderDashboard = async (req, res) => {
  try {
    const userID = req.userID;
    if (!userID) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const [stats, history, earningsByAsset, reviews] = await Promise.all([
      getLenderStats(userID),
      getLenderHistory(userID),
      getLenderEarningsByAsset(userID),
      getLenderReviews(userID),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: stats || {},
        history: history || [],
        earningsByAsset: earningsByAsset || [],
        reviews: reviews || [],
      },
    });
  } catch (error) {
    console.error('Error fetching lender dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load lender dashboard',
    });
  }
};

// ── COMPREHENSIVE DASHBOARD ────────────────────────────────────────────────
const getComprehensiveDashboard = async (req, res) => {
  try {
    const userID = req.userID;
    if (!userID) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    console.log(`\n📊 Fetching comprehensive dashboard for UserID: ${userID}`);

    const [stats, activity, earnings] = await Promise.all([
      getComprehensiveStats(userID),
      getRecentActivity(userID, 15),
      getMonthlyEarnings(userID),
    ]);

    console.log(`✅ Stats retrieved:`, stats);
    console.log(`✅ Activities fetched: ${activity?.length || 0} items`);
    console.log(`✅ Earnings entries: ${earnings?.length || 0} months`);

    return res.status(200).json({
      success: true,
      data: {
        stats: stats || {},
        activity: activity || [],
        earnings: earnings || [],
      },
    });
  } catch (error) {
    console.error('Error fetching comprehensive dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load dashboard data',
    });
  }
};

module.exports = {
  getBorrowerDashboard,
  getLenderDashboard,
  getComprehensiveDashboard,
};
