const walletModel = require('../models/walletModel');

const walletController = {
  getBalance: async (req, res) => {
    try {
      const userID = req.userID;
      const wallet = await walletModel.getBalance(userID);
      if (!wallet) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }
      res.json({
        success: true,
        balance: parseFloat(wallet.Balance).toFixed(2),
        updatedAt: wallet.UpdatedAt
      });
    } catch (err) {
      console.error('Get balance error:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch wallet balance' });
    }
  },

  getTransactions: async (req, res) => {
    try {
      const userID = req.userID;
      const transactions = await walletModel.getTransactions(userID);
      res.json({
        success: true,
        transactions: transactions.map(t => ({ ...t, Amount: parseFloat(t.Amount).toFixed(2) }))
      });
    } catch (err) {
      console.error('Get transactions error:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }
  },

  topUp: async (req, res) => {
    try {
      const userID = req.userID;
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid amount is required' });
      }
      const wallet = await walletModel.addMoney(userID, parseFloat(amount));
      res.json({
        success: true,
        message: 'Money added successfully',
        newBalance: parseFloat(wallet.Balance).toFixed(2)
      });
    } catch (err) {
      console.error('Top-up error:', err);
      res.status(500).json({ success: false, error: 'Failed to add money to wallet' });
    }
  },

// POST /api/wallet/pay-booking (Challan payment flow)
payBooking: async (req, res) => {
  try {
    const userID = req.userID; // ✅ Get authenticated user ID
    const { bookingID, amount } = req.body;
    
    if (!bookingID || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'bookingID and valid amount are required'
      });
    }

    // ✅ Pass userID to model for security check
    const result = await walletModel.payForBooking(bookingID, parseFloat(amount), userID);

    res.json({
      success: true,
      message: result.Message || 'Payment successful via challan',
      deductedAmount: parseFloat(amount).toFixed(2)
    });
  } catch (err) {
    console.error('Payment error:', err);
    
    if (err.message.includes('Insufficient balance')) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance in wallet'
      });
    }
    if (err.message.includes('security error') || err.message.includes('you are not the renter')) {
      return res.status(403).json({
        success: false,
        error: 'You can only pay for bookings where you are the renter'
      });
    }
    if (err.message.includes('booking not found')) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Payment failed'
    });
  }
}
};

module.exports = walletController;