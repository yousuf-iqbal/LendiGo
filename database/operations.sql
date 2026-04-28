--------- testing and admin operations for UdhaariDB ---------
use UdhaariDB;
go

select top 10 * from Users;
go

--------- setup test user 8 if not exists ---------
if not exists (select 1 from Users where Email = 'yousuf907734@gmail.com')
begin
    insert into Users (FullName, Email, Phone, City, Area, CNIC, IsVerified, Role, SignupMethod)
    values ('Test User', 'yousuf907734@gmail.com', '03009999999', 'Lahore', 'Test Area', '3520999999999', 1, 'user', 'email');
end
go


SELECT BookingID, RenterID, LenderID, Status, IsPaid, TotalPrice
FROM Bookings
WHERE RenterID = 5;
--------- ensure user 8 has a wallet ---------
if not exists (select 1 from Wallets where UserID =5 )
    insert into Wallets (UserID, Balance) values (8, 10000.00);
else
    update Wallets set Balance = 10000.00 where UserID = 5;
go

--------- add a new test booking for user 5 (l242539@lhr.nu.edu.pk) ---------
INSERT INTO Bookings (AssetID, RenterID, LenderID, StartDate, EndDate, TotalPrice, Status, IsPaid)
VALUES (
    1,                    -- AssetID: Canon EOS M50 Camera (exists in Assets table)
    5,                    -- RenterID: your test user (l242539@lhr.nu.edu.pk)
    1,                    -- LenderID: Yousuf (user 1, owns the camera)
    '2026-05-01',         -- StartDate: future date
    '2026-05-03',         -- EndDate: must be >= StartDate
    400.00,              -- TotalPrice: 3 days * 1500/day
    'pending',            -- Status: must be one of the allowed values
    0                     -- IsPaid: 0 = not paid yet
);
--------- queries for wallet demo ---------

--------- show user 8 wallet balance before payment ---------
select u.FullName, u.Email, w.Balance, w.UpdatedAt 
from Wallets w
join Users u on w.UserID = u.UserID
where u.UserID = 5;
go

--------- show transaction history for user 8 before payment ---------
select 
    t.TransactionID, t.Amount, t.Type, t.CreatedAt, b.BookingID
from Transactions t
left join Bookings b on t.BookingID = b.BookingID
where t.FromWalletID = (select WalletID from Wallets where UserID = 5)
   or t.ToWalletID = (select WalletID from Wallets where UserID = 5)
order by t.CreatedAt desc;
go

--------- test the payment stored procedure ---------
--------- execute sp_DeductForBooking @BookingID = 100, @Amount = 500.00, @PayerUserID = 8; ---------

--------- show updated balance after payment ---------
select u.FullName, u.Email, w.Balance as NewBalance, w.UpdatedAt
from Users u
join Wallets w on u.UserID = w.UserID
where u.UserID = 8;
go

--------- show new transaction created ---------
select top 1 
    t.TransactionID, t.Amount, t.Type, t.FromWalletID, t.ToWalletID, t.CreatedAt
from Transactions t
where t.FromWalletID = (select WalletID from Wallets where UserID = 8)
order by t.CreatedAt desc;
go

--------- admin queries ---------

--------- list all users with signup method ---------
select UserID, FullName, Email, SignupMethod, IsVerified, CreatedAt
from Users
order by CreatedAt desc;
go

--------- count users by signup method ---------
select 
    SignupMethod,
    count(*) as TotalUsers,
    sum(case when IsVerified = 1 then 1 else 0 end) as VerifiedUsers
from Users
group by SignupMethod;
go

--------- check wallet exists for every user ---------
select u.UserID, u.FullName, 
       case when w.WalletID is null then 'No Wallet' else 'Has Wallet' end as WalletStatus
from Users u
left join Wallets w on u.UserID = w.UserID;
go

--------- view wallet summary with window functions ---------
select * from vw_UserWalletSummary;
go

--------- view transaction history with running total ---------
select * from vw_TransactionHistory;
go

--------- update user verification status ---------
update Users set IsVerified = 1 where Email = 'yousuf907734@gmail.com';
go

--------- reset wallet balances for testing ---------
update Wallets set Balance = 15000.00 where UserID = 1;
update Wallets set Balance = 8000.00 where UserID = 2;
update Wallets set Balance = 10000.00 where UserID = 8;
go


--------- testing and admin operations for UdhaariDB ---------
use UdhaariDB;
go

--------- seed data (2-3 rows per table) ---------
insert into Categories (Name, Description) values
('Electronics', 'Cameras, laptops, phones, gadgets'),
('Vehicles', 'Cars, bikes, rickshaws'),
('Property', 'Farmhouses, halls, event spaces');
go

insert into Users (FullName, Email, Phone, City, Area, CNIC, IsVerified, Role, SignupMethod) values
('Yousuf', 'yousuf@email.com', '03001234567', 'Lahore', 'DHA Phase 5', '3520112345671', 1, 'user', 'email'),
('Dua', 'dua@email.com', '03211234567', 'Lahore', 'Gulberg III', '3520298765432', 1, 'user', 'google'),
('Admin User', 'admin@udhaari.com', '03001111111', 'Lahore', 'FAST-NU', '3520743210987', 1, 'admin', 'email');
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

insert into Bookings (AssetID, RenterID, LenderID, StartDate, EndDate, TotalPrice, Status, IsPaid) values
(1, 2, 1, '2026-03-15', '2026-03-16', 3000.00, 'confirmed', 1),
(2, 1, 2, '2026-03-18', '2026-03-20', 1800.00, 'ongoing', 0);
go

insert into Transactions (BookingID, FromWalletID, ToWalletID, Amount, Type) values
(1, 2, 1, 3000.00, 'payment'),
(2, 1, 2, 1800.00, 'hold');
go

--------- demo queries ---------
--------- show user 8 wallet balance before payment ---------
select u.FullName, u.Email, w.Balance, w.UpdatedAt 
from Wallets w
join Users u on w.UserID = u.UserID
where u.UserID = 1;
go

--------- show transaction history for user 1 before payment ---------
select 
    t.TransactionID, t.Amount, t.Type, t.CreatedAt, b.BookingID
from Transactions t
left join Bookings b on t.BookingID = b.BookingID
where t.FromWalletID = (select WalletID from Wallets where UserID = 1)
   or t.ToWalletID = (select WalletID from Wallets where UserID = 1)
order by t.CreatedAt desc;
go

--------- test secure payment stored procedure ---------
--------- exec sp_DeductForBooking @BookingID = 2, @Amount = 500.00, @PayerUserID = 1; ---------

--------- show updated balance after payment ---------
select u.FullName, u.Email, w.Balance as NewBalance, w.UpdatedAt
from Users u
join Wallets w on u.UserID = w.UserID
where u.UserID = 1;
go

--------- show new transaction created ---------
select top 1 
    t.TransactionID, t.Amount, t.Type, t.FromWalletID, t.ToWalletID, t.CreatedAt
from Transactions t
where t.FromWalletID = (select WalletID from Wallets where UserID = 1)
order by t.CreatedAt desc;
go

--------- verify window functions work ---------
select * from vw_UserWalletSummary;
go
select * from vw_TransactionHistory;
go