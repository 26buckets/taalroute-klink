import { readFileSync, writeFileSync, realpathSync, statSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, openSync, closeSync } from 'node:fs';
import { resolve, relative, isAbsolute, join, dirname, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateBatchSchema, validateReference, validateSource, validateMaterial, validateMedia, validateRegistry } from './content-batch-schema.mjs';
import { importedItemIssues } from '../lib/imported-practice-contract.ts';
import { importedRoutes } from '../lib/imported-practice.ts';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const digest = value => sha256(canonical(value));
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const git = (root, ...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
const bankPath = 'data/klink-imported-practice.json';
const sourcePaths = ['data/klink-curriculum.json', 'data/klink-connected-content.json', 'data/klink-content-routing.json', 'data/klink-lexicon-wordbuild-20.json', 'data/klink-lexicon-wordbuild-rest.json', 'data/klink-sounds.json'];

export function locateBatch(registry, batchCode) {
  if (!validateRegistry(registry)) throw Error(`Registerschema: ${canonical(validateRegistry.errors)}`);
  unique(registry.batches.map(row => `${row.batchCode}@${row.version}`), 'batchversie');
  const matches = registry.batches.filter(row => row.batchCode === batchCode && row.active);
  if (matches.length !== 1) throw Error(`Batchcode ${batchCode}: ${matches.length} actieve versies; geen automatische keuze.`);
  return matches[0];
}

export function sourceSnapshot(root) {
  const files = Object.fromEntries(sourcePaths.map(path => [path, sha256(readFileSync(join(root, path)))]));
  const curriculum = read(join(root, sourcePaths[0]));
  const packs = [read(join(root, sourcePaths[3])), ...read(join(root, sourcePaths[4])).packs];
  const words = new Map([...curriculum.words, ...packs.flatMap(pack => pack.words)].map(word => [word.id, word]));
  const sources = new Set([...words.keys(), ...read(join(root, sourcePaths[1])).items.map(item => item.id), ...read(join(root, sourcePaths[2])).steps.map(step => step.id)]);
  return { files, sha256: digest(files), words, sources, sounds: new Set(Object.keys(read(join(root, sourcePaths[5])).sounds)) };
}

export function batchScope(manifest) {
  // Reviews bind every payload, placement and dependency, not the editable review verdicts themselves.
  const { reviews: _reviews, ...scope } = manifest;
  return digest(scope);
}

function safeFile(root, path) {
  if (isAbsolute(path) || path.includes('\\') || path.split('/').some(part => ['..', '.', ''].includes(part))) throw Error(`Ongeldig pakketpad: ${path}`);
  const file = realpathSync(resolve(root, path));
  const rel = relative(realpathSync(root), file);
  if (rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel) || !statSync(file).isFile()) throw Error(`Bestand buiten pakket: ${path}`);
  return file;
}
function unique(values, label) {
  if (new Set(values).size !== values.length) throw Error(`Dubbele ${label}.`);
}

export function inspectBatch(root, folder) {
  const manifestBytes = readFileSync(join(folder, 'manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  if (!validateBatchSchema(manifest)) throw Error(`Batchschema: ${canonical(validateBatchSchema.errors)}`);
  unique(manifest.objects.map(row => row.id), 'object-ID');
  unique(manifest.files.map(row => row.id), 'bestand-ID');
  unique(manifest.files.map(row => row.path), 'bestandspad');
  unique(manifest.reviews.map(row => row.stage), 'reviewstap');
  const files = new Map(manifest.files.map(row => {
    const path = safeFile(folder, row.path), bytes = readFileSync(path);
    if (!bytes.length || sha256(bytes) !== row.sha256) throw Error(`Bestandhash wijkt af: ${row.path}`);
    return [row.id, { ...row, bytes }];
  }));
  const file = id => { if (!files.has(id)) throw Error(`Bestandsreferentie ontbreekt: ${id}`); return files.get(id); };
  const snapshot = sourceSnapshot(root), objects = new Map(manifest.objects.map(row => [row.id, row]));
  const payloads = new Map(manifest.objects.map(row => [row.id, JSON.parse(file(row.payloadFileId).bytes)]));
  const blockers = [], issues = [];
  const requireValid = (validator, payload, id) => { if (!validator(payload)) issues.push(`${id}: payloadschema ${canonical(validator.errors)}`); };
  if (manifest.baseCommit !== git(root, 'rev-parse', 'HEAD')) blockers.push('Broncommit gewijzigd; maak een nieuw brongebonden manifest en review.');
  if (manifest.sourceSnapshotSha256 !== snapshot.sha256) blockers.push('Canonieke bronsnapshot gewijzigd.');
  const bankBytes = readFileSync(join(root, bankPath)), bank = JSON.parse(bankBytes);
  if (manifest.baseBankSha256 !== sha256(bankBytes)) blockers.push('Bestaande contentbank gewijzigd.');
  if (manifest.productionStatus !== 'ready') blockers.push('Productie is niet gereed.');
  const scope = batchScope(manifest);
  for (const stage of ['internal', 'independent-ai', 'technical']) {
    const review = manifest.reviews.find(row => row.stage === stage);
    if (!review || review.status !== 'accepted' || review.openCritical || review.scopeSha256 !== scope) blockers.push(`Review ${stage} ontbreekt, staat open of betreft een andere versie.`);
    if (review) file(review.evidenceFileId);
  }
  const independent = manifest.reviews.find(row => row.stage === 'independent-ai');
  if (independent && [manifest.producerProcessId, ...manifest.reviews.filter(row => row.stage !== 'independent-ai').map(row => row.processId)].includes(independent.processId)) blockers.push('Onafhankelijke AI-review heeft geen afzonderlijk proces.');
  if (new Set(manifest.reviews.map(row => row.evidenceFileId)).size !== manifest.reviews.length) blockers.push('Reviewstappen gebruiken hetzelfde bewijsbestand.');
  if (new Set(manifest.reviews.map(row => file(row.evidenceFileId).sha256)).size !== manifest.reviews.length) blockers.push('Reviewstappen gebruiken inhoudelijk hetzelfde bewijsbestand.');
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    if (visiting.has(id)) throw Error(`Cyclische afhankelijkheid: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const ref of objects.get(id).dependsOn) { if (!objects.has(ref)) throw Error(`Afhankelijkheid ontbreekt: ${ref}`); visit(ref); }
    visiting.delete(id); visited.add(id);
  }
  for (const row of manifest.objects) {
    visit(row.id);
    const payload = payloads.get(row.id);
    if (file(row.payloadFileId).mimeType !== 'application/json') issues.push(`${row.id}: payload moet application/json zijn.`);
    file(row.lessonContext.observationEvidenceFileId);
    if (!['word', 'sound', 'letter'].includes(row.kind) && snapshot.sources.has(row.id)) issues.push(`${row.id}: nieuw object gebruikt een bestaande canonieke bronidentiteit.`);
    for (const ref of row.wordRefs) {
      const word = snapshot.words.get(ref.id);
      if (!word || (word.selectedMeaningIds && !word.selectedMeaningIds.includes(ref.meaningId)) || (!word.selectedMeaningIds && ref.meaningId && ref.meaningId !== ref.id)) issues.push(`${row.id}: onbekende of onbepaalde woordbetekenis ${ref.id}.`);
    }
    for (const ref of row.sourceRefs) if (!snapshot.sources.has(ref) && !objects.has(ref)) issues.push(`${row.id}: onbekende bron ${ref}.`);
    for (const ref of row.mediaRefs) if (objects.get(ref)?.kind !== 'media') issues.push(`${row.id}: ontbrekend mediaobject ${ref}.`);
    if (['word', 'sound', 'letter'].includes(row.kind)) {
      requireValid(validateReference, payload, row.id);
      const known = row.kind === 'word' ? snapshot.words.has(payload.canonicalId) : snapshot.sounds.has(payload.canonicalId);
      if (!known || row.destination.adapter !== 'canonical-reference') issues.push(`${row.id}: canonieke referentie ongeldig; nieuwe identiteiten vragen een bronbesluit.`);
      if (row.kind === 'word' && !row.wordRefs.some(ref => ref.id === payload.canonicalId)) issues.push(`${row.id}: woordreferentie wijkt af.`);
    } else if (['sentence', 'text', 'document'].includes(row.kind)) {
      requireValid(validateSource, payload, row.id);
      if (row.destination.adapter !== 'shared-source') blockers.push(`${row.id}: bronadapter ontbreekt.`);
      if (!manifest.objects.some(other => other.kind === 'exercise' && other.sourceRefs.includes(row.id))) blockers.push(`${row.id}: gedeelde bron heeft nog geen oefenbestemming.`);
    } else if (row.kind === 'exercise') {
      issues.push(...importedItemIssues(payload).map(issue => `${row.id}: ${issue}`));
      const allowed = ['id', 'domain', 'level', 'axis', 'title', 'objective', 'sourceIds', 'mode', 'prompt', 'stimulus', 'options', 'correctOptionIds', 'acceptedAnswers', 'feedback', 'teacherGuidance', 'prerequisites', 'teacherReference', 'teacherWorkflow'];
      for (const key of Object.keys(payload)) if (!allowed.includes(key)) issues.push(`${row.id}: niet-ondersteund taakveld ${key}.`);
      const fields = (value, keys, label) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) for (const key of Object.keys(value)) if (!keys.includes(key)) issues.push(`${row.id}: niet-ondersteund taakveld ${label}.${key}.`);
      };
      fields(payload.feedback, ['correct', 'retry'], 'feedback');
      if (Array.isArray(payload.options)) for (const option of payload.options) fields(option, ['id', 'text'], 'option');
      fields(payload.teacherReference, ['correctOptionIds', 'acceptedAnswers', 'evidence', 'requiredSemanticSlots', 'meaningCheck', 'automaticCorrectness', 'showOnlyAfterInitialResponses'], 'teacherReference');
      if (Array.isArray(payload.teacherReference?.evidence)) for (const proof of payload.teacherReference.evidence) fields(proof, ['quote'], 'evidence');
      fields(payload.teacherWorkflow, ['kind', 'phases', 'materials', 'criteria', 'expected', 'help', 'targetWordIds', 'sourceLessonIds', 'countCategory', 'sourceHash'], 'teacherWorkflow');
      if (Array.isArray(payload.teacherWorkflow?.phases)) for (const phase of payload.teacherWorkflow.phases) {
        fields(phase, ['id', 'label', 'learnerText', 'instruction', 'response', 'fields', 'interlude', 'tiles', 'correction'], 'phase');
        fields(phase.correction, ['oldValue', 'activeValue'], 'correction');
      }
      const route = importedRoutes.find(route => route.domain === payload.domain);
      if (row.destination.adapter !== 'imported-practice' || row.destination.role !== 'learner' || row.destination.route !== `#learner/chapters/${route?.chapter}`) blockers.push(`${row.id}: geen ondersteunde oefenbestemming.`);
      if (payload.id !== row.id || payload.level !== row.level || payload.objective !== row.objective || row.assessment.mode !== (payload.mode === 'teacher' ? 'participation' : 'answer')) issues.push(`${row.id}: contentkaart en softwarekaart verschillen.`);
      for (const ref of payload.sourceIds || []) {
        if (!row.sourceRefs.includes(ref) || (!snapshot.sources.has(ref) && !['sentence', 'text', 'document'].includes(objects.get(ref)?.kind))) issues.push(`${row.id}: ongeldige taakbron ${ref}.`);
        if (snapshot.words.has(ref) && !row.wordRefs.some(word => word.id === ref)) issues.push(`${row.id}: taakwoord ontbreekt op de contentkaart: ${ref}.`);
        if (objects.has(ref) && payloads.get(ref)?.text !== payload.stimulus) issues.push(`${row.id}: getoonde bron wijkt af van gedeelde bron ${ref}.`);
      }
      for (const ref of payload.teacherWorkflow?.targetWordIds || []) if (!row.wordRefs.some(word => word.id === ref)) issues.push(`${row.id}: docentwoord niet op contentkaart: ${ref}.`);
      for (const ref of payload.teacherWorkflow?.sourceLessonIds || []) if (!snapshot.sources.has(ref)) issues.push(`${row.id}: docentles ontbreekt: ${ref}.`);
      if (row.mediaRefs.length) blockers.push(`${row.id}: deze bestaande speler heeft geen media-aansluiting.`);
    } else if (row.kind === 'media') {
      requireValid(validateMedia, payload, row.id);
      file(payload.fileId);
      if (['instruction', 'target'].includes(payload.role) && (!payload.voiceId || !payload.metadataEvidenceFileId)) issues.push(`${row.id}: exacte stem en audiometadatabewijs ontbreken.`);
      if (payload.metadataEvidenceFileId) file(payload.metadataEvidenceFileId);
      blockers.push(`${row.id}: media eerst via bestaande aparte media-/publicatiecontrole aansluiten.`);
    } else {
      requireValid(validateMaterial, payload, row.id); file(payload.fileId);
      blockers.push(`${row.id}: ${row.kind} bewaard voor review; runtimeadapter nog niet beschikbaar.`);
    }
  }
  const targetVoices = new Set([...payloads.values()].filter(row => row.role === 'target').map(row => row.voiceId));
  for (const [id, payload] of payloads) if (payload.role === 'instruction' && targetVoices.has(payload.voiceId)) issues.push(`${id}: instructie- en doeltaalstem gelijk.`);
  unique(bank.items.map(row => row.id), 'bestaand taak-ID');
  const merged = new Map(bank.items.map(row => [row.id, row])), changes = [];
  for (const row of manifest.objects.filter(row => row.kind === 'exercise')) {
    const payload = payloads.get(row.id), previous = merged.get(row.id);
    const previousVersion = (bank.batchImports || []).flatMap(item => item.objects).filter(item => item.id === row.id).at(-1)?.version ?? 1;
    if (previous && canonical(previous) === canonical(payload)) {
      if (row.version !== previousVersion) issues.push(`${row.id}: ongewijzigde inhoud behoudt haar bestaande versie.`);
      changes.push({ id: row.id, action: 'unchanged' }); continue;
    }
    if (previous && (row.expectedPreviousSha256 !== digest(previous) || row.version !== previousVersion + 1)) issues.push(`${row.id}: bestaande inhoud niet expliciet versievast vervangen.`);
    if (!previous && (row.expectedPreviousSha256 !== null || row.version !== 1)) issues.push(`${row.id}: nieuw object heeft ongeldige vorige versie.`);
    merged.set(row.id, payload); changes.push({ id: row.id, action: previous ? 'replace' : 'add' });
  }
  const imports = bank.batchImports || [];
  const previousBatch = imports.filter(item => item.batchCode === manifest.batchCode).at(-1);
  if (previousBatch && manifest.version <= previousBatch.version) blockers.push('Batchversie is al verwerkt; herhaal niet en overschrijf geen versie.');
  for (const change of changes.filter(change => change.action !== 'unchanged')) {
    const row = objects.get(change.id);
    const history = imports.flatMap(item => item.objects).filter(item => item.id === row.id).at(-1);
    if (history && row.version !== history.version + 1) issues.push(`${row.id}: objectversie moet precies één hoger zijn dan de vorige import.`);
    const task = payloads.get(row.id);
    const signature = item => digest({ domain: item.domain, level: item.level, mode: item.mode, prompt: item.prompt, stimulus: item.stimulus, options: item.options?.map(option => option.text).sort(), answers: item.mode === 'choice' ? item.options?.filter(option => item.correctOptionIds?.includes(option.id)).map(option => option.text).sort() : item.acceptedAnswers, teacherGuidance: item.mode === 'teacher' ? item.teacherGuidance : undefined });
    if ([...merged.values()].some(other => other.id !== row.id && signature(other) === signature(task))) issues.push(`${row.id}: dezelfde opdracht bestaat onder een andere identiteit.`);
  }
  const next = { ...bank, items: [...merged.values()], batchImports: [...imports, { batchCode: manifest.batchCode, version: manifest.version, manifestSha256: sha256(manifestBytes), objects: manifest.objects.filter(row => row.kind === 'exercise').map(row => ({ id: row.id, version: row.version, sha256: digest(payloads.get(row.id)) })) }] };
  return { manifest, manifestBytes, files, next, report: { schemaVersion: 1, batchCode: manifest.batchCode, version: manifest.version, manifestSha256: sha256(manifestBytes), scopeSha256: scope, baseCommit: manifest.baseCommit, baseBankSha256: sha256(bankBytes), sourceSnapshotSha256: snapshot.sha256, issues, blockers, changes, schemaValid: true, technicalAcceptance: issues.length || blockers.length ? 'blocked' : 'eligible-for-local-import', runtimeTests: 'not-run', publication: 'not-published', humanReview: 'not-inferred' } };
}

function saveStage(result, destination) {
  if (existsSync(destination)) throw Error('Uitvoermap bestaat al; behoud het eerdere bewijs.');
  mkdirSync(dirname(destination), { recursive: true });
  const temp = mkdtempSync(join(dirname(destination), '.batch-'));
  try {
    writeFileSync(join(temp, 'manifest.json'), result.manifestBytes);
    mkdirSync(join(temp, 'files'));
    for (const row of result.files.values()) { const target = join(temp, row.path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, row.bytes); }
    writeFileSync(join(temp, 'import-report.json'), JSON.stringify(result.report, null, 2) + '\n');
    if (result.report.technicalAcceptance === 'eligible-for-local-import') writeFileSync(join(temp, 'proposed-bank.json'), JSON.stringify(result.next, null, 2) + '\n');
    renameSync(temp, destination);
  } catch (error) { rmSync(temp, { recursive: true, force: true }); throw error; }
  return result.report;
}

export function stageBatch(root, folder, destination) {
  return saveStage(inspectBatch(root, folder), destination);
}

export function applyBatch(root, folder, destination) {
  if (!git(root, 'branch', '--show-current').startsWith('codex/') || git(root, 'status', '--porcelain', '--untracked-files=normal')) throw Error('Lokale import vereist een schone codex/-branch.');
  const lock = join(root, '.git-content-import.lock');
  const fd = openSync(lock, 'wx');
  try {
    const result = inspectBatch(root, folder);
    if (result.report.technicalAcceptance !== 'eligible-for-local-import') throw Error('Batch is geblokkeerd; bekijk eerst het stagingrapport.');
    saveStage(result, destination);
    const target = join(root, bankPath), temporary = target + '.import-tmp';
    writeFileSync(join(destination, 'previous-bank.json'), readFileSync(target), { flag: 'wx' });
    if (sha256(readFileSync(target)) !== result.report.baseBankSha256) throw Error('Contentbank veranderde tijdens import.');
    let owned = false;
    try { writeFileSync(temporary, JSON.stringify(result.next, null, 2) + '\n', { flag: 'wx' }); owned = true; renameSync(temporary, target); }
    catch (error) { if (owned && existsSync(temporary)) rmSync(temporary); throw error; }
    result.report.technicalAcceptance = 'locally-imported';
    writeFileSync(join(destination, 'import-report.json'), JSON.stringify(result.report, null, 2) + '\n');
    return result.report;
  } finally { closeSync(fd); rmSync(lock); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [mode, ...args] = process.argv.slice(2), root = resolve(import.meta.dirname, '..');
    if (mode === 'snapshot' && !args.length) console.log(JSON.stringify({ baseCommit: git(root, 'rev-parse', 'HEAD'), baseBankSha256: sha256(readFileSync(join(root, bankPath))), sourceSnapshotSha256: sourceSnapshot(root).sha256 }, null, 2));
    else if (mode === 'locate' && args.length === 2) console.log(JSON.stringify(locateBatch(read(resolve(args[0])), args[1]), null, 2));
    else if (['stage', 'apply'].includes(mode) && args.length === 2) {
      const report = (mode === 'stage' ? stageBatch : applyBatch)(root, resolve(args[0]), resolve(args[1]));
      console.log(JSON.stringify(report, null, 2));
      if (report.issues.length || report.blockers.length) process.exitCode = 2;
    } else throw Error('Gebruik: node scripts/import-content-batch.mjs snapshot | locate <register.json> <batchcode> | stage <batchmap> <nieuwe-bewijsmap> | apply <batchmap> <nieuwe-bewijsmap>');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
