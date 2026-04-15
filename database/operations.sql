
-- -- Udhaari Testing & CRUD Operations SQL
-- --for manual testing, Postman verification, admin tasks, and data reset operations.
-- --------------------------------------------------------------------

USE UdhaariDB;
GO
-- -- 1. Find your UserID
-- SELECT UserID, Email FROM Users WHERE Email = 'yousuf907734@gmail.com';

-- -- 2. Insert a wallet (replace X with your actual UserID from step 1)
-- INSERT INTO Wallets (UserID, Balance) 
-- VALUES (8, 10000.00);  -- e.g., VALUES (8, 10000.00)

-- -- 3. Verify it worked
-- SELECT u.Email, w.Balance 
-- FROM Users u 
-- JOIN Wallets w ON u.UserID = w.UserID 
-- WHERE u.Email = 'yousuf907734@gmail.com';

-- 1. USERS CRUD & ADMIN OPERATIONS

-- Get all users
--SELECT * FROM Users ORDER BY UserID;

-- -- Get single user by email (very useful for testing)
-- SELECT * FROM Users WHERE Email = 'yousuf@email.com';

-- -- Update user profile (example)
-- UPDATE Users 
-- SET FullName = 'Yousuf Iqbal Updated', 
--     Phone = '03005551234', 
--     City = 'Lahore'
-- WHERE Email = 'yousuf@email.com';

-- -- Admin: Ban / Unban a user
-- UPDATE Users SET IsBanned = 1 WHERE UserID = 5;     -- Ban
-- UPDATE Users SET IsBanned = 0 WHERE UserID = 5;     -- Unban

-- -- Admin: Verify user
-- UPDATE Users SET IsVerified = 1 WHERE UserID = 3;

-- -- Delete a user (be careful - cascades may apply)
-- DELETE FROM Users WHERE UserID = 999;   -- change ID

-- -- =============================================
-- -- 2. WALLET & PAYMENT OPERATIONS
-- -- =============================================

-- -- Check current wallet balance for a user
SELECT u.FullName, u.Email, w.Balance, w.UpdatedAt 
FROM Wallets w
JOIN Users u ON w.UserID = u.UserID
WHERE u.Email = 'yousuf907734@gmail.com';

-- -- View wallet summary (using the view we created)
-- SELECT * FROM vw_UserWalletSummary ORDER BY Balance DESC;

-- -- Add money to wallet (Top-up / Deposit for testing)
-- UPDATE Wallets 
-- SET Balance = Balance + 10000.00, 
--     UpdatedAt = GETDATE()
-- WHERE UserID = 1;   -- Change UserID as needed

-- -- Reset a specific wallet to default amount
-- UPDATE Wallets SET Balance = 15000.00 WHERE UserID = 1;

-- -- View full transaction history
-- SELECT * FROM vw_TransactionHistory ORDER BY CreatedAt DESC;

-- -- Test the challan deduction stored procedure (Booking payment)
-- EXEC sp_DeductForBooking @BookingID = 4, @Amount = 400.00;

-- -- Check balance after deduction
-- SELECT u.FullName, w.Balance 
-- FROM Wallets w 
-- JOIN Users u ON w.UserID = u.UserID 
-- WHERE u.UserID = 2;   -- Renter of BookingID 4

-- -- Manual wallet deduction (if you don't want to use stored proc)
-- UPDATE Wallets 
-- SET Balance = Balance - 500.00, UpdatedAt = GETDATE()
-- WHERE UserID = 1 AND Balance >= 500.00;

-- -- =============================================
-- -- 3. MESSAGES CRUD (for when we implement messaging)
-- -- =============================================

-- -- View all messages
-- SELECT m.MessageID, s.FullName AS Sender, r.FullName AS Receiver, 
--        m.Body, m.SentAt, m.IsRead
-- FROM Messages m
-- JOIN Users s ON m.SenderID = s.UserID
-- JOIN Users r ON m.ReceiverID = r.UserID
-- ORDER BY m.SentAt DESC;

-- -- Mark messages as read
-- UPDATE Messages 
-- SET IsRead = 1 
-- WHERE ReceiverID = 3 AND IsRead = 0;

-- -- Insert a test message
-- INSERT INTO Messages (SenderID, ReceiverID, BookingID, Body)
-- VALUES (1, 3, 1, 'Test message for backend testing - please ignore');

-- -- Delete old test messages
-- DELETE FROM Messages WHERE Body LIKE '%test message%';

-- -- =============================================
-- -- 4. BOOKINGS & PAYMENT RELATED
-- -- =============================================

-- -- View all bookings with status
-- SELECT b.BookingID, a.Title AS Asset, 
--        ur.FullName AS Renter, ul.FullName AS Lender,
--        b.TotalPrice, b.Status, b.IsPaid, b.StartDate, b.EndDate
-- FROM Bookings b
-- JOIN Assets a ON b.AssetID = a.AssetID
-- JOIN Users ur ON b.RenterID = ur.UserID
-- JOIN Users ul ON b.LenderID = ul.UserID
-- ORDER BY b.CreatedAt DESC;

-- -- Mark a booking as paid (admin/lender action)
-- UPDATE Bookings SET IsPaid = 1 WHERE BookingID = 4;

-- -- Change booking status
-- UPDATE Bookings SET Status = 'confirmed' WHERE BookingID = 4;

-- -- =============================================
-- -- 5. OTHER USEFUL QUERIES FOR TESTING
-- -- =============================================

-- -- Check if wallet exists for every user (important after new registration)
-- SELECT u.UserID, u.FullName, 
--        CASE WHEN w.WalletID IS NULL THEN 'No Wallet' ELSE 'Has Wallet' END AS WalletStatus
-- FROM Users u
-- LEFT JOIN Wallets w ON u.UserID = w.UserID;

-- -- Count total records in each table
-- SELECT 'Users' AS TableName, COUNT(*) AS Count FROM Users UNION ALL
-- SELECT 'Wallets', COUNT(*) FROM Wallets UNION ALL
-- SELECT 'Transactions', COUNT(*) FROM Transactions UNION ALL
-- SELECT 'Messages', COUNT(*) FROM Messages UNION ALL
-- SELECT 'Bookings', COUNT(*) FROM Bookings;

-- -- Reset all wallets to initial amounts (for repeated testing)
-- UPDATE Wallets SET Balance = 15000.00 WHERE UserID = 1;
-- UPDATE Wallets SET Balance =  8000.00 WHERE UserID = 2;
-- UPDATE Wallets SET Balance =  5000.00 WHERE UserID = 3;
-- UPDATE Wallets SET Balance = 12000.00 WHERE UserID = 4;
-- UPDATE Wallets SET Balance =  3000.00 WHERE UserID = 5;
-- UPDATE Wallets SET Balance = 20000.00 WHERE UserID = 6;
-- UPDATE Wallets SET Balance =     0.00 WHERE UserID = 7;

-- -- Clear test transactions
-- -- DELETE FROM Transactions WHERE Type = 'payment' AND CreatedAt > DATEADD(HOUR, -1, GETDATE());

-- GO