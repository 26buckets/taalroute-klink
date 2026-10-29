import Ajv from 'ajv';

const text = { type: 'string', minLength: 1, pattern: '\\S' };
const hash = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const id = { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$' };
const list = (items, minItems = 0) => ({ type: 'array', items, minItems, uniqueItems: true });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
export const batchSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  ...object({
    schemaVersion: { const: 1 }, batchCode: id, version: { type: 'integer', minimum: 1 },
    producerProcessId: text, owner: text,
    driveFolderId: { type: 'string', pattern: '^[A-Za-z0-9_-]+$' },
    baseCommit: { type: 'string', pattern: '^[a-f0-9]{40}$' }, baseBankSha256: hash,
    sourceSnapshotSha256: hash, productionStatus: { enum: ['draft', 'ready'] },
    files: list(object({ id, path: { type: 'string', pattern: '^files/' }, sha256: hash, mimeType: text, driveFileId: text }), 1),
    objects: list(object({
      id, version: { type: 'integer', minimum: 1 },
      kind: { enum: ['word', 'sound', 'letter', 'sentence', 'text', 'document', 'exercise', 'teacher-guide', 'board', 'worksheet', 'media', 'objective', 'reporting'] },
      payloadFileId: id,
      wordRefs: list(object({ id, meaningId: text }, ['id'])),
      sourceRefs: list(id), dependsOn: list(id), mediaRefs: list(id),
      level: { enum: ['Alfa A', 'Alfa B', 'Alfa C', 'A1', 'A2', 'B1'] }, objective: text,
      destination: object({ adapter: { enum: ['imported-practice', 'shared-source', 'canonical-reference', 'media-register', 'teacher-plus', 'worksheet', 'reporting'] }, role: { enum: ['learner', 'teacher', 'shared'] }, route: text }),
      lessonContext: object({ bookGoal: text, lessonPlan: text, observationEvidenceFileId: id }),
      assessment: object({ mode: { enum: ['answer', 'participation', 'none'] }, masteryClaim: { const: false }, reportingGoal: text }),
      publicationStatus: { const: 'unpublished' },
      expectedPreviousSha256: { anyOf: [hash, { type: 'null' }] },
    }), 1),
    reviews: list(object({
      stage: { enum: ['internal', 'independent-ai', 'technical'] },
      processId: text, reviewer: text, evidenceFileId: id, scopeSha256: hash,
      status: { enum: ['accepted', 'changes-requested', 'pending'] }, openCritical: { type: 'integer', minimum: 0 },
    })),
  }),
};
const ajv = new Ajv({ allErrors: true, strict: true });
export const validateBatchSchema = ajv.compile(batchSchema);
export const validateReference = ajv.compile(object({ canonicalId: id }));
export const validateSource = ajv.compile(object({ title: text, text, format: text }));
export const validateMaterial = ajv.compile(object({ title: text, fileId: id, description: text }));
export const validateMedia = ajv.compile(object({
  fileId: id, role: { enum: ['instruction', 'target', 'image', 'video', 'other'] },
  rightsStatus: { enum: ['open', 'approved', 'rejected'] },
  reviewStatus: { enum: ['open', 'approved', 'rejected'] },
  voiceId: text, metadataEvidenceFileId: id,
}, ['fileId', 'role', 'rightsStatus', 'reviewStatus']));

export const registrySchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  ...object({ schemaVersion: { const: 1 }, batches: list(object({
    batchCode: id, version: { type: 'integer', minimum: 1 }, active: { type: 'boolean' },
    manifestDriveFileId: text, driveFolderId: text, manifestSha256: hash,
    production: { enum: ['pending', 'ready', 'blocked'] },
    review: { enum: ['pending', 'accepted', 'changes-requested'] },
    repair: { enum: ['not-required', 'open', 'rechecked'] },
    import: { enum: ['not-imported', 'blocked', 'locally-imported'] },
    tests: { enum: ['not-run', 'failed', 'passed'] },
    release: { enum: ['not-approved', 'approved'] },
    publication: { enum: ['not-published', 'published'] },
    evidenceDriveFileIds: list(text), publishedCommit: { anyOf: [{ type: 'string', pattern: '^[a-f0-9]{40}$' }, { type: 'null' }] },
  })) }),
};
export const validateRegistry = ajv.compile(registrySchema);
