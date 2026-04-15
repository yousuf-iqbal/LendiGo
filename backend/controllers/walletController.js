// backend/controllers/walletController.js
const walletModel = require('../models/walletModel');

const walletController = {
  // GET /api/wallet/balance
  getBalance: async (req, res) => {
    try {
      const userID = req.userID;
      const wallet = await walletModel.getBalance(userID);

      if (!wallet) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found'
        });
      }

      res.json({
        success: true,
        balance: parseFloat(wallet.Balance).toFixed(2),
        updatedAt: wallet.UpdatedAt
      });
    } catch (err) {
      console.error('Get balance error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch wallet balance'
      });
    }
  },

  // GET /api/wallet/transactions
  getTransactions: async (req, res) => {
    try {
      const userID = req.userID;
      const transactions = await walletModel.getTransactions(userID);

      res.json({
        success: true,
        transactions: transactions.map(t => ({
          ...t,
          Amount: parseFloat(t.Amount).toFixed(2)
        }))
      });
    } catch (err) {
      console.error('Get transactions error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch transactions'
      });
    }
  },

  // POST /api/wallet/topup
  topUp: async (req, res) => {
    try {
      const userID = req.userID;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
      }

      const wallet = await walletModel.addMoney(userID, parseFloat(amount));

      res.json({
        success: true,
        message: 'Money added successfully',
        newBalance: parseFloat(wallet.Balance).toFixed(2)
      });
    } catch (err) {
      console.error('Top-up error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to add money to wallet'
      });
    }
  },

  // POST /api/wallet/pay-booking (Challan payment flow)
  payBooking: async (req, res) => {
    try {
      const userID = req.userID;
      const { bookingID, amount } = req.body;

      if (!bookingID || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'bookingID and valid amount are required'
        });
      }

      const result = await walletModel.payForBooking(bookingID, parseFloat(amount));

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
      
      res.status(500).json({
        success: false,
        error: 'Payment failed'
      });
    }
  }
};

module.exports = walletController;