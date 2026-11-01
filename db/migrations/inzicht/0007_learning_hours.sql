-- Actual attended minutes, with immutable corrections; no planned hours inferred.
INSERT INTO inzicht_schema VALUES (7, '2026-11-01');
CREATE TABLE learning_hours (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, group_id TEXT NOT NULL,
 learner_id TEXT NOT NULL, current_revision INTEGER NOT NULL CHECK(current_revision>0),
 UNIQUE(organization_id,id),
 FOREIGN KEY(organization_id,group_id,learner_id) REFERENCES group_memberships(organization_id,group_id,learner_id)
);
CREATE TABLE learning_hour_revisions (
 organization_id TEXT NOT NULL, entry_id TEXT NOT NULL, revision INTEGER NOT NULL,
 attended_at TEXT NOT NULL, minutes INTEGER NOT NULL CHECK(minutes BETWEEN 0 AND 720),
 reason TEXT NOT NULL, changed_by TEXT NOT NULL, recorded_at TEXT NOT NULL,
 PRIMARY KEY(organization_id,entry_id,revision),
 FOREIGN KEY(organization_id,entry_id) REFERENCES learning_hours(organization_id,id),
 FOREIGN KEY(organization_id,changed_by) REFERENCES memberships(organization_id,id)
);
CREATE INDEX learning_hours_by_learner ON learning_hours(organization_id,group_id,learner_id);
