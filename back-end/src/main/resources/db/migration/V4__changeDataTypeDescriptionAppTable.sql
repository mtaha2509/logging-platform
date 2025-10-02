alter table "logging-platform".registered_applications
    alter column description type TEXT using description::TEXT;