-- Adds a marker column for requests whose body exceeded BODY_READ_LIMIT and was
-- captured only up to the limit. Stored as INTEGER (0/1) per SQLite conventions.

ALTER TABLE requests ADD COLUMN body_truncated INTEGER;
