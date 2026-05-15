--------- DROP NOTIFICATIONS AND WISHLIST TABLES ---------
-- This migration removes the Notifications and Wishlist tables as per platform redesign

use UdhaariDB;
go

-- Drop Notifications table if exists
if exists (select 1 from information_schema.TABLES where TABLE_NAME = 'Notifications' and TABLE_SCHEMA = 'dbo')
begin
    drop table Notifications;
    print 'Notifications table dropped successfully';
end;
go

-- Drop Wishlist table if exists
if exists (select 1 from information_schema.TABLES where TABLE_NAME = 'Wishlist' and TABLE_SCHEMA = 'dbo')
begin
    drop table Wishlist;
    print 'Wishlist table dropped successfully';
end;
go

-- Verify tables are dropped
select 
    TABLE_NAME, 
    'Existing Tables' as Status
from information_schema.TABLES 
where TABLE_SCHEMA = 'dbo'
order by TABLE_NAME;
go
