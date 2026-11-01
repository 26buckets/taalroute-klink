-- Force a fresh two-factor login; never migrate a password-only session into MFA.
DELETE FROM inzicht_sessions;
CREATE TABLE inzicht_mfa (
 user_id TEXT PRIMARY KEY REFERENCES users(id),
 secret_cipher TEXT NOT NULL,
 last_step INTEGER NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE inzicht_mfa_sessions (
 token_hash TEXT PRIMARY KEY REFERENCES inzicht_sessions(token_hash) ON DELETE CASCADE
);
CREATE TABLE inzicht_mfa_challenges (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id),
 password_hash TEXT NOT NULL,
 pending_cipher TEXT,
 expires_at TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5)
);
CREATE INDEX inzicht_mfa_challenges_user ON inzicht_mfa_challenges(user_id);
CREATE TABLE inzicht_mfa_recovery (
 user_id TEXT NOT NULL REFERENCES inzicht_mfa(user_id) ON DELETE CASCADE,
 code_hash TEXT NOT NULL,
 used_at TEXT,
 PRIMARY KEY(user_id,code_hash)
);
CREATE TABLE inzicht_auth_events (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id),
 action TEXT NOT NULL,
 created_at TEXT NOT NULL
);
INSERT INTO inzicht_schema VALUES (4, '2026-11-01');
