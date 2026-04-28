--------- database setup ---------
use master;
go

if exists (select name from sys.databases where name = 'UdhaariDB')
    drop database UdhaariDB;
go

create database UdhaariDB;
go

use UdhaariDB;
go

--------- tables ---------

create table Users 
(
    UserID      int primary key identity(1,1),
    FullName    nvarchar(100) not null,
    Email       nvarchar(100) not null unique,
    Phone       nvarchar(20),
    City        nvarchar(50),
    Area        nvarchar(100),
    CNIC        nvarchar(15),
    CNICPicture nvarchar(255),
    ProfilePic  nvarchar(255),
    IsVerified  bit default 0,
    IsBanned    bit default 0,
    Role        nvarchar(10) default 'user' check (Role in ('user', 'admin')),
    SignupMethod nvarchar(50) default 'email',
    CreatedAt   datetime default getdate()
);
go

create table Categories 
(
    CategoryID  int primary key identity(1,1),
    Name        nvarchar(50) not null unique,
    Description nvarchar(200),
    IconURL     nvarchar(255)
);
go

create table Assets 
(
    AssetID     int primary key identity(1,1),
    OwnerID     int not null foreign key references Users(UserID),
    CategoryID  int not null foreign key references Categories(CategoryID),
    Title       nvarchar(150) not null,
    Description nvarchar(1000),
    PricePerDay decimal(10,2) not null check (PricePerDay >= 0),
    Deposit     decimal(10,2) default 0,
    City        nvarchar(50),
    Area        nvarchar(100),
    IsActive    bit default 1,
    CreatedAt   datetime default getdate()
);
go

create table AssetImages 
(
    ImageID   int primary key identity(1,1),
    AssetID   int not null foreign key references Assets(AssetID) on delete cascade,
    ImageURL  nvarchar(255) not null,
    IsPrimary bit default 0
);
go

create table Requests 
(
    RequestID   int primary key identity(1,1),
    RequesterID int not null foreign key references Users(UserID),
    CategoryID  int foreign key references Categories(CategoryID),
    Title       nvarchar(150) not null,
    Description nvarchar(1000),
    Area        nvarchar(100),
    City        nvarchar(50),
    StartDate   date not null,
    EndDate     date not null,
    MaxBudget   decimal(10,2),
    Status      nvarchar(20) default 'open' check (Status in ('open','fulfilled','closed','expired')),
    CreatedAt   datetime default getdate(),
    check (EndDate >= StartDate)
);
go

create table Offers 
(
    OfferID      int primary key identity(1,1),
    RequestID    int not null foreign key references Requests(RequestID),
    LenderID     int not null foreign key references Users(UserID),
    AssetID      int foreign key references Assets(AssetID),
    OfferedPrice decimal(10,2) not null check (OfferedPrice >= 0),
    Message      nvarchar(500),
    Status       nvarchar(20) default 'pending' check (Status in ('pending','accepted','declined')),
    CreatedAt    datetime default getdate(),
    unique (RequestID, LenderID)
);
go

create table Bookings 
(
    BookingID         int primary key identity(1,1),
    AssetID           int foreign key references Assets(AssetID),
    OfferID           int foreign key references Offers(OfferID),
    RenterID          int not null foreign key references Users(UserID),
    LenderID          int not null foreign key references Users(UserID),
    StartDate         date not null,
    EndDate           date not null,
    TotalPrice        decimal(10,2) not null check (TotalPrice >= 0),
    Status            nvarchar(20) default 'pending' check (Status in ('pending','confirmed','ongoing','returned','completed','cancelled')),
    PaymentScreenshot nvarchar(255),
    IsPaid            bit default 0,
    CreatedAt         datetime default getdate(),
    check (EndDate >= StartDate)
);
go

create table Availability 
(
    AvailabilityID int primary key identity(1,1),
    AssetID        int not null foreign key references Assets(AssetID) on delete cascade,
    BlockedDate    date not null,
    unique (AssetID, BlockedDate)
);
go

create table Wallets
(
    WalletID  int primary key identity(1,1),
    UserID    int not null unique foreign key references Users(UserID),
    Balance   decimal(10,2) default 0 check (Balance >= 0),
    UpdatedAt datetime default getdate()
);
go

create table Transactions 
(
    TransactionID int primary key identity(1,1),
    BookingID     int not null foreign key references Bookings(BookingID),
    FromWalletID  int foreign key references Wallets(WalletID),
    ToWalletID    int foreign key references Wallets(WalletID),
    Amount        decimal(10,2) not null check (Amount > 0),
    Type          nvarchar(20) not null check (Type in ('payment','deposit','refund','hold','release')),
    CreatedAt     datetime default getdate()
);
go

create table Messages 
(
    MessageID  int primary key identity(1,1),
    SenderID   int not null foreign key references Users(UserID),
    ReceiverID int not null foreign key references Users(UserID),
    BookingID  int foreign key references Bookings(BookingID),
    Body       nvarchar(2000) not null,
    IsRead     bit default 0,
    SentAt     datetime default getdate(),
    check (SenderID <> ReceiverID)
);
go

create table Reviews 
(
    ReviewID   int primary key identity(1,1),
    BookingID  int not null foreign key references Bookings(BookingID),
    ReviewerID int not null foreign key references Users(UserID),
    RevieweeID int not null foreign key references Users(UserID),
    AssetID    int foreign key references Assets(AssetID),
    Rating     tinyint not null check (Rating between 1 and 5),
    Comment    nvarchar(500),
    CreatedAt  datetime default getdate(),
    unique (BookingID, ReviewerID),
    check (ReviewerID <> RevieweeID)
);
go

create table Notifications
(
    NotificationID int primary key identity(1,1),
    UserID         int not null foreign key references Users(UserID),
    Title          nvarchar(100) not null,
    Message        nvarchar(300) not null,
    Type           nvarchar(20) not null check (Type in ('offer','booking','message','review','payment','admin','system')),
    IsRead         bit default 0,
    CreatedAt      datetime default getdate()
);
go

create table Wishlist 
(
    WishlistID int primary key identity(1,1),
    UserID     int not null foreign key references Users(UserID),
    AssetID    int not null foreign key references Assets(AssetID),
    AddedAt    datetime default getdate(),
    unique (UserID, AssetID)
);
go

--------- minimal dummy data (2-3 rows per table, consistent foreign keys) ---------

insert into Categories (Name, Description) values
('Electronics', 'Cameras, laptops, phones, gadgets'),
('Vehicles', 'Cars, bikes, rickshaws'),
('Property', 'Farmhouses, halls, event spaces');
go

insert into Users (FullName, Email, Phone, City, Area, CNIC, IsVerified, Role, SignupMethod) values
('Yousuf', 'yousuf@email.com', '03001234567', 'Lahore', 'DHA Phase 5', '3520112345671', 1, 'user', 'email'),
('Admin User', 'admin@udhaari.com', '03001111111', 'Lahore', 'FAST-NU', '3520743210987', 1, 'admin', 'email'),
('Test User', 'test@email.com', '03219876543', 'Lahore', 'Gulberg', '3520987654321', 0, 'user', 'google');
go

insert into Wallets (UserID, Balance) values
(1, 15000.00),
(2, 8000.00),
(3, 5000.00);
go

insert into Assets (OwnerID, CategoryID, Title, Description, PricePerDay, Deposit, City, Area) values
(1, 1, 'Canon EOS M50 Camera', 'Great for events. Comes with 2 lenses.', 1500.00, 5000.00, 'Lahore', 'DHA Phase 5'),
(2, 2, 'Honda CD 70 Motorcycle', 'Well maintained 2022 model.', 600.00, 3000.00, 'Lahore', 'Cantt');
go

insert into AssetImages (AssetID, ImageURL, IsPrimary) values
(1, '/uploads/canon_main.jpg', 1),
(1, '/uploads/canon_lens.jpg', 0),
(2, '/uploads/honda_main.jpg', 1);
go

insert into Requests (RequesterID, CategoryID, Title, Description, Area, City, StartDate, EndDate, MaxBudget) values
(1, 1, 'Need a DSLR Camera for 2 days', 'For a wedding shoot.', 'DHA Phase 5', 'Lahore', '2026-03-15', '2026-03-16', 3000.00),
(3, 2, 'Looking for party decoration items', 'Birthday party for 30 people.', 'Gulberg', 'Lahore', '2026-03-20', '2026-03-20', 1500.00);
go

insert into Offers (RequestID, LenderID, AssetID, OfferedPrice, Message) values
(1, 1, 1, 1500.00, 'Canon EOS M50 available on your dates.'),
(2, 2, 2, 800.00, 'Full decoration set perfect for 30 people.');
go

insert into Bookings (AssetID, OfferID, RenterID, LenderID, StartDate, EndDate, TotalPrice, Status, IsPaid) values
(1, 1, 3, 1, '2026-03-15', '2026-03-16', 3000.00, 'confirmed', 1),
(2, 2, 1, 2, '2026-03-18', '2026-03-20', 1800.00, 'ongoing', 0);
go

insert into Availability (AssetID, BlockedDate) values
(1, '2026-03-15'),
(1, '2026-03-16'),
(2, '2026-03-18');
go

insert into Transactions (BookingID, FromWalletID, ToWalletID, Amount, Type) values
(1, 3, 1, 3000.00, 'payment'),
(2, 1, 2, 1800.00, 'hold');
go

insert into Messages (SenderID, ReceiverID, BookingID, Body) values
(3, 1, 1, 'Hi, can we meet at DHA Y block on Saturday morning?'),
(1, 3, 1, 'Sure, 10am works. I will bring the camera bag too.'),
(1, 2, null, 'Admin: Your account has been reviewed.');
go

insert into Reviews (BookingID, ReviewerID, RevieweeID, AssetID, Rating, Comment) values
(1, 3, 1, 1, 5, 'Camera was in perfect condition. Very helpful.'),
(1, 1, 3, 1, 4, 'Took great care of the camera and returned it on time.');
go

insert into Notifications (UserID, Title, Message, Type) values
(1, 'New Offer on Your Request', 'Someone made an offer on your request.', 'offer'),
(3, 'Offer Accepted', 'Your offer for Canon EOS M50 has been accepted!', 'offer'),
(1, 'Payment Received', 'Payment of Rs. 3000 received.', 'payment');
go

insert into Wishlist (UserID, AssetID) values
(1, 2),
(3, 1),
(2, 1);
go

--------- triggers ---------

--------- trigger to auto-create wallet when user signs up ---------
create trigger trg_AutoSetupUser
on Users
after insert
as
begin
    insert into Wallets (UserID, Balance, UpdatedAt)
    select i.UserID, 0.00, getdate()
    from inserted i
    where not exists (select 1 from Wallets w where w.UserID = i.UserID);

    update Users
    set IsVerified = 1
    where UserID in (select UserID from inserted)
    and IsVerified = 0;
end;
go

--------- trigger to auto update wallet updatedat on balance change ---------
create trigger trg_UpdateWalletTimestamp
on Wallets
after update
as
begin
    if update(Balance)
    begin
        update Wallets
        set UpdatedAt = getdate()
        where WalletID in (select WalletID from inserted);
    end
end;
go

--------- trigger to auto mark booking as paid when payment transaction is inserted ---------
create trigger trg_MarkBookingPaidOnPayment
on Transactions
after insert
as
begin
    update Bookings
    set IsPaid = 1, Status = 'confirmed'
    where BookingID in (
        select i.BookingID 
        from inserted i 
        where i.Type = 'payment'
    );
end;
go

--------- views with window functions ---------

--------- view: wallet summary with transaction count using window function ---------
create or alter view vw_UserWalletSummary as
select 
    u.UserID, u.FullName, u.Email, w.Balance, w.UpdatedAt,
    count(t.TransactionID) over (partition by w.WalletID) as TotalTransactions,
    row_number() over (partition by u.UserID order by w.UpdatedAt desc) as WalletUpdateRank
from Users u
join Wallets w on u.UserID = w.UserID
left join Transactions t on t.FromWalletID = w.WalletID or t.ToWalletID = w.WalletID;
go

--------- view: transaction history with running total using window function ---------
create or alter view vw_TransactionHistory as
select 
    t.TransactionID, t.BookingID, t.Amount, t.Type, t.CreatedAt,
    uFrom.FullName as FromUser, uTo.FullName as ToUser,
    b.StartDate, b.EndDate,
    sum(t.Amount) over (partition by t.FromWalletID order by t.CreatedAt rows between unbounded preceding and current row) as RunningTotalSpent
from Transactions t
left join Wallets wFrom on t.FromWalletID = wFrom.WalletID
left join Users uFrom on wFrom.UserID = uFrom.UserID
left join Wallets wTo on t.ToWalletID = wTo.WalletID
left join Users uTo on wTo.UserID = uTo.UserID
left join Bookings b on t.BookingID = b.BookingID;
go

--------- view: user spending analytics with monthly breakdown ---------
create or alter view vw_UserSpendingAnalytics as
select 
    u.UserID,
    u.FullName,
    u.Email,
    w.Balance as CurrentBalance,
    count(t.TransactionID) over (partition by u.UserID) as TotalTransactions,
    sum(t.Amount) over (partition by u.UserID) as TotalSpent,
    avg(t.Amount) over (partition by u.UserID) as AvgTransaction,
    row_number() over (partition by u.UserID order by t.CreatedAt desc) as LastTransactionRank,
    datepart(month, t.CreatedAt) as TransactionMonth,
    sum(t.Amount) over (partition by u.UserID, datepart(month, t.CreatedAt)) as MonthlySpent
from Users u
join Wallets w on u.UserID = w.UserID
left join Transactions t on w.WalletID = t.FromWalletID
where t.Type = 'payment' or t.Type is null;
go

--------- stored procedures ---------

--------- stored procedure: safe deduct for booking with security check ---------
create or alter procedure sp_DeductForBooking
    @BookingID int,
    @Amount    decimal(10,2),
    @PayerUserID int
as
begin
    set nocount on;

    --------- check if booking already paid ---------
    if exists (
        select 1 from Bookings 
        where BookingID = @BookingID 
        and IsPaid = 1
    )
    begin
        raiserror('this booking has already been paid', 16, 1);
        return;
    end;

    begin try
        begin transaction;

        declare @RenterID int, @LenderID int, @PayerWalletID int, @LenderWalletID int;

        select @RenterID = RenterID, @LenderID = LenderID 
        from Bookings where BookingID = @BookingID;

        if @RenterID is null or @LenderID is null
        begin
            raiserror('booking not found or has invalid renter/lender', 16, 1);
            rollback transaction;
            return;
        end;

        if @PayerUserID <> @RenterID
        begin
            raiserror('security error: you are not the renter for this booking', 16, 1);
            rollback transaction;
            return;
        end;

        select @PayerWalletID = WalletID from Wallets where UserID = @PayerUserID;
        select @LenderWalletID = WalletID from Wallets where UserID = @LenderID;

        if @PayerWalletID is null or @LenderWalletID is null
        begin
            raiserror('wallet configuration error', 16, 1);
            rollback transaction;
            return;
        end;

        if (select Balance from Wallets where WalletID = @PayerWalletID) < @Amount
        begin
            raiserror('insufficient balance in wallet', 16, 1);
            rollback transaction;
            return;
        end;

        update Wallets set Balance = Balance - @Amount, UpdatedAt = getdate()
        where WalletID = @PayerWalletID;

        update Wallets set Balance = Balance + @Amount, UpdatedAt = getdate()
        where WalletID = @LenderWalletID;

        insert into Transactions (BookingID, FromWalletID, ToWalletID, Amount, Type, CreatedAt)
        values (@BookingID, @PayerWalletID, @LenderWalletID, @Amount, 'payment', getdate());

        commit transaction;
        select 'payment deducted successfully' as Message, @Amount as AmountDeducted;

    end try
    begin catch
        if @@trancount > 0 rollback transaction;
        throw;
    end catch;
end;
go

--------- procedure: safe wallet top up with logging ---------
create or alter procedure sp_TopUpWallet
    @UserID int,
    @Amount decimal(10,2),
    @Description nvarchar(200) = null
as
begin
    set nocount on;
    
    begin try
        begin transaction;

        declare @WalletID int;
        select @WalletID = WalletID from Wallets where UserID = @UserID;

        if @WalletID is null
        begin
            raiserror('wallet not found for user', 16, 1);
            rollback transaction;
            return;
        end;

        if @Amount <= 0
        begin
            raiserror('amount must be positive', 16, 1);
            rollback transaction;
            return;
        end;

        update Wallets 
        set Balance = Balance + @Amount, UpdatedAt = getdate()
        where WalletID = @WalletID;

        insert into Transactions (BookingID, FromWalletID, ToWalletID, Amount, Type, CreatedAt)
        values (null, null, @WalletID, @Amount, 'deposit', getdate());

        commit transaction;
        select 'top up successful' as Message, @Amount as AmountAdded;

    end try
    begin catch
        if @@trancount > 0 rollback transaction;
        throw;
    end catch;
end;
go

--------- procedure: get complete user financial summary ---------
create or alter procedure sp_GetUserFinancialSummary
    @UserID int
as
begin
    set nocount on;

    select 
        u.UserID,
        u.FullName,
        u.Email,
        w.Balance as CurrentBalance,
        w.UpdatedAt as BalanceLastUpdated,
        (select count(*) from Transactions t where t.FromWalletID = w.WalletID or t.ToWalletID = w.WalletID) as TotalTransactions,
        (select sum(Amount) from Transactions t where t.FromWalletID = w.WalletID and t.Type = 'payment') as TotalSpent,
        (select sum(Amount) from Transactions t where t.ToWalletID = w.WalletID and t.Type = 'payment') as TotalReceived,
        (select top 1 CreatedAt from Transactions t where t.FromWalletID = w.WalletID or t.ToWalletID = w.WalletID order by CreatedAt desc) as LastActivity
    from Users u
    join Wallets w on u.UserID = w.UserID
    where u.UserID = @UserID;
end;
go
