const { poolPromise, sql } = require('../config/db');

const walletModel = {
  getBalance: async (userID) => {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userID', sql.Int, userID)
      .query(`SELECT Balance, UpdatedAt FROM Wallets WHERE UserID = @userID`);
    return result.recordset[0];
  },

  getTransactions: async (userID) => {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userID', sql.Int, userID)
      .query(`SELECT t.TransactionID, t.Amount, t.Type, t.CreatedAt, b.BookingID, uFrom.FullName AS FromUser, uTo.FullName AS ToUser FROM Transactions t LEFT JOIN Wallets wFrom ON t.FromWalletID = wFrom.WalletID LEFT JOIN Users uFrom ON wFrom.UserID = uFrom.UserID LEFT JOIN Wallets wTo ON t.ToWalletID = wTo.WalletID LEFT JOIN Users uTo ON wTo.UserID = uTo.UserID LEFT JOIN Bookings b ON t.BookingID = b.BookingID WHERE wFrom.UserID = @userID OR wTo.UserID = @userID ORDER BY t.CreatedAt DESC`);
    return result.recordset;
  },

  // ✅ Updated: Now takes initialBalance argument (default 5000)
  createWallet: async (userID, initialBalance = 5000) => {
    const pool = await poolPromise;
    await pool.request()
      .input('userID', sql.Int, userID)
      .input('balance', sql.Decimal(10, 2), initialBalance)
      .query(`IF NOT EXISTS (SELECT 1 FROM Wallets WHERE UserID = @userID) BEGIN INSERT INTO Wallets (UserID, Balance, UpdatedAt) VALUES (@userID, @balance, GETDATE()) END`);
  },

  // ✅ New: Adds money to wallet (for topping up existing users)
  addMoney: async (userID, amount) => {
    const pool = await poolPromise;
    await pool.request()
      .input('userID', sql.Int, userID)
      .input('amount', sql.Decimal(10, 2), amount)
      .query(`UPDATE Wallets SET Balance = Balance + @amount, UpdatedAt = GETDATE() WHERE UserID = @userID`);
    
    // Return updated wallet
    const result = await pool.request()
      .input('userID', sql.Int, userID)
      .query(`SELECT Balance, UpdatedAt FROM Wallets WHERE UserID = @userID`);
    return result.recordset[0];
  },

  // ✅ New: Updates wallet to a specific balance (Safety net)
  updateBalance: async (userID, newBalance) => {
    const pool = await poolPromise;
    await pool.request()
      .input('userID', sql.Int, userID)
      .input('balance', sql.Decimal(10, 2), newBalance)
      .query(`UPDATE Wallets SET Balance = @balance, UpdatedAt = GETDATE() WHERE UserID = @userID`);
  },

  // Deduct money for booking using stored procedure
  payForBooking: async (bookingID, amount, payerUserID) => {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('BookingID', sql.Int, bookingID)
      .input('Amount', sql.Decimal(10, 2), amount)
      .input('PayerUserID', sql.Int, payerUserID)
      .execute('sp_DeductForBooking');
    return result.recordset[0];
  }
};

module.exports = walletModel;