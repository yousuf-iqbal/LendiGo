--------- testing and admin operations for UdhaariDB ---------
use UdhaariDB;

go
--------- ADD LOCATION COLUMNS FOR LAHORE MAP ---------
-- Run database/add-location-columns.sql for Latitude/Longitude on Requests and Assets

--------- ADD COLUMNS TO OFFERS TABLE FOR DATE SUPPORT ---------
-- Check if columns don't exist before adding them
if not exists (select 1 from information_schema.COLUMNS where TABLE_NAME = 'Offers' and COLUMN_NAME = 'StartDate')
begin
    alter table Offers add StartDate date null;
    alter table Offers add EndDate date null;
end;
go

-- all select queries for all table
select * from Users;
select * from Wallets;
select * from Transactions;
select * from Categories;
select * from Assets;   
select * from AssetImages;
select * from Bookings;
select * from Requests;
select * from Reviews;



--------- setup test user 3 if not exists ---------
if not exists (select 1 from Users where Email = 'test@email.com')
begin
    insert into Users (FullName, Email, Phone, City, Area, CNIC, IsVerified, Role, SignupMethod)
    values ('Test User', 'test@email.com', '03219876543', 'Lahore', 'Gulberg', '3520987654321', 0, 'user', 'google');
end;
go


--------- ensure user 3 has a wallet ---------
if not exists (select 1 from Wallets where UserID = 4)
    insert into Wallets (UserID, Balance) values (4, 5000.00);
else
    update Wallets set Balance = 5000.00 where UserID = 4;
go

--------- create a test booking for user 3 to pay ---------
if not exists (select 1 from Bookings where BookingID = 100)
begin
    insert into Bookings (AssetID, RenterID, LenderID, StartDate, EndDate, TotalPrice, Status, IsPaid)
    values (1, 4, 1, '2026-04-01', '2026-04-02', 1500.00, 'pending', 0);
end;
go

--------- create admin user (admin@gmail.com) ---------
if not exists (select 1 from Users where Email = 'admin@gmail.com')
begin
    insert into Users (FullName, Email, Phone, City, Area, CNIC, IsVerified, IsBanned, Role, SignupMethod)
    values ('Admin User', 'admin@gmail.com', '03001234567', 'Lahore', 'DHA', '1234567890123', 1, 0, 'admin', 'email');
    
    -- Create wallet for admin user with 100000 balance
    declare @adminUserID int;
    select @adminUserID = UserID from Users where Email = 'admin@gmail.com';
    
    if not exists (select 1 from Wallets where UserID = @adminUserID)
    begin
        insert into Wallets (UserID, Balance) values (@adminUserID, 100000.00);
    end;
end;
go

--------- queries for wallet demo ---------

--------- show user 3 wallet balance before payment ---------
select u.FullName, u.Email, w.Balance, w.UpdatedAt 
from Wallets w
join Users u on w.UserID = u.UserID
where u.UserID = 4;
go

--------- show transaction history for user 3 before payment ---------
select 
    t.TransactionID, t.Amount, t.Type, t.CreatedAt, b.BookingID
from Transactions t
left join Bookings b on t.BookingID = b.BookingID
where t.FromWalletID = (select WalletID from Wallets where UserID = 4)
   or t.ToWalletID = (select WalletID from Wallets where UserID = 4)
order by t.CreatedAt desc;
go

--------- test the payment stored procedure ---------
--------- exec sp_DeductForBooking @BookingID = 100, @Amount = 500.00, @PayerUserID = 3; ---------

--------- show updated balance after payment ---------
select u.FullName, u.Email, w.Balance as NewBalance, w.UpdatedAt
from Users u
join Wallets w on u.UserID = w.UserID
where u.UserID = 4;
go

--------- show new transaction created ---------
select top 1 
    t.TransactionID, t.Amount, t.Type, t.FromWalletID, t.ToWalletID, t.CreatedAt
from Transactions t
where t.FromWalletID = (select WalletID from Wallets where UserID = 3)
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
update Users set IsVerified = 1 where Email = 'test@email.com';
go

--------- reset wallet balances for testing ---------
update Wallets set Balance = 15000.00 where UserID = 1;
update Wallets set Balance = 8000.00 where UserID = 2;
update Wallets set Balance = 5000.00 where UserID = 3;
go

--------- verify booking payment prevention ---------
--------- this should fail if booking 1 is already paid ---------
--------- exec sp_DeductForBooking @BookingID = 1, @Amount = 100.00, @PayerUserID = 3; ---------