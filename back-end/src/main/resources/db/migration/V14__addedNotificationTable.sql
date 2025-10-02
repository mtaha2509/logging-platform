create table "logging-platform".notifications
(
    id         BIGINT generated always as identity
        constraint notifications_pk
            primary key,
    user_id    Bigint generated always as identity
        constraint notifications_users_id_fk
            references "logging-platform".users,
    alert_id   bigint generated always as identity
        constraint notifications_alerts_id_fk
            references "logging-platform".alerts,
    message    varchar(500),
    created_at timestamp not null
);
