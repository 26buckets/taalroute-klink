CREATE TABLE inzicht_outbox_retries (
 organization_id TEXT NOT NULL,
 group_id TEXT NOT NULL,
 failures INTEGER NOT NULL DEFAULT 0,
 next_attempt_at TEXT,
 last_attempt_at TEXT NOT NULL,
 last_success_at TEXT,
 PRIMARY KEY(organization_id,group_id),
 FOREIGN KEY(organization_id,group_id) REFERENCES groups(organization_id,id)
);
INSERT INTO inzicht_schema VALUES (5, '2026-11-01');
