alter table "logging-platform".alerts
    drop column severity_level;

alter table "logging-platform".alerts
    add severity varchar(50) not null;

drop table "logging-platform".severity_level;