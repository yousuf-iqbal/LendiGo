-- ==========================================================
-- UdhaariDB - Full Schema with Wallet + Views + Stored Procedures
-- Group 6 - Deliverable 2
-- ==========================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'UdhaariDB')
    DROP DATABASE UdhaariDB;
GO

CREATE DATABASE UdhaariDB;
GO

USE UdhaariDB;
GO

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE Users 
(
    UserID      INT PRIMARY KEY IDENTITY(1,1),
    FullName    NVARCHAR(100) NOT NULL,
    Email       NVARCHAR(100) NOT NULL UNIQUE,
    Phone       NVARCHAR(20),
    City        NVARCHAR(50),
    Area        NVARCHAR(100),
    CNIC        NVARCHAR(15),
    CNICPicture NVARCHAR(255),
    ProfilePic  NVARCHAR(255),
    IsVerified  BIT DEFAULT 0,
    IsBanned    BIT DEFAULT 0,
    Role        NVARCHAR(10) DEFAULT 'user' CHECK (Role IN ('user', 'admin')),
    CreatedAt   DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Categories 
(
    CategoryID  INT PRIMARY KEY IDENTITY(1,1),
    Name        NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(200),
    IconURL     NVARCHAR(255)
);
GO

CREATE TABLE Assets 
(
    AssetID     INT PRIMARY KEY IDENTITY(1,1),
    OwnerID     INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CategoryID  INT NOT NULL FOREIGN KEY REFERENCES Categories(CategoryID),
    Title       NVARCHAR(150) NOT NULL,
    Description NVARCHAR(1000),
    PricePerDay DECIMAL(10,2) NOT NULL CHECK (PricePerDay >= 0),
    Deposit     DECIMAL(10,2) DEFAULT 0,
    City        NVARCHAR(50),
    Area        NVARCHAR(100),
    IsActive    BIT DEFAULT 1,
    CreatedAt   DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE AssetImages 
(
    ImageID   INT PRIMARY KEY IDENTITY(1,1),
    AssetID   INT NOT NULL FOREIGN KEY REFERENCES Assets(AssetID) ON DELETE CASCADE,
    ImageURL  NVARCHAR(255) NOT NULL,
    IsPrimary BIT DEFAULT 0
);
GO

CREATE TABLE Requests 
(
    RequestID   INT PRIMARY KEY IDENTITY(1,1),
    RequesterID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CategoryID  INT FOREIGN KEY REFERENCES Categories(CategoryID),
    Title       NVARCHAR(150) NOT NULL,
    Description NVARCHAR(1000),
    Area        NVARCHAR(100),
    City        NVARCHAR(50),
    StartDate   DATE NOT NULL,
    EndDate     DATE NOT NULL,
    MaxBudget   DECIMAL(10,2),
    Status      NVARCHAR(20) DEFAULT 'open' CHECK (Status IN ('open','fulfilled','closed','expired')),
    CreatedAt   DATETIME DEFAULT GETDATE(),
    CHECK (EndDate >= StartDate)
);
GO

CREATE TABLE Offers 
(
    OfferID      INT PRIMARY KEY IDENTITY(1,1),
    RequestID    INT NOT NULL FOREIGN KEY REFERENCES Requests(RequestID),
    LenderID     INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    AssetID      INT FOREIGN KEY REFERENCES Assets(AssetID),
    OfferedPrice DECIMAL(10,2) NOT NULL CHECK (OfferedPrice >= 0),
    Message      NVARCHAR(500),
    Status       NVARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending','accepted','declined')),
    CreatedAt    DATETIME DEFAULT GETDATE(),
    UNIQUE (RequestID, LenderID)
);
GO

CREATE TABLE Bookings 
(
    BookingID         INT PRIMARY KEY IDENTITY(1,1),
    AssetID           INT FOREIGN KEY REFERENCES Assets(AssetID),
    OfferID           INT FOREIGN KEY REFERENCES Offers(OfferID),
    RenterID          INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    LenderID          INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    StartDate         DATE NOT NULL,
    EndDate           DATE NOT NULL,
    TotalPrice        DECIMAL(10,2) NOT NULL CHECK (TotalPrice >= 0),
    Status            NVARCHAR(20) DEFAULT 'pending' CHECK (Status IN ('pending','confirmed','ongoing','returned','completed','cancelled')),
    PaymentScreenshot NVARCHAR(255),
    IsPaid            BIT DEFAULT 0,
    CreatedAt         DATETIME DEFAULT GETDATE(),
    CHECK (EndDate >= StartDate)
);
GO

CREATE TABLE Availability 
(
    AvailabilityID INT PRIMARY KEY IDENTITY(1,1),
    AssetID        INT NOT NULL FOREIGN KEY REFERENCES Assets(AssetID) ON DELETE CASCADE,
    BlockedDate    DATE NOT NULL,
    UNIQUE (AssetID, BlockedDate)
);
GO

CREATE TABLE Wallets
(
    WalletID  INT PRIMARY KEY IDENTITY(1,1),
    UserID    INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(UserID),
    Balance   DECIMAL(10,2) DEFAULT 0 CHECK (Balance >= 0),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Transactions 
(
    TransactionID INT PRIMARY KEY IDENTITY(1,1),
    BookingID     INT NOT NULL FOREIGN KEY REFERENCES Bookings(BookingID),
    FromWalletID  INT FOREIGN KEY REFERENCES Wallets(WalletID),
    ToWalletID    INT FOREIGN KEY REFERENCES Wallets(WalletID),
    Amount        DECIMAL(10,2) NOT NULL CHECK (Amount > 0),
    Type          NVARCHAR(20) NOT NULL CHECK (Type IN ('payment','deposit','refund','hold','release')),
    CreatedAt     DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Messages 
(
    MessageID  INT PRIMARY KEY IDENTITY(1,1),
    SenderID   INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    ReceiverID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    BookingID  INT FOREIGN KEY REFERENCES Bookings(BookingID),
    Body       NVARCHAR(2000) NOT NULL,
    IsRead     BIT DEFAULT 0,
    SentAt     DATETIME DEFAULT GETDATE(),
    CHECK (SenderID <> ReceiverID)
);
GO

CREATE TABLE Reviews 
(
    ReviewID   INT PRIMARY KEY IDENTITY(1,1),
    BookingID  INT NOT NULL FOREIGN KEY REFERENCES Bookings(BookingID),
    ReviewerID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    RevieweeID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    AssetID    INT FOREIGN KEY REFERENCES Assets(AssetID),
    Rating     TINYINT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment    NVARCHAR(500),
    CreatedAt  DATETIME DEFAULT GETDATE(),
    UNIQUE (BookingID, ReviewerID),
    CHECK (ReviewerID <> RevieweeID)
);
GO

CREATE TABLE Notifications
(
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID         INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Title          NVARCHAR(100) NOT NULL,
    Message        NVARCHAR(300) NOT NULL,
    Type           NVARCHAR(20) NOT NULL CHECK (Type IN ('offer','booking','message','review','payment','admin','system')),
    IsRead         BIT DEFAULT 0,
    CreatedAt      DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Wishlist 
(
    WishlistID INT PRIMARY KEY IDENTITY(1,1),
    UserID     INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    AssetID    INT NOT NULL FOREIGN KEY REFERENCES Assets(AssetID),
    AddedAt    DATETIME DEFAULT GETDATE(),
    UNIQUE (UserID, AssetID)
);
GO


-- dummy data
-- inserted in dependency order i.e. parents before children

-- categories first since assets and requests reference them
insert into Categories (Name, Description) values
('Electronics',    'Cameras, laptops, phones, gadgets'),
('Party Supplies', 'Decorations, lights, tables, chairs'),
('Vehicles',       'Cars, bikes, rickshaws'),
('Tools',          'Drills, hammers, power tools'),
('Property',       'Farmhouses, halls, event spaces'),
('Sports',         'Gear, equipment, outdoor items'),
('Clothing',       'Formal wear, costumes, traditional dress');
go

-- users second since almost every table references userid
-- passwords shown as placeholders bcrypt hashes these in the real app
insert into Users (FullName, Email, Phone, City, Area, CNIC, IsVerified, Role) values
('Yousuf',     'yousuf@email.com',     '03001234567', 'Lahore', 'DHA Phase 5', '3520112345671', 1, 'user'),
('Dua',        'dua@email.com',        '03211234567', 'Lahore', 'Gulberg III', '3520298765432', 1, 'user'),
('Khushbakht', 'khushbakht@email.com', '03451234567', 'Lahore', 'Model Town',  '3520387654321', 0, 'user'),
('Noor',       'noor@email.com',       '03331234567', 'Lahore', 'Johar Town',  '3520476543210', 1, 'user'),
('Sara Khan',  'sara@email.com',       '03121234567', 'Lahore', 'Bahria Town', '3520565432109', 0, 'user'),
('Ahmed Raza', 'ahmed@email.com',      '03041234567', 'Lahore', 'Cantt',       '3520654321098', 1, 'user'),
('Admin User', 'admin@udhaari.com',    '03001111111', 'Lahore', 'FAST-NU',     '3520743210987', 1, 'admin');


-- one wallet per user
insert into Wallets (UserID, Balance) values
(1, 15000.00),
(2,  8000.00),
(3,  5000.00),
(4, 12000.00),
(5,  3000.00),
(6, 20000.00),
(7,     0.00);
go

-- assets depend on users and categories
insert into Assets (OwnerID, CategoryID, Title, Description, PricePerDay, Deposit, City, Area) values
(1, 1, 'Canon EOS M50 Camera',  'Great for events. Comes with 2 lenses and a bag.',  1500.00,  5000.00, 'Lahore', 'DHA Phase 5'),
(2, 2, 'Birthday Party Decoration Set', 'Balloons, banners, fairy lights for 20 people.', 800.00,  2000.00, 'Lahore', 'Gulberg III'),
(6, 3, 'Honda CD 70 Motorcycle',  'Well maintained 2022 model. Full tank provided.',  600.00,  3000.00, 'Lahore', 'Cantt'),
(4, 4, 'Bosch Power Drill',   'Heavy duty drill with full set of bits.',   400.00,  1500.00, 'Lahore', 'Johar Town'),
(1, 6, 'Cricket Kit - Full Set',  'Bat, pads, gloves, helmet and ball included.',  700.00,  2500.00, 'Lahore', 'DHA Phase 5'),
(6, 5, 'Farmhouse - 1 Kanal', 'Lawn, kitchen, 3 rooms. Up to 50 guests.', 15000.00, 30000.00, 'Lahore', 'Bedian Road');
go

-- one primary image and one extra image per asset where applicable
insert into AssetImages (AssetID, ImageURL, IsPrimary) values
(1, '/uploads/canon_main.jpg',      1),
(1, '/uploads/canon_lens.jpg',      0),
(2, '/uploads/decor_main.jpg',      1),
(3, '/uploads/honda_main.jpg',      1),
(4, '/uploads/drill_main.jpg',      1),
(5, '/uploads/cricket_main.jpg',    1),
(6, '/uploads/farmhouse_main.jpg',  1),
(6, '/uploads/farmhouse_lawn.jpg',  0);
go

insert into Requests (RequesterID, CategoryID, Title, Description, Area, City, StartDate, EndDate, MaxBudget) values
(3, 1, 'Need a DSLR Camera for 2 days', 'For a wedding shoot. Must include lenses.',    'Model Town',  'Lahore', '2026-03-15', '2026-03-16', 3000.00),
(5, 2, 'Looking for party decoration items', 'Birthday party for 30 people.',  'Bahria Town', 'Lahore', '2026-03-20', '2026-03-20', 1500.00),
(3, 3, 'Need a bike for 3 days',  'Short trip. Any well-maintained bike.', 'Model Town',  'Lahore', '2026-03-18', '2026-03-20', 2000.00),
(2, 4, 'Drill needed for weekend project', 'Simple home renovation, one day only.', 'Gulberg III', 'Lahore', '2026-03-22', '2026-03-22',  500.00),
(5, 6, 'Cricket kit for a gully match', 'Need full kit for 1 day. 6 players.', 'Bahria Town', 'Lahore', '2026-03-19', '2026-03-19', 1000.00);
go

-- assetid is null for offer 2 that lender has no formal listing 
insert into Offers (RequestID, LenderID, AssetID, OfferedPrice, Message) values
(1, 1,    1, 1500.00, 'Canon EOS M50 available on your dates. Comes with 2 lenses.'),
(1, 6, null, 1200.00, 'I have a Nikon D3500. Can deliver to Model Town.'),
(2, 2,    2,  800.00, 'Full decoration set perfect for 30 people.'),
(3, 6,    3,  600.00, 'Honda CD70 available. Full tank included.'),
(4, 4,    4,  400.00, 'Bosch drill available. Can drop off at your location.'),
(5, 1,    5,  700.00, 'Full cricket kit available. Can meet at Model Town.');
go

insert into Bookings (AssetID, OfferID, RenterID, LenderID, StartDate, EndDate, TotalPrice, Status, IsPaid) values
(1, 1, 3, 1, '2026-03-15', '2026-03-16', 3000.00, 'completed', 1),
(2, 3, 5, 2, '2026-03-20', '2026-03-20',  800.00, 'confirmed', 1),
(3, 4, 3, 6, '2026-03-18', '2026-03-20', 1800.00, 'ongoing',   1),
(4, 5, 2, 4, '2026-03-22', '2026-03-22',  400.00, 'pending',   0),
(5, 6, 5, 1, '2026-03-19', '2026-03-19',  700.00, 'confirmed', 1);
go

insert into Availability (AssetID, BlockedDate) values
(1, '2026-03-15'),
(1, '2026-03-16'),
(3, '2026-03-18'),
(3, '2026-03-19'),
(3, '2026-03-20'),
(5, '2026-03-19');
go

-- fromwalletid = payer, towalletid = receiver
insert into Transactions (BookingID, FromWalletID, ToWalletID, Amount, Type) values
(1, 3, 1, 3000.00, 'payment'),
(2, 5, 2,  800.00, 'hold'),
(3, 3, 6, 1800.00, 'payment'),
(5, 5, 1,  700.00, 'hold');
go

insert into Messages (SenderID, ReceiverID, BookingID, Body) values
(3, 1, 1,    'Hi, can we meet at DHA Y block on Saturday morning?'),
(1, 3, 1,    'Sure, 10am works. I will bring the camera bag too.'),
(3, 1, 1,    'Perfect, see you then!'),
(5, 2, 2,    'Should I pick up the decorations from your place?'),
(2, 5, 2,    'Yes please, come after 5pm on the 20th.'),
(7, 3, null, 'Your account has been reviewed and verified. Welcome to Udhaari!');
go

insert into Reviews (BookingID, ReviewerID, RevieweeID, AssetID, Rating, Comment) values
(1, 3, 1, 1, 5, 'Camera was in perfect condition. Very helpful and punctual.'),
(1, 1, 3, 1, 4, 'Took great care of the camera and returned it on time.');
go

insert into Notifications (UserID, Title, Message, Type) values
(1, 'New Offer on Your Request',  'Someone made an offer on your request for a DSLR Camera.', 'offer'),
(3, 'Offer Accepted',  'Your offer for Canon EOS M50 has been accepted!',  'offer'),
(3, 'Booking Confirmed','Your booking for Canon EOS M50 is confirmed.', 'booking'),
(5, 'New Message',      'Dua sent you a message about your decoration booking.','message'),
(3, 'Account Verified', 'Your account has been verified by the admin.', 'admin'),
(2, 'Payment Received', 'Payment of Rs. 800 received for decoration booking.', 'payment');
go

insert into Wishlist (UserID, AssetID) values
(3, 6),
(5, 1),
(2, 3),
(3, 5);
go

-- VIEWS & STORED PROCEDURES 

-- View: Wallet Summary
CREATE OR ALTER VIEW vw_UserWalletSummary AS
SELECT 
    u.UserID, u.FullName, u.Email, w.Balance, w.UpdatedAt,
    (SELECT COUNT(*) FROM Transactions t 
     WHERE t.FromWalletID = w.WalletID OR t.ToWalletID = w.WalletID) AS TotalTransactions
FROM Users u
JOIN Wallets w ON u.UserID = w.UserID;
GO

-- View: Transaction History
CREATE OR ALTER VIEW vw_TransactionHistory AS
SELECT 
    t.TransactionID, t.BookingID, t.Amount, t.Type, t.CreatedAt,
    uFrom.FullName AS FromUser, uTo.FullName AS ToUser,
    b.StartDate, b.EndDate
FROM Transactions t
LEFT JOIN Wallets wFrom ON t.FromWalletID = wFrom.WalletID
LEFT JOIN Users uFrom ON wFrom.UserID = uFrom.UserID
LEFT JOIN Wallets wTo ON t.ToWalletID = wTo.WalletID
LEFT JOIN Users uTo ON wTo.UserID = uTo.UserID
LEFT JOIN Bookings b ON t.BookingID = b.BookingID;
GO

-- Stored Procedure: Safe Deduct for Booking / Challan
CREATE OR ALTER PROCEDURE sp_DeductForBooking
    @BookingID INT,
    @Amount    DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @RenterID INT, @LenderID INT, @RenterWalletID INT, @LenderWalletID INT;

        SELECT @RenterID = RenterID, @LenderID = LenderID 
        FROM Bookings WHERE BookingID = @BookingID;

        SELECT @RenterWalletID = WalletID FROM Wallets WHERE UserID = @RenterID;
        SELECT @LenderWalletID = WalletID FROM Wallets WHERE UserID = @LenderID;

        IF (SELECT Balance FROM Wallets WHERE WalletID = @RenterWalletID) < @Amount
            THROW 50002, 'Insufficient balance in wallet.', 1;

        -- Deduct from renter
        UPDATE Wallets SET Balance = Balance - @Amount, UpdatedAt = GETDATE()
        WHERE WalletID = @RenterWalletID;

        -- Credit to lender
        UPDATE Wallets SET Balance = Balance + @Amount, UpdatedAt = GETDATE()
        WHERE WalletID = @LenderWalletID;

        -- Record transaction
        INSERT INTO Transactions (BookingID, FromWalletID, ToWalletID, Amount, Type)
        VALUES (@BookingID, @RenterWalletID, @LenderWalletID, @Amount, 'payment');

        COMMIT TRANSACTION;
        SELECT 'Payment deducted successfully' AS Message, @Amount AS AmountDeducted;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
