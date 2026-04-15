const sql = require('mssql');

async function getBorrowerDashboard(req, res) {
  try {
    console.log('📢 Dashboard endpoint hit');
    console.log('User email:', req.userEmail);
    
    // Return simple test data first
    return res.json({
      success: true,
      message: 'Dashboard working!',
      userEmail: req.userEmail,
      stats: {
        totalBookings: 5,
        completedBookings: 3,
        totalSpent: 15000
      },
      recentBookings: [
        {
          id: 1,
          asset: 'Canon Camera',
          date: '2024-03-15',
          amount: 3000,
          status: 'completed'
        }
      ]
    });
    
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getLenderDashboard(req, res) {
  try {
    return res.json({
      success: true,
      message: 'Lender dashboard working!',
      stats: {
        totalEarnings: 25000,
        activeListings: 3,
        completedRentals: 8
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getBorrowerDashboard, getLenderDashboard };
