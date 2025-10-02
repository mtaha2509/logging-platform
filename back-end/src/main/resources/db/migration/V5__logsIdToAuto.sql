alter table "logging-platform".logs
    alter column id add generated always as identity;