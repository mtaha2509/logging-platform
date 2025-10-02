alter table "logging-platform".alerts
    alter column isactive set not null;

alter table "logging-platform".registered_applications
    alter column isactive set not null;