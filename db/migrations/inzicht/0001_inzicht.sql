-- Additive migration. Existing attempts/mastery/review_items are deliberately untouched.
CREATE TABLE inzicht_schema (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
INSERT INTO inzicht_schema VALUES (1, '2026-11-01');
CREATE TABLE users (id TEXT PRIMARY KEY, auth_subject TEXT NOT NULL UNIQUE, status TEXT NOT NULL CHECK(status IN ('active','disabled')));
CREATE TABLE organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','disabled')), allowed_routes TEXT NOT NULL, data_version INTEGER NOT NULL DEFAULT 1);
CREATE TABLE inzicht_write_guards (id TEXT PRIMARY KEY, allowed INTEGER NOT NULL CHECK(allowed=1));
CREATE TABLE memberships (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL REFERENCES users(id),
 status TEXT NOT NULL CHECK(status IN ('active','ended')), role TEXT NOT NULL CHECK(role IN ('teacher','assistant','school_admin','registrar','learner','support','content_editor')),
 can_create_class INTEGER NOT NULL DEFAULT 0 CHECK(can_create_class IN (0,1)),
 UNIQUE(organization_id,id), UNIQUE(organization_id,user_id)
);
CREATE TABLE inzicht_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0 CHECK(revoked IN (0,1)));
CREATE TABLE groups (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
 start_level TEXT NOT NULL, period TEXT NOT NULL DEFAULT '', status TEXT NOT NULL CHECK(status IN ('active','archived')),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, UNIQUE(organization_id,id)
);
CREATE TABLE group_teachers (
 organization_id TEXT NOT NULL, group_id TEXT NOT NULL, membership_id TEXT NOT NULL,
 PRIMARY KEY(organization_id,group_id,membership_id),
 FOREIGN KEY(organization_id,group_id) REFERENCES groups(organization_id,id),
 FOREIGN KEY(organization_id,membership_id) REFERENCES memberships(organization_id,id)
);
CREATE TABLE school_learners (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 100),
 created_by TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(organization_id,id),
 FOREIGN KEY(organization_id,created_by) REFERENCES memberships(organization_id,id)
);
CREATE TABLE group_memberships (
 organization_id TEXT NOT NULL, group_id TEXT NOT NULL, learner_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','ended')),
 started_at TEXT NOT NULL, ended_at TEXT, PRIMARY KEY(organization_id,group_id,learner_id),
 FOREIGN KEY(organization_id,group_id) REFERENCES groups(organization_id,id),
 FOREIGN KEY(organization_id,learner_id) REFERENCES school_learners(organization_id,id)
);
CREATE TABLE account_links (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, learner_id TEXT NOT NULL, membership_id TEXT NOT NULL,
 verified_by TEXT NOT NULL, verification_ref TEXT NOT NULL, created_at TEXT NOT NULL, revoked_at TEXT,
 FOREIGN KEY(organization_id,learner_id) REFERENCES school_learners(organization_id,id),
 FOREIGN KEY(organization_id,membership_id) REFERENCES memberships(organization_id,id),
 FOREIGN KEY(organization_id,verified_by) REFERENCES memberships(organization_id,id)
);
CREATE UNIQUE INDEX active_learner_link ON account_links(organization_id,learner_id) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX active_membership_link ON account_links(organization_id,membership_id) WHERE revoked_at IS NULL;
CREATE TABLE school_invites (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, learner_id TEXT NOT NULL, membership_id TEXT NOT NULL, created_by TEXT NOT NULL,
 token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('created','accepted','revoked')),
 FOREIGN KEY(organization_id,learner_id) REFERENCES school_learners(organization_id,id),
 FOREIGN KEY(organization_id,membership_id) REFERENCES memberships(organization_id,id),
 FOREIGN KEY(organization_id,created_by) REFERENCES memberships(organization_id,id)
);
CREATE TABLE inzicht_rate_limits (bucket TEXT PRIMARY KEY, requests INTEGER NOT NULL);
CREATE TABLE skill_definitions (
 id TEXT PRIMARY KEY, label TEXT NOT NULL, domain TEXT NOT NULL, level_code TEXT NOT NULL, version TEXT NOT NULL,
 rubric_json TEXT NOT NULL, measurement_approved INTEGER NOT NULL DEFAULT 0 CHECK(measurement_approved IN (0,1))
);
CREATE TABLE teacher_observations (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, group_id TEXT NOT NULL, learner_id TEXT NOT NULL, author_id TEXT NOT NULL,
 skill_id TEXT NOT NULL REFERENCES skill_definitions(id), current_revision INTEGER NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(organization_id,id),
 FOREIGN KEY(organization_id,group_id,learner_id) REFERENCES group_memberships(organization_id,group_id,learner_id),
 FOREIGN KEY(organization_id,author_id) REFERENCES memberships(organization_id,id)
);
CREATE TABLE observation_revisions (
 organization_id TEXT NOT NULL, observation_id TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, changed_by TEXT NOT NULL, reason TEXT NOT NULL, recorded_at TEXT NOT NULL,
 PRIMARY KEY(organization_id,observation_id,revision),
 FOREIGN KEY(organization_id,observation_id) REFERENCES teacher_observations(organization_id,id),
 FOREIGN KEY(organization_id,changed_by) REFERENCES memberships(organization_id,id)
);
CREATE TABLE evidence_events (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, group_id TEXT NOT NULL, learner_id TEXT NOT NULL, skill_id TEXT NOT NULL REFERENCES skill_definitions(id),
 source_type TEXT NOT NULL CHECK(source_type IN ('observation','assessment')), source_id TEXT NOT NULL, source_revision INTEGER NOT NULL,
 payload TEXT NOT NULL, event_hash TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(organization_id,id),
 UNIQUE(organization_id,source_type,source_id,source_revision,skill_id),
 FOREIGN KEY(organization_id,group_id,learner_id) REFERENCES group_memberships(organization_id,group_id,learner_id)
);
CREATE TABLE evidence_revocations (
 organization_id TEXT NOT NULL, event_id TEXT NOT NULL, actor_id TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(organization_id,event_id), FOREIGN KEY(organization_id,event_id) REFERENCES evidence_events(organization_id,id),
 FOREIGN KEY(organization_id,actor_id) REFERENCES memberships(organization_id,id)
);
CREATE TABLE outbox_events (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, group_id TEXT NOT NULL, learner_id TEXT NOT NULL, skill_id TEXT NOT NULL REFERENCES skill_definitions(id),
 status TEXT NOT NULL CHECK(status IN ('queued','processed','error')), created_at TEXT NOT NULL, processed_at TEXT,
 FOREIGN KEY(organization_id,group_id,learner_id) REFERENCES group_memberships(organization_id,group_id,learner_id)
);
CREATE TABLE mastery_snapshots (
 organization_id TEXT NOT NULL, group_id TEXT NOT NULL, learner_id TEXT NOT NULL, skill_id TEXT NOT NULL REFERENCES skill_definitions(id),
 evidence_hash TEXT NOT NULL, rule_version TEXT NOT NULL, payload TEXT NOT NULL, calculated_at TEXT NOT NULL,
 PRIMARY KEY(organization_id,group_id,learner_id,skill_id,evidence_hash),
 FOREIGN KEY(organization_id,group_id,learner_id) REFERENCES group_memberships(organization_id,group_id,learner_id)
);
CREATE TABLE class_access_policies (
 organization_id TEXT NOT NULL, group_id TEXT NOT NULL, subject_id TEXT NOT NULL, version INTEGER NOT NULL,
 allowed_routes TEXT NOT NULL, exercise_mode TEXT NOT NULL CHECK(exercise_mode IN ('free','assigned')),
 PRIMARY KEY(organization_id,group_id,subject_id), FOREIGN KEY(organization_id,group_id) REFERENCES groups(organization_id,id)
);
CREATE TABLE content_versions (
 id TEXT PRIMARY KEY, stable_code TEXT NOT NULL, version_hash TEXT NOT NULL, title TEXT NOT NULL, level_code TEXT NOT NULL,
 product TEXT NOT NULL CHECK(product IN ('klink','klink_docent')), release_status TEXT NOT NULL CHECK(release_status IN ('published','hold','withdrawn')),
 skill_id TEXT NOT NULL REFERENCES skill_definitions(id), relation_type TEXT NOT NULL CHECK(relation_type IN ('TRAIN','MEASURE')),
 deep_link TEXT NOT NULL, metadata TEXT NOT NULL
);
CREATE TABLE assignments (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, group_id TEXT NOT NULL, content_version_id TEXT NOT NULL REFERENCES content_versions(id),
 created_by TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT, instructions TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('active','withdrawn')), created_at TEXT NOT NULL, UNIQUE(organization_id,id),
 FOREIGN KEY(organization_id,group_id) REFERENCES groups(organization_id,id),
 FOREIGN KEY(organization_id,created_by) REFERENCES memberships(organization_id,id)
);
CREATE TABLE assignment_recipients (
 organization_id TEXT NOT NULL, assignment_id TEXT NOT NULL, learner_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('ready','started','finished')),
 PRIMARY KEY(organization_id,assignment_id,learner_id), FOREIGN KEY(organization_id,assignment_id) REFERENCES assignments(organization_id,id),
 FOREIGN KEY(organization_id,learner_id) REFERENCES school_learners(organization_id,id)
);
CREATE TABLE recommendation_previews (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, group_id TEXT NOT NULL, created_by TEXT NOT NULL, input_hash TEXT NOT NULL,
 target_date TEXT NOT NULL, schedule_source TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
 FOREIGN KEY(organization_id,group_id) REFERENCES groups(organization_id,id), FOREIGN KEY(organization_id,created_by) REFERENCES memberships(organization_id,id)
);
CREATE TABLE approved_lesson_plans (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, preview_id TEXT NOT NULL UNIQUE REFERENCES recommendation_previews(id), approved_by TEXT NOT NULL, payload TEXT NOT NULL, approved_at TEXT NOT NULL,
 FOREIGN KEY(organization_id,approved_by) REFERENCES memberships(organization_id,id)
);
CREATE TABLE audit_events (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), actor_id TEXT NOT NULL, action TEXT NOT NULL, resource_id TEXT NOT NULL, occurred_at TEXT NOT NULL,
 FOREIGN KEY(organization_id,actor_id) REFERENCES memberships(organization_id,id)
);
CREATE TABLE inzicht_requests (
 organization_id TEXT NOT NULL, actor_id TEXT NOT NULL, request_key TEXT NOT NULL, request_hash TEXT NOT NULL, response TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(organization_id,actor_id,request_key), FOREIGN KEY(organization_id,actor_id) REFERENCES memberships(organization_id,id)
);
CREATE INDEX observation_learner ON teacher_observations(organization_id,group_id,learner_id);
CREATE INDEX evidence_learner ON evidence_events(organization_id,group_id,learner_id,skill_id);
CREATE INDEX outbox_pending ON outbox_events(organization_id,group_id,status);
CREATE INDEX teacher_scope ON group_teachers(organization_id,membership_id);
