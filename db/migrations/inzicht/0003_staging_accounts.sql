-- Isolated synthetic staging accounts; never seed passwords in a migration.
CREATE TABLE inzicht_credentials (
 user_id TEXT PRIMARY KEY REFERENCES users(id),
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
INSERT INTO inzicht_schema VALUES (3, '2026-11-01');
