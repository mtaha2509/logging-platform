alter table "logging-platform".alerts
    rename column created_at to updatedAt;


alter table "logging-platform".registered_applications
    rename column created_at to updatedAt;
