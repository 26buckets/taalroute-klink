-- Non-destructive addition to PR8's school module. Existing observations and evidence remain unchanged.
INSERT INTO inzicht_schema VALUES (6, '2026-11-01');
CREATE TABLE source_observations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  learner_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  material_id TEXT NOT NULL CHECK(material_id IN ('mat','tas','map','man','pan','jas','pen','pet')),
  mode TEXT NOT NULL CHECK(mode IN ('word','sentence','text')),
  current_revision INTEGER NOT NULL DEFAULT 1 CHECK(current_revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(organization_id,id),
  FOREIGN KEY(organization_id,group_id,learner_id) REFERENCES group_memberships(organization_id,group_id,learner_id),
  FOREIGN KEY(organization_id,author_id) REFERENCES memberships(organization_id,id)
);
CREATE TABLE source_observation_revisions (
  organization_id TEXT NOT NULL,
  observation_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  payload TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY(organization_id,observation_id,revision),
  FOREIGN KEY(organization_id,observation_id) REFERENCES source_observations(organization_id,id),
  FOREIGN KEY(organization_id,changed_by) REFERENCES memberships(organization_id,id)
);
CREATE INDEX source_observations_by_learner
  ON source_observations(organization_id,group_id,learner_id,updated_at);
