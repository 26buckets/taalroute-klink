CREATE TABLE school_attempts (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, group_id TEXT NOT NULL, learner_id TEXT NOT NULL,
 assignment_id TEXT, content_version_id TEXT NOT NULL REFERENCES content_versions(id), answer TEXT NOT NULL,
 correct INTEGER NOT NULL CHECK(correct IN (0,1)), created_at TEXT NOT NULL,
 FOREIGN KEY(organization_id,group_id,learner_id) REFERENCES group_memberships(organization_id,group_id,learner_id),
 FOREIGN KEY(organization_id,assignment_id) REFERENCES assignments(organization_id,id)
);
CREATE INDEX school_attempt_context ON school_attempts(organization_id,group_id,learner_id);
INSERT INTO inzicht_schema VALUES (2, '2026-11-01');
