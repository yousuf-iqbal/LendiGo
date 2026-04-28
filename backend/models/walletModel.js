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

  addMoney: async (userID, amount) => {
    const pool = await poolPromise;
    await pool.request()
      .input('userID', sql.Int, userID)
      .input('amount', sql.Decimal(10, 2), amount)
      .query(`UPDATE Wallets SET Balance = Balance + @amount, UpdatedAt = GETDATE() WHERE UserID = @userID`);
    return await walletModel.getBalance(userID);
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
},

  createWallet: async (userID, initialBalance = 0) => {
    const pool = await poolPromise;
    await pool.request()
      .input('userID', sql.Int, userID)
      .input('balance', sql.Decimal(10, 2), initialBalance)
      .query(`IF NOT EXISTS (SELECT 1 FROM Wallets WHERE UserID = @userID) BEGIN INSERT INTO Wallets (UserID, Balance) VALUES (@userID, @balance) END`);
  }
};

module.exports = walletModel;