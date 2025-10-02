alter table "logging-platform".alerts
    add application_id bigint not null
        constraint alerts_registered_applications_id_fk
            references "logging-platform".registered_applications;