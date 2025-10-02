create table users
(
    id         bigint generated always as identity
        constraint users_pk
            primary key,
    email      varchar(50) not null,
    status     varchar(25) not null,
    created_at date        not null,
    role       varchar(25) not null
);

alter table users
    owner to postgres;

create table registered_applications
(
    name        varchar(100) not null,
    description varchar(500),
    id          bigint generated always as identity
        constraint registered_applications_pk
            primary key,
    uuid        varchar(255) not null
);

alter table registered_applications
    owner to postgres;

create table permissions
(
    id      bigint generated always as identity
        constraint permissions_pk
            primary key,
    user_id bigint not null
        constraint permissions_users_id_fk
            references users,
    app_id  bigint not null
        constraint permissions_registered_applications_id_fk
            references registered_applications
);

alter table permissions
    owner to postgres;

create table logs
(
    id             bigint      not null
        constraint logs_pk
            primary key,
    timestamp      timestamp   not null,
    level          varchar(50) not null,
    message        text,
    application_id bigint      not null
        constraint logs_registered_applications_id_fk
            references registered_applications
);

alter table logs
    owner to postgres;

create table severity_level
(
    id    integer generated always as identity
        constraint severity_level_pk
            primary key,
    level varchar(50) not null
);

alter table severity_level
    owner to postgres;

create table alerts
(
    id             bigint generated always as identity
        constraint alerts_pk
            primary key,
    created_at     timestamp not null,
    severity_level integer   not null
        constraint alerts_severity_level_id_fk
            references severity_level,
    time_window    interval  not null,
    count          integer   not null,
    created_by     bigint    not null
        constraint alerts_users_id_fk
            references users
);

alter table alerts
    owner to postgres;

