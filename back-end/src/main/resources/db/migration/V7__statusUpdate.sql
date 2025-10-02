alter table "logging-platform".users
    drop column status;

alter table "logging-platform".permissions
    add status varchar(25) not null;