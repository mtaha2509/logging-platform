alter table "logging-platform".registered_applications
    add updatedAt TIMESTAMP;

alter table "logging-platform".alerts
    add updatedAt TIMESTAMP;