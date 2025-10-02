alter table "logging-platform".users
    alter column created_at type TIMESTAMP using created_at::TIMESTAMP;
