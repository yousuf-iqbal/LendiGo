-- Add geographic coordinates for Lahore map features
use UdhaariDB;
go

if not exists (select 1 from information_schema.COLUMNS where TABLE_NAME = 'Requests' and COLUMN_NAME = 'Latitude')
begin
    alter table Requests add Latitude decimal(9, 6) null;
    alter table Requests add Longitude decimal(9, 6) null;
end;
go

if not exists (select 1 from information_schema.COLUMNS where TABLE_NAME = 'Assets' and COLUMN_NAME = 'Latitude')
begin
    alter table Assets add Latitude decimal(9, 6) null;
    alter table Assets add Longitude decimal(9, 6) null;
end;
go
