import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { inspectBatch, stageBatch, applyBatch, locateBatch, sourceSnapshot, batchScope, sha256, canonical } from './import-content-batch.mjs';
import { importedCollections, importedExercise } from '../lib/imported-practice.ts';
import { gradeContentResponse } from '../lib/imported-practice-contract.ts';
import { updateLearningReview } from '../lib/learning-review.ts';
import { batchSchema, registrySchema } from './content-batch-schema.mjs';

const task = { id: 'test-task', domain: 'spelling', level: 'Alfa B', axis: 'literacy', title: 'Technische testfixture', objective: 'Alleen importlogica testen.', sourceIds: ['klink-woord-mat'], mode: 'text', prompt: 'Typ mat.', stimulus: 'mat', options: [], correctOptionIds: [], acceptedAnswers: ['mat'], feedback: { correct: 'Gelijk.', retry: 'Kijk opnieuw.' }, teacherGuidance: 'Geen productielesmateriaal.', prerequisites: ['Technische test.'] };
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'klink-batch-')), root = join(dir, 'repo'), folder = join(dir, 'batch');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(root, 'data'), { recursive: true }); mkdirSync(join(folder, 'files'), { recursive: true });
  const data = {
    'klink-curriculum': { words: [{ id: 'klink-woord-mat', word: 'mat' }] },
    'klink-connected-content': { items: [] }, 'klink-content-routing': { steps: [{ id: 'klink-leesstap-01' }] },
    'klink-lexicon-wordbuild-20': { words: [{ id: 'TL0001', selectedMeaningIds: ['TL0001.S01', 'TL0001.S02'] }] },
    'klink-lexicon-wordbuild-rest': { packs: [] }, 'klink-sounds': { sounds: { a: {}, m: {}, t: {} } },
    'klink-imported-practice': { schemaVersion: 1, items: [{ ...task, id: 'existing-task', stimulus: 'tas', acceptedAnswers: ['tas'] }] },
  };
  for (const [name, value] of Object.entries(data)) writeFileSync(join(root, 'data', `${name}.json`), JSON.stringify(value));
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-b', 'codex/test'); git('add', '.'); git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Fixture');
  const manifest = { schemaVersion: 1, batchCode: 'TEST-001', version: 1, producerProcessId: 'test-producer', owner: 'synthetic-test', driveFolderId: 'synthetic-folder', baseCommit: git('rev-parse', 'HEAD'), baseBankSha256: sha256(readFileSync(join(root, 'data/klink-imported-practice.json'))), sourceSnapshotSha256: sourceSnapshot(root).sha256, productionStatus: 'ready', files: [], objects: [{ id: task.id, version: 1, kind: 'exercise', payloadFileId: 'payload', wordRefs: [{ id: 'klink-woord-mat' }], sourceRefs: ['klink-woord-mat'], dependsOn: [], mediaRefs: [], level: task.level, objective: task.objective, destination: { adapter: 'imported-practice', role: 'learner', route: '#learner/chapters/spelling' }, lessonContext: { bookGoal: 'Testdoel', lessonPlan: 'Testles', observationEvidenceFileId: 'lesson-proof' }, assessment: { mode: 'answer', masteryClaim: false, reportingGoal: 'Testpoging, geen beheersing.' }, publicationStatus: 'unpublished', expectedPreviousSha256: null }], reviews: [] };
  const addFile = (id, content, mimeType = typeof content === 'string' ? 'text/plain' : 'application/json') => {
    const bytes = typeof content === 'string' ? content : JSON.stringify(content), path = `files/${id}.txt`;
    writeFileSync(join(folder, path), bytes);
    const entry = { id, path, sha256: sha256(bytes), mimeType, driveFileId: `synthetic-${id}` };
    const index = manifest.files.findIndex(file => file.id === id);
    if (index < 0) manifest.files.push(entry); else manifest.files[index] = entry;
  };
  addFile('payload', task, 'application/json'); addFile('lesson-proof', 'Synthetisch lesplanbewijs; geen onderwijsreview.');
  for (const stage of ['internal', 'independent-ai', 'technical']) { addFile(stage, `Synthetisch bewijs ${stage}; geen echte review.`); manifest.reviews.push({ stage, processId: `process-${stage}`, reviewer: 'test', evidenceFileId: stage, scopeSha256: '0'.repeat(64), status: 'accepted', openCritical: 0 }); }
  const save = (seal = true) => { if (seal) for (const review of manifest.reviews) review.scopeSha256 = batchScope(manifest); writeFileSync(join(folder, 'manifest.json'), JSON.stringify(manifest)); };
  save(); return { dir, root, folder, manifest, save, addFile, git };
}
test('A verified batch stages its complete evidence and reaches the actual collection/answer/progress adapters', t => {
  const f = fixture(t), before = readFileSync(join(f.root, 'data/klink-imported-practice.json'));
  const result = inspectBatch(f.root, f.folder); assert.deepEqual(result.report.issues, []); assert.deepEqual(result.report.blockers, []);
  const destination = join(f.dir, 'stage'); stageBatch(f.root, f.folder, destination);
  assert.deepEqual(readFileSync(join(f.root, 'data/klink-imported-practice.json')), before);
  assert.deepEqual(readFileSync(join(destination, 'files/payload.txt')), readFileSync(join(f.folder, 'files/payload.txt')));
  assert.equal(inspectBatch(f.root, destination).report.technicalAcceptance, 'eligible-for-local-import');
  const collection = importedCollections('content-spelling', [result.next.items.at(-1)])[0];
  assert.equal(collection.exercises[0].exerciseId, 'content:test-task');
  assert.equal(gradeContentResponse(task, 'Mat').correct, false); assert.equal(gradeContentResponse(task, 'mat').correct, true);
  const exercise = importedExercise(task), state = {};
  assert.equal(exercise.independentReading, false); assert.equal(updateLearningReview(state, { ...exercise, correct: true, attempts: 1, helpUsed: false }), state);
  assert.throws(() => stageBatch(f.root, f.folder, destination), /bestaat al/);
});
test('Local application preserves previous items, records versions and retains a byte-exact recovery bank', t => {
  const f = fixture(t), path = join(f.root, 'data/klink-imported-practice.json'), before = readFileSync(path), dest = join(f.dir, 'applied');
  assert.equal(applyBatch(f.root, f.folder, dest).technicalAcceptance, 'locally-imported');
  const bank = JSON.parse(readFileSync(path)); assert.equal(bank.items.length, 2); assert.deepEqual(bank.items[0], JSON.parse(before).items[0]);
  assert.equal(bank.batchImports[0].objects[0].version, 1); assert.deepEqual(readFileSync(join(dest, 'previous-bank.json')), before);
  assert.equal(JSON.parse(readFileSync(join(dest, 'import-report.json'))).publication, 'not-published');
  assert.throws(() => applyBatch(f.root, f.folder, join(f.dir, 'again')), /schone/);
  assert(inspectBatch(f.root, f.folder).report.blockers.some(issue => issue.includes('al verwerkt')));
});
test('Unknown fields, duplicate IDs, bad types and malformed manifests fail schema validation', t => {
  const f = fixture(t);
  for (const change of [m => m.unknown = true, m => m.objects[0].version = '1', m => m.objects.push(structuredClone(m.objects[0])), m => m.files[0].path = '/etc/passwd']) {
    const before = structuredClone(f.manifest); change(f.manifest); f.save(); assert.throws(() => inspectBatch(f.root, f.folder)); Object.keys(f.manifest).forEach(k => delete f.manifest[k]); Object.assign(f.manifest, before);
  }
});
test('Changed bytes, path traversal, missing files and symlinks outside the batch fail closed', t => {
  const f = fixture(t); writeFileSync(join(f.folder, 'files/payload.txt'), '{}'); assert.throws(() => inspectBatch(f.root, f.folder), /hash/);
  f.addFile('payload', task); f.manifest.files[0].path = 'files/../../outside'; f.save(); assert.throws(() => inspectBatch(f.root, f.folder), /pakketpad/);
  f.manifest.files[0].path = 'files/outside'; symlinkSync(join(f.root, 'data/klink-imported-practice.json'), join(f.folder, 'files/outside')); f.save(); assert.throws(() => inspectBatch(f.root, f.folder), /buiten pakket/);
  f.manifest.files[0].path = 'files/missing'; f.save(); assert.throws(() => inspectBatch(f.root, f.folder));
});
test('Review is version-bound and must have an independent process and three distinct evidence files', t => {
  const f = fixture(t); f.manifest.objects[0].lessonContext.lessonPlan = 'Gewijzigde les'; f.save(false); assert.equal(inspectBatch(f.root, f.folder).report.blockers.filter(x => x.startsWith('Review')).length, 3);
  f.manifest.reviews[1].processId = f.manifest.producerProcessId; f.save(); assert(inspectBatch(f.root, f.folder).report.blockers.some(x => x.includes('afzonderlijk')));
  f.manifest.reviews[1].processId = 'another'; f.manifest.reviews[2].evidenceFileId = 'internal'; f.save(); assert(inspectBatch(f.root, f.folder).report.blockers.some(x => x.includes('hetzelfde')));
  f.manifest.reviews = []; f.save(); const dest = join(f.dir, 'blocked'); stageBatch(f.root, f.folder, dest); assert(!existsSync(join(dest, 'proposed-bank.json')));
  assert.throws(() => applyBatch(f.root, f.folder, join(f.dir, 'reject')), /geblokkeerd/);
});
test('Canonical words require known identities and a selected exact sense for Lexicon words', t => {
  const f = fixture(t);
  for (const ref of [{ id: 'new-word' }, { id: 'TL0001' }, { id: 'TL0001', meaningId: 'TL0001.S99' }]) { f.manifest.objects[0].wordRefs = [ref]; f.save(); assert(inspectBatch(f.root, f.folder).report.issues.some(x => x.includes('woordbetekenis'))); }
  f.manifest.objects[0].wordRefs = [{ id: 'klink-woord-mat' }, { id: 'TL0001', meaningId: 'TL0001.S01' }]; f.save(); assert.deepEqual(inspectBatch(f.root, f.folder).report.issues, []);
});
test('Missing sources, targets, software routes and circular dependencies are detected', t => {
  const f = fixture(t); f.manifest.objects[0].sourceRefs = ['unknown']; f.save(); assert(inspectBatch(f.root, f.folder).report.issues.length);
  f.manifest.objects[0].sourceRefs = ['klink-woord-mat']; f.manifest.objects[0].destination.route = '#invented'; f.save(); assert(inspectBatch(f.root, f.folder).report.blockers.some(x => x.includes('oefenbestemming')));
  f.manifest.objects[0].dependsOn = ['test-task']; f.save(); assert.throws(() => inspectBatch(f.root, f.folder), /Cyclische/);
  f.manifest.objects[0].dependsOn = ['missing']; f.save(); assert.throws(() => inspectBatch(f.root, f.folder), /Afhankelijkheid/);
});
test('Private producer fields cannot be silently discarded or laundered into a generic task', t => {
  const f = fixture(t);
  for (const patch of [{ stimulusDelivery: 'teacher-only' }, { audioRequired: true }, { presentationPolicy: { hideTarget: true } }, { mode: 'text', acceptedAnswers: [] }]) { f.addFile('payload', { ...task, ...patch }); f.save(); assert(inspectBatch(f.root, f.folder).report.issues.length); }
});
test('Content cards must agree with payload, and unresolved media can never enter the media-less player', t => {
  const f = fixture(t); f.manifest.objects[0].objective = 'Andere inhoud'; f.save(); assert(inspectBatch(f.root, f.folder).report.issues.some(x => x.includes('verschillen')));
  f.manifest.objects[0].objective = task.objective; f.manifest.objects[0].mediaRefs = ['missing']; f.save(); const r = inspectBatch(f.root, f.folder).report; assert(r.issues.some(x => x.includes('mediaobject'))); assert(r.blockers.some(x => x.includes('media-aansluiting')));
});
test('Existing tasks need exact before-hash, a next version and an explicit replacement', t => {
  const f = fixture(t), previous = JSON.parse(readFileSync(join(f.root, 'data/klink-imported-practice.json'))).items[0];
  f.manifest.objects[0].id = previous.id; f.addFile('payload', { ...task, id: previous.id }); f.save(); assert(inspectBatch(f.root, f.folder).report.issues.some(x => x.includes('versievast')));
  f.manifest.objects[0].version = 2; f.manifest.objects[0].expectedPreviousSha256 = sha256(canonical(previous)); f.save(); const r = inspectBatch(f.root, f.folder); assert.deepEqual(r.report.issues, []); assert.equal(r.next.items.length, 1); assert.equal(r.report.changes[0].action, 'replace');
});
test('An identical task with a new ID is refused', t => {
  const f = fixture(t); f.addFile('payload', { ...task, stimulus: 'tas', acceptedAnswers: ['tas'] }); f.save(); assert(inspectBatch(f.root, f.folder).report.issues.some(x => x.includes('andere identiteit')));
});
test('Stale source state and changes in the bank block import even if the producer seals the batch again', t => {
  const f = fixture(t); f.manifest.baseCommit = 'f'.repeat(40); f.manifest.sourceSnapshotSha256 = 'a'.repeat(64); f.manifest.baseBankSha256 = 'b'.repeat(64); f.save(); assert.equal(inspectBatch(f.root, f.folder).report.blockers.length, 3);
});
test('Application is refused on main, on dirty branches and when an import lock exists', t => {
  const f = fixture(t); f.git('branch', '-m', 'main'); assert.throws(() => applyBatch(f.root, f.folder, join(f.dir, 'out')), /schone codex/);
  f.git('branch', '-m', 'codex/test'); writeFileSync(join(f.root, 'unrelated'), 'keep'); assert.throws(() => applyBatch(f.root, f.folder, join(f.dir, 'out')), /schone/);
  rmSync(join(f.root, 'unrelated')); writeFileSync(join(f.root, '.git-content-import.lock'), 'another import'); assert.throws(() => applyBatch(f.root, f.folder, join(f.dir, 'out'))); assert.equal(readFileSync(join(f.root, '.git-content-import.lock'), 'utf8'), 'another import');
});

test('A shared text is kept once in the batch and projected exactly into multiple existing exercises', t => {
  const f = fixture(t), source = { ...structuredClone(f.manifest.objects[0]), id: 'shared-text', kind: 'text', payloadFileId: 'source', sourceRefs: [], destination: { adapter: 'shared-source', role: 'shared', route: '#learner/chapters/spelling' }, assessment: { mode: 'none', masteryClaim: false, reportingGoal: 'Bron.' } };
  f.addFile('source', { title: 'Testbron', text: 'mat', format: 'sentence' }); f.manifest.objects.push(source);
  f.manifest.objects[0].sourceRefs.push('shared-text'); f.addFile('payload', { ...task, sourceIds: ['klink-woord-mat', 'shared-text'] }); f.save(); assert.deepEqual(inspectBatch(f.root, f.folder).report.issues, []);
  f.addFile('source', { title: 'Testbron', text: 'andere tekst', format: 'sentence' }); f.save(); assert(inspectBatch(f.root, f.folder).report.issues.some(x => x.includes('getoonde bron')));
});
test('Media and worksheets are preserved completely but remain blocked until their runtime adapters exist', t => {
  const f = fixture(t), base = f.manifest.objects[0];
  f.addFile('sound-bytes', 'Synthetic, not real audio.'); f.addFile('media-payload', { fileId: 'sound-bytes', role: 'target', rightsStatus: 'open', reviewStatus: 'open', voiceId: 'target-voice', metadataEvidenceFileId: 'technical' });
  f.manifest.objects.push({ ...structuredClone(base), id: 'media', kind: 'media', payloadFileId: 'media-payload', destination: { adapter: 'media-register', role: 'shared', route: '#learner/sounds' }, assessment: { ...base.assessment, mode: 'none' } });
  f.addFile('paper', 'Synthetic worksheet.'); f.addFile('worksheet-payload', { title: 'Testwerkblad', fileId: 'paper', description: 'Geen productie.' });
  f.manifest.objects.push({ ...structuredClone(base), id: 'worksheet', kind: 'worksheet', payloadFileId: 'worksheet-payload', destination: { adapter: 'worksheet', role: 'teacher', route: '#teacher/materials' }, assessment: { ...base.assessment, mode: 'none' } });
  f.save(); const output = join(f.dir, 'media-stage'), report = stageBatch(f.root, f.folder, output);
  assert.deepEqual(report.issues, []); assert.equal(report.blockers.length, 2); assert.equal(readFileSync(join(output, 'files/sound-bytes.txt'), 'utf8'), 'Synthetic, not real audio.'); assert(!existsSync(join(output, 'proposed-bank.json')));
  f.manifest.objects[1].id = 'instruction'; f.addFile('media-payload', { fileId: 'sound-bytes', role: 'instruction', rightsStatus: 'open', reviewStatus: 'open' }); f.save(); assert(inspectBatch(f.root, f.folder).report.issues.some(x => x.includes('exacte stem')));
});
test('Unchanged existing content cannot create a duplicate and source IDs cannot be repurposed', t => {
  const f = fixture(t), previous = JSON.parse(readFileSync(join(f.root, 'data/klink-imported-practice.json'))).items[0]; f.manifest.objects[0].id = previous.id; f.addFile('payload', previous); f.save(); const result = inspectBatch(f.root, f.folder); assert.equal(result.report.changes[0].action, 'unchanged'); assert.equal(result.next.items.length, 1);
  f.manifest.objects[0].id = 'klink-woord-mat'; f.addFile('payload', { ...task, id: 'klink-woord-mat' }); f.save(); assert(inspectBatch(f.root, f.folder).report.issues.some(x => x.includes('canonieke bronidentiteit')));
});

test('Batch code lookup requires exactly one active version and returns the pinned Drive identity', () => {
  const row = { batchCode: 'TEST-001', version: 1, active: true, manifestDriveFileId: 'test-manifest', driveFolderId: 'test-folder', manifestSha256: 'a'.repeat(64), production: 'pending', review: 'pending', repair: 'open', import: 'not-imported', tests: 'not-run', release: 'not-approved', publication: 'not-published', evidenceDriveFileIds: [], publishedCommit: null };
  assert.equal(locateBatch({ schemaVersion: 1, batches: [row] }, 'TEST-001').manifestDriveFileId, 'test-manifest');
  for (const batches of [[], [row, row], [row, { ...row, version: 2 }]]) assert.throws(() => locateBatch({ schemaVersion: 1, batches }, 'TEST-001'));
  assert.equal(locateBatch({ schemaVersion: 1, batches: [{ ...row, active: false }, { ...row, version: 2 }] }, 'TEST-001').version, 2);
});

test('Published exchange schemas match the executable validation schemas', () => {
  assert.deepEqual(JSON.parse(readFileSync(new URL('../docs/content-import/batch.schema.json', import.meta.url))), batchSchema);
  assert.deepEqual(JSON.parse(readFileSync(new URL('../docs/content-import/register.schema.json', import.meta.url))), registrySchema);
});

test('Nested presentation requirements and duplicated review bytes cannot bypass acceptance', t => {
  const f = fixture(t);
  f.addFile('payload', { ...task, feedback: { ...task.feedback, audioRequired: true } }); f.save(); assert(inspectBatch(f.root, f.folder).report.issues.some(x => x.includes('feedback.audioRequired')));
  f.addFile('payload', task); f.addFile('independent-ai', readFileSync(join(f.folder, 'files/internal.txt'), 'utf8')); f.save(); assert(inspectBatch(f.root, f.folder).report.blockers.some(x => x.includes('inhoudelijk hetzelfde')));
});
