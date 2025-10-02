alter table "logging-platform".registered_applications
    add isActive boolean;

alter table "logging-platform".alerts
    add isActive boolean;