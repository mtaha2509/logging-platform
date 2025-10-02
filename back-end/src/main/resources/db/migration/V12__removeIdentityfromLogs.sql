ALTER TABLE "logging-platform".logs
    ALTER COLUMN id DROP IDENTITY IF EXISTS;

-- 3) set default value to nextval from the sequence
ALTER TABLE "logging-platform".logs
    ALTER COLUMN id SET DEFAULT nextval('"logging-platform".logs_seq');

-- 4) make the sequence owned by the column (optional but tidy)
ALTER SEQUENCE "logging-platform".logs_seq OWNED BY "logging-platform".logs.id;