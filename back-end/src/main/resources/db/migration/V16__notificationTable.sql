alter table "logging-platform".notifications
    alter column user_id drop identity;

alter table "logging-platform".notifications
    alter column alert_id drop identity;