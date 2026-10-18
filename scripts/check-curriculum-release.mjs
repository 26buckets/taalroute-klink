import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { klinkContexts } from '../lib/klink-context.ts';
import { groupInstructionNeeds } from '../lib/group-practice.ts';
import { extendedInstructionNeeds } from '../lib/extended-practice.ts';
import { resolveRegisteredAudio } from '../lib/audio-register.ts';
import { instructionAudioEnabled } from '../lib/audio-policy.ts';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const readiness = read('../data/klink-release-readiness.json');
const media = read('../data/klink-media.json');
const release = read('../data/klink-curriculum.json');
const instructions = read('../data/klink-instructions.json');
const comprehensionAudio = read('../data/klink-comprehension-audio.json');
const connectedContent = read('../data/klink-connected-content.json');
const issues = [];
let ownerAuthorized = false;
const authorizationPath = 'docs/klink-owner-release-picture-guide-20261018.json';
const previousAuthorizationPath = 'docs/klink-owner-release-compact-route-20261018.json';
try {
  const approval = JSON.parse(readFileSync(authorizationPath));
  const previous = JSON.parse(readFileSync(previousAuthorizationPath));
  if (approval.previousAuthorization !== previousAuthorizationPath || Object.keys(previous.files).some(file => !approval.files?.[file])) throw Error('Previous approval scope must be retained');
  const required = ['lib/group-practice.ts', 'lib/extended-practice.ts', 'lib/mixed-practice.ts', 'data/klink-functional-writing.json', 'data/klink-audio-policy.json', 'lib/learning-paths.ts', 'lib/learning-review.ts', 'data/klink-learning-rules.json', 'components/product/learning-path-surface.tsx', 'data/klink-learning-paths-release.json'];
  required.push('lib/learner-route.ts', 'lib/content-levels.ts', 'components/product/route-settings.tsx', 'components/product/practice-line.tsx', 'components/product/package-experience.tsx', 'components/product/learner-app.tsx', 'data/klink-teacher-manual.json', 'docs/KLINK-DOCENTHANDLEIDING.md', 'docs/KLINK-GOEDGEKEURDE-NAVIGATIE-20261018.md');
  required.push('components/product/teacher-picture-guide.tsx', 'lib/teacher-picture-guide.ts');
  if (approval.approvedBy !== 'Nico' || !approval.userRequest || required.some(file => !approval.files?.[file])) throw Error('Incomplete scoped approval');
  execFileSync('git', ['merge-base', '--is-ancestor', approval.contentSourceCommit, 'HEAD']);
  for (const [file, hash] of Object.entries(approval.files)) {
    if (createHash('sha256').update(readFileSync(file)).digest('hex') !== hash) throw Error(`Approval no longer covers ${file}`);
  }
  ownerAuthorized = true;
} catch { issues.push('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'); }
const ownerRelease = record => ownerAuthorized && [authorizationPath, previousAuthorizationPath, 'docs/klink-owner-release-route-panel-20261018.json', 'docs/klink-owner-release-round3-20261018.json'].includes(record.ownerAuthorization);
try {
  const learning = read('../data/klink-learning-paths-release.json');
  if (!learning.publicationApproved || !ownerRelease(learning)) issues.push('De nieuwe leerreeksen wachten op actuele inhoudsgebonden vrijgave; het oude akkoord geldt niet voor nieuwe uitleg en samenstellingen.');
} catch { issues.push('Het vrijgaverecord van de nieuwe leerreeksen ontbreekt.'); }
if (!instructionAudioEnabled) {
  const policy = read('../data/klink-audio-policy.json');
  const exclusions = readFileSync('public/.assetsignore', 'utf8');
  if (policy.approvedBy !== 'Nico' || !policy.userRequest || !exclusions.includes('/package-audio/instructions/**') || !exclusions.includes('/audio/pb/instructie*') || policy.withdrawnFiles.some(path => !exclusions.includes(path))) issues.push('De ingetrokken instructieaudio is niet volledig uitgesloten van publicatie.');
}
try {
  const mixed = read('../data/klink-mixed-practice-release.json');
  if (!mixed.publicationApproved || (mixed.combinationReview !== 'approved' && !ownerRelease(mixed))) issues.push('De nieuwe gemengde oefenrondes wachten op inhoudelijke beoordeling.');
} catch { issues.push('Het vrijgaverecord voor de gemengde oefenrondes ontbreekt.'); }
try {
  const group = read('../data/klink-group-practice-release.json');
  if (!group.publicationApproved || (group.combinationReview !== 'approved' && !ownerRelease(group)) || (instructionAudioEnabled && group.instructionAudioReview !== 'approved')) issues.push('De nieuwe groepsoefeningen wachten op combinatiebeoordeling en passende instructie-audio.');
} catch { issues.push('Het vrijgaverecord voor de groepsoefeningen ontbreekt.'); }
try {
  const extended = read('../data/klink-extended-practice-release.json');
  if (!extended.publicationApproved || (extended.contentReview !== 'approved' && !ownerRelease(extended)) || (instructionAudioEnabled && extended.instructionAudioReview !== 'approved')) issues.push('De uitbreiding met begrip, klanken en taalgebruik wacht op inhoudelijke en instructie-audiovrijgave.');
} catch { issues.push('Het vrijgaverecord van de inhoudelijke uitbreiding ontbreekt.'); }
for (const need of instructionAudioEnabled ? [...groupInstructionNeeds, ...extendedInstructionNeeds] : []) {
  const src = resolveRegisteredAudio(need.id, need.text, 'instruction');
  if (!src || !existsSync(`public${src}`)) issues.push(`De gecontroleerde groepsinstructie ontbreekt: ${need.id}.`);
}
const sections = read('../data/klink-sections.json');
if (sections.release.id !== readiness.sectionEdition || createHash('sha256').update(readFileSync('data/klink-sections.json')).digest('hex') !== readiness.sectionExportSha256) issues.push('De onderdelenindeling wijkt af van de vastgezette Lexicon-export.');
execFileSync(process.execPath, ['--test', 'scripts/test-sections.mjs'], { stdio: 'inherit' });
if (!readiness.publicationApproved) issues.push('De nieuwe inhoud is nog niet vrijgegeven.');
try {
  const approval = JSON.parse(readFileSync(readiness.approvalRecord));
  if (approval.approvedBy !== 'Nico' || !approval.userAnswer || !approval.contentSourceCommit) issues.push('Het vastgelegde publicatieakkoord is onvolledig.');
  else execFileSync('git', ['merge-base', '--is-ancestor', approval.contentSourceCommit, 'HEAD']);
} catch { issues.push('Het vastgelegde publicatieakkoord ontbreekt of past niet bij deze bron.'); }
if (execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }).trim()) issues.push('Leg de gecontroleerde bronwijzigingen eerst vast in een commit.');
if (!readiness.baseline.commitToLiveVersionProven) issues.push('De broncommit van de liveversie moet nog aantoonbaar worden bevestigd.');
try {
  const proof = JSON.parse(readFileSync(readiness.baseline.proofFile));
  const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  const validArchive = readiness.baseline.proofType === 'published-release-marker-and-byte-comparison'
    ? proof.proofType === readiness.baseline.proofType && hash(proof.sourceArchiveSha256)
      && proof.liveRelease?.sourceCommit === proof.sourceCommit && proof.liveRelease?.sourceClean === true
      && proof.liveRelease?.branch === readiness.canonicalBranch
      && proof.mediaChecked > 0 && proof.mediaChecked === proof.expectedMedia
      && Array.isArray(proof.errors) && proof.errors.length === 0
    : readiness.baseline.proofType === 'original-publication-record-and-fresh-application-module-check'
      && hash(proof.originalArchiveSha256);
  if (proof.sourceCommit !== readiness.baseline.sourceCommit || proof.liveWorkerVersion !== readiness.baseline.liveWorkerVersion || proof.sourceCommitDocumented !== true || !validArchive || !hash(proof.freshClientSha256)) {
    issues.push('Het herkomstbewijs past niet bij de vastgezette publicatiebasis.');
  }
} catch { issues.push('Het onderliggende herkomstbewijs ontbreekt of is onleesbaar.'); }
if (execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim() !== readiness.canonicalBranch) issues.push('Publiceer uitsluitend vanuit de canonieke branch.');
execFileSync('git', ['merge-base', '--is-ancestor', readiness.baseline.sourceCommit, 'HEAD']);
if (readiness.wordPronunciationReview !== 'approved') issues.push('De uitspraakcontrole staat open.');
if (readiness.imageMeaningReview !== 'approved') issues.push('De woord-beeldcontrole staat open.');
if (instructionAudioEnabled && readiness.instructionAudioCoverage !== 'complete') issues.push('Niet elke oefenvorm heeft gecontroleerde instructie-audio.');
const missingInstructions = instructions.items.filter(item => !item.src);
if (instructionAudioEnabled && missingInstructions.length) issues.push(`${missingInstructions.length} instructieopnamen moeten nog worden geproduceerd.`);
if (instructions.voiceId === instructions.targetVoiceId) issues.push('De instructiestem moet verschillen van de doeltaalstem.');
if (instructionAudioEnabled && instructions.humanReview !== 'approved') issues.push('De instructie-audio is nog niet inhoudelijk vrijgegeven.');
if (readiness.sentenceComprehensionReview !== 'approved' || comprehensionAudio.humanReview !== 'approved') issues.push('De begripsvragen en bijbehorende vraag-, hulp- en antwoordaudio wachten op menselijke vrijgave.');
if (comprehensionAudio.instructionVoiceId === comprehensionAudio.targetVoiceId) issues.push('Vraag- en steunstem moeten verschillen van de doeltaalstem.');
if (klinkContexts.some(item => item.humanReview !== 'approved')) issues.push('De zinnen en situaties wachten op inhoudelijke en luistervrijgave.');
if (readiness.connectedContentReview !== 'approved' || connectedContent.humanReview !== 'approved') issues.push('De aangesloten bestaande zinnen, teksten en gesprekken wachten op inhoudelijke en luistervrijgave.');
const missing = release.words.filter(word => !media[word.id]?.audio);
if (missing.length) issues.push(`${missing.length} betekenissen hebben nog geen gekoppelde woordopname.`);
const missingImages = release.words.filter(word => !media[word.id]?.image);
if (missingImages.length) issues.push(`${missingImages.length} betekenissen hebben nog geen gekoppeld betekenisbeeld.`);
if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
else {
  execFileSync(process.execPath, ['scripts/check-klink-media-files.mjs'], { stdio: 'inherit' });
  execFileSync(process.execPath, ['scripts/check-connected-audio.mjs'], { stdio: 'inherit' });
  console.log('Publicatiebasis en inhoudelijke vrijgave gecontroleerd.');
}
