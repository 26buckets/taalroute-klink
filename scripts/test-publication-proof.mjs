import { verifyDialogueRelease, readBeforeDialogueRelease } from './check-dialogue-release.mjs';
import { verifySoundAudioRelease, readBeforeSoundAudioRelease } from './check-sound-audio-release.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { verifyArticleReviewRelease, readBeforeArticleReview } from './check-article-review-release.mjs';
import { verifyWordLibraryRelease, readBeforeWordLibrary } from './check-word-library-release.mjs';
import { verifyWordAudioRelease } from './check-word-audio-release.mjs';

const baseline = JSON.parse(readFileSync('data/klink-release-readiness.json')).baseline;
const proof = JSON.parse(readFileSync(baseline.proofFile));
const dialogueRelease = verifyDialogueRelease();
  const readBeforeDialogues = file => readBeforeDialogueRelease(file, dialogueRelease);
  const verifiedSounds = verifySoundAudioRelease(undefined, readBeforeDialogues, dialogueRelease.baselineSourceCommit);
const readBeforeSounds = file => readBeforeSoundAudioRelease(file, verifiedSounds, readBeforeDialogues);
const wordLibrary = verifyWordLibraryRelease(undefined, readBeforeSounds, verifiedSounds.baselineSourceCommit);
const readPrevious = file => readBeforeWordLibrary(file, wordLibrary, readBeforeSounds);
const reviewedArticles = verifyArticleReviewRelease(undefined, readPrevious, wordLibrary.baselineSourceCommit);
const verifiedWordAudio = verifyWordAudioRelease(file => readBeforeArticleReview(file, reviewedArticles, readPrevious), reviewedArticles.baselineSourceCommit);
function check(candidate, changeApproval, changeImported, changeHeaderCss, changeWordbuild) {
  const dir = mkdtempSync(join(tmpdir(), 'klink-proof-test-'));
  try {
    mkdirSync(join(dir, 'scripts')); mkdirSync(join(dir, 'data')); mkdirSync(join(dir, 'lib'));
    cpSync('lib', join(dir, 'lib'), { recursive: true });
    cpSync('data', join(dir, 'data'), { recursive: true });
    for (const name of readdirSync('scripts').filter(name => /^check-.*\.mjs$/.test(name))) copyFileSync(join('scripts', name), join(dir, 'scripts', name));
    if (changeWordbuild) {
      const path = join(dir, 'data/klink-lexicon-wordbuild-rest.json');
      const file = 'data/klink-lexicon-wordbuild-rest.json';
      const before = verifiedWordAudio.files[file] ? execFileSync('git', ['show', `${verifiedWordAudio.baselineSourceCommit}:${file}`]) : readBeforeArticleReview(file, reviewedArticles, readPrevious);
      const catalog = JSON.parse(before);
      changeWordbuild(catalog);
      assert.notDeepEqual(catalog, JSON.parse(before), 'The rejection fixture must actually change the approved source');
      writeFileSync(path, JSON.stringify(catalog));
    }
    if (changeImported) {
      const path = join(dir, 'data/klink-imported-practice.json');
      const catalog = JSON.parse(readBeforeDialogues('data/klink-imported-practice.json'));
      changeImported(catalog);
      writeFileSync(path, JSON.stringify(catalog));
    }
    copyFileSync('scripts/check-curriculum-release.mjs', join(dir, 'scripts/check-curriculum-release.mjs'));
    if (changeWordbuild) {
      const gate = join(dir, 'scripts/check-curriculum-release.mjs');
      const marker = 'const readApprovedFile = file => wordAudioRelease.files[file]';
      assert(readFileSync(gate, 'utf8').includes(marker));
      // Exercise the historical approval boundary even when a later release freezes the live file.
      writeFileSync(gate, readFileSync(gate, 'utf8').replace(marker, `const readApprovedFile = file => file === 'data/klink-lexicon-wordbuild-rest.json' ? readFileSync(${JSON.stringify(join(dir, 'data/klink-lexicon-wordbuild-rest.json'))}) : wordAudioRelease.files[file]`));
    }
    if (changeImported) {
      const gate = join(dir, 'scripts/check-curriculum-release.mjs');
      writeFileSync(gate, readFileSync(gate, 'utf8').replace("readBeforeDialogues('data/klink-imported-practice.json')", `readFileSync(${JSON.stringify(join(dir, 'data/klink-imported-practice.json'))})`));
    }
    copyFileSync('scripts/check-article-review-release.mjs', join(dir, 'scripts/check-article-review-release.mjs'));
    const reviewGate = join(dir, 'scripts/check-article-review-release.mjs');
    writeFileSync(reviewGate, readFileSync(reviewGate, 'utf8').replace('export function verifyArticleReviewRelease(release =', 'export function verifyArticleReviewReleaseUnused(release =') + `\nexport const verifyArticleReviewRelease = () => (${JSON.stringify(reviewedArticles)});`);
    const libraryGate = join(dir, 'scripts/check-word-library-release.mjs');
    writeFileSync(libraryGate, readFileSync('scripts/check-word-library-release.mjs', 'utf8').replace('export function verifyWordLibraryRelease(release =', 'export function verifyWordLibraryReleaseUnused(release =') + `\nexport const verifyWordLibraryRelease = () => (${JSON.stringify(wordLibrary)});`);
    copyFileSync('scripts/check-dialogue-playback-release.mjs', join(dir, 'scripts/check-dialogue-playback-release.mjs'));
    copyFileSync('scripts/check-dialogue-image-fit-release.mjs', join(dir, 'scripts/check-dialogue-image-fit-release.mjs'));
    copyFileSync('scripts/check-word-image-replacements.mjs', join(dir, 'scripts/check-word-image-replacements.mjs'));
    copyFileSync('scripts/check-dialogue-transcript-release.mjs', join(dir, 'scripts/check-dialogue-transcript-release.mjs'));
    copyFileSync('scripts/check-session-audio-release.mjs', join(dir, 'scripts/check-session-audio-release.mjs'));
    copyFileSync('scripts/check-practice-availability-release.mjs', join(dir, 'scripts/check-practice-availability-release.mjs'));
    copyFileSync('scripts/check-self-listening-release.mjs', join(dir, 'scripts/check-self-listening-release.mjs'));
    copyFileSync('scripts/check-practice-explanations-release.mjs', join(dir, 'scripts/check-practice-explanations-release.mjs'));
    copyFileSync('scripts/check-demo-hand-release.mjs', join(dir, 'scripts/check-demo-hand-release.mjs'));
    copyFileSync('scripts/check-popup-style-release.mjs', join(dir, 'scripts/check-popup-style-release.mjs'));
    copyFileSync('scripts/check-build-demo-release.mjs', join(dir, 'scripts/check-build-demo-release.mjs'));
    copyFileSync('scripts/check-gap-demo-release.mjs', join(dir, 'scripts/check-gap-demo-release.mjs'));
    copyFileSync('scripts/check-alfa-c-release.mjs', join(dir, 'scripts/check-alfa-c-release.mjs'));
    copyFileSync('scripts/check-alfa-c-audio-release.mjs', join(dir, 'scripts/check-alfa-c-audio-release.mjs'));
    copyFileSync('scripts/check-alfa-c-functioneel-release.mjs', join(dir, 'scripts/check-alfa-c-functioneel-release.mjs'));
    copyFileSync('scripts/check-alfa-c-choice-release.mjs', join(dir, 'scripts/check-alfa-c-choice-release.mjs'));
    copyFileSync('scripts/check-alfa-c-workspace-release.mjs', join(dir, 'scripts/check-alfa-c-workspace-release.mjs'));
    copyFileSync('scripts/check-alfa-c-docent-release.mjs', join(dir, 'scripts/check-alfa-c-docent-release.mjs'));
    copyFileSync('scripts/check-menu-photo-release.mjs', join(dir, 'scripts/check-menu-photo-release.mjs'));
    copyFileSync('scripts/check-alfa-c-photo-repair-release.mjs', join(dir, 'scripts/check-alfa-c-photo-repair-release.mjs'));
    copyFileSync('scripts/check-alfa-c-dagelijks-release.mjs', join(dir, 'scripts/check-alfa-c-dagelijks-release.mjs'));
    copyFileSync('scripts/check-alfa-c-texts-release.mjs', join(dir, 'scripts/check-alfa-c-texts-release.mjs'));
    copyFileSync('scripts/check-demo-mobile-release.mjs', join(dir, 'scripts/check-demo-mobile-release.mjs'));
    copyFileSync('scripts/check-readalong-release.mjs', join(dir, 'scripts/check-readalong-release.mjs'));
    const dialogueGate = join(dir, 'scripts/check-dialogue-release.mjs');
    writeFileSync(dialogueGate, readFileSync('scripts/check-dialogue-release.mjs', 'utf8').replace('export function verifyDialogueRelease(release =', 'export function verifyDialogueReleaseUnused(release =') + `\nexport const verifyDialogueRelease = () => (${JSON.stringify(dialogueRelease)});`);
    copyFileSync('scripts/check-sound-audio-release.mjs', join(dir, 'scripts/check-sound-audio-release.mjs'));
    const soundGate = join(dir, 'scripts/check-sound-audio-release.mjs');
    writeFileSync(soundGate, readFileSync(soundGate, 'utf8').replace('export function verifySoundAudioRelease(release =', 'export function verifySoundAudioReleaseUnused(release =') + `\nexport const verifySoundAudioRelease = () => (${JSON.stringify(verifiedSounds)});`);
    copyFileSync('scripts/check-image-release.mjs', join(dir, 'scripts/check-image-release.mjs'));
    // The new scope has its own negative tests; these fixtures exercise the inherited approvals.
    writeFileSync(join(dir, 'scripts/check-word-audio-release.mjs'), `export const verifyWordAudioRelease = () => (${JSON.stringify(verifiedWordAudio)});`);
    if (changeApproval) {
      const approvalPath = 'docs/klink-owner-release-vervolg-20261025.json';
      const approval = JSON.parse(readFileSync(approvalPath));
      changeApproval(approval);
      const fixture = join(dir, 'approval.json');
      writeFileSync(fixture, JSON.stringify(approval));
      const gate = join(dir, 'scripts/check-curriculum-release.mjs');
      writeFileSync(gate, readFileSync(gate, 'utf8').replace(`'${approvalPath}'`, JSON.stringify(fixture)));
    }
    if (changeHeaderCss) {
      const cssFixture = join(dir, 'header.css');
      writeFileSync(cssFixture, changeHeaderCss(readBeforeArticleReview('app/taalroute-header.css', reviewedArticles, readPrevious).toString()));
      const gate = join(dir, 'scripts/check-curriculum-release.mjs');
      writeFileSync(gate, readFileSync(gate, 'utf8').replace("readApprovedFile('app/taalroute-header.css')", `readFileSync(${JSON.stringify(cssFixture)}, 'utf8')`));
    }
    copyFileSync('lib/klink-context.ts', join(dir, 'lib/klink-context.ts'));
    for (const name of ['klink-media.json', 'klink-curriculum.json', 'klink-instructions.json', 'klink-comprehension-audio.json', 'klink-connected-content.json', 'klink-sections.json']) copyFileSync(`data/${name}`, join(dir, `data/${name}`));
    const media = JSON.parse(readFileSync(join(dir, 'data/klink-media.json')));
    for (const item of Object.values(media)) item.image ||= '/test-present.webp';
    delete Object.values(media)[0].image;
    writeFileSync(join(dir, 'data/klink-media.json'), JSON.stringify(media));
    const readiness = JSON.parse(readFileSync('data/klink-release-readiness.json'));
    // Deliberately unapproved fixture: a valid live-source proof must not waive review.
    readiness.publicationApproved = false;
    readiness.wordPronunciationReview = 'open';
    readiness.sentenceComprehensionReview = 'open';
    readiness.connectedContentReview = 'open';
    const instructionsPath = join(dir, 'data/klink-instructions.json');
    const instructions = JSON.parse(readFileSync(instructionsPath));
    instructions.humanReview = 'open';
    writeFileSync(instructionsPath, JSON.stringify(instructions));
    const contextPath = join(dir, 'lib/klink-context.ts');
    writeFileSync(contextPath, readFileSync(contextPath, 'utf8').replace("humanReview: 'approved'", "humanReview: 'open'"));
    readiness.baseline.proofFile = join(dir, 'proof.json');
    writeFileSync(join(dir, 'data/klink-release-readiness.json'), JSON.stringify(readiness));
    if (candidate) writeFileSync(readiness.baseline.proofFile, JSON.stringify(candidate));
    const result = spawnSync(process.execPath, [join(dir, 'scripts/check-curriculum-release.mjs')], { encoding: 'utf8' });
    assert.equal(result.status, 1, 'Incomplete media must still prevent publication');
    return result.stderr;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('Valid publication proof resolves provenance, not outstanding media approval', () => {
  const errors = check(proof);
  assert(!errors.includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
  assert(!/herkomstbewijs|broncommit/.test(errors));
  assert(errors.includes('uitspraakcontrole')); assert(errors.includes('1 betekenissen hebben nog geen gekoppeld betekenisbeeld'));
  assert(!errors.includes('instructie-audio is nog niet inhoudelijk vrijgegeven')); assert(errors.includes('zinnen en situaties'));
});
test('New route approval rejects changed hashes and cannot drop the previous approval scope', () => {
  for (const change of [
    approval => { approval.files['app/learner-ui.css'] = '0'.repeat(64); },
    approval => { delete approval.files['lib/teacher-practice-plan.ts']; },
    approval => { delete approval.files['components/product/route-settings.tsx']; },
    approval => { delete approval.files['lib/teacher-picture-guide.ts']; },
    approval => { approval.previousAuthorization = 'unrelated.json'; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});
test('Cumulative approval requires every new source, review and verified backup binding', () => {
  for (const file of ['data/klink-imported-practice.json', 'components/product/imported-teacher-workflow.tsx', 'lib/standard-player-contract.ts', 'docs/klink-cumulative-release-20261018/admissions.json', 'docs/klink-cumulative-release-20261018/teksten-item-review.json', 'docs/klink-cumulative-release-20261018/source-drive-verification.json', 'docs/klink-cumulative-release-20261018/source-backup-manifest.json', 'docs/klink-cumulative-release-20261018/live-baseline-check.json']) {
    assert(check(proof, approval => { delete approval.files[file]; }).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'), file);
  }
});
test('Cumulative scope cannot change the owner instruction, counts, audio pause, review limits or backup identity', () => {
  for (const change of [
    approval => { approval.userRequest = 'Unrelated instruction'; },
    approval => { approval.cumulativeRelease.included++; },
    approval => { approval.cumulativeRelease.excluded = 0; },
    approval => { approval.cumulativeRelease.pendingClassification = 0; },
    approval => { approval.cumulativeRelease.sixPlayers.pop(); },
    approval => { approval.cumulativeRelease.humanReviewClaimed = true; },
    approval => { approval.cumulativeRelease.audioPaused = false; },
    approval => { approval.cumulativeRelease.newAudioConnections = 1; },
    approval => { approval.cumulativeRelease.sourceArchiveSha256 = '0'.repeat(64); },
    approval => { approval.contentSourceCommit = baseline.sourceCommit; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});
test('Only the exact admitted catalog can pass; omissions, duplicates, changed tasks and excluded records are rejected', () => {
  for (const change of [
    catalog => { catalog.items.pop(); },
    catalog => { catalog.items[1] = catalog.items[0]; },
    catalog => { catalog.items[0].prompt += ' changed'; },
    catalog => { catalog.items[0].id = 'klink-sp-c-01-pennen'; },
    catalog => { catalog.items[0].level = 'unclassified'; },
  ]) assert(check(proof, undefined, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});
test('Proof for a different live version cannot satisfy the publication gate', () => {
  assert(check({ ...proof, liveWorkerVersion: 'another-version' }).includes('herkomstbewijs past niet'));
});
test('A boolean without its underlying publication record is rejected', () => {
  assert(check(null).includes('herkomstbewijs ontbreekt'));
});
test('Missing fresh public client evidence is rejected', () => {
  assert(check({ ...proof, freshClientSha256: null }).includes('herkomstbewijs past niet'));
});
test('A mismatching or dirty live release marker is rejected', () => {
  for (const liveRelease of [null, { ...proof.liveRelease, sourceCommit: 'another-commit' }, { ...proof.liveRelease, sourceClean: false }]) {
    assert(check({ ...proof, liveRelease }).includes('herkomstbewijs past niet'));
  }
});
test('Incomplete media evidence or a missing source archive is rejected', () => {
  for (const changes of [{ mediaChecked: 0 }, { mediaChecked: proof.expectedMedia - 1 }, { errors: ['missing media'] }, { sourceArchiveSha256: null }]) {
    assert(check({ ...proof, ...changes }).includes('herkomstbewijs past niet'));
  }
});

test('Short-screen repair retains current live provenance, reviewed CSS and the historical cumulative approval', () => {
 for (const change of [
  approval => { delete approval.files['docs/klink-owner-release-cumulative-20261018.json']; },
  approval => { delete approval.files['docs/klink-short-screen-release-20261018/live-baseline-check.json']; },
  approval => { delete approval.files['docs/klink-short-screen-release-20261018/review.json']; },
  approval => { delete approval.files['docs/klink-short-screen-release-20261018/routes-browser-checks.json']; },
  approval => { delete approval.files['docs/klink-short-screen-release-20261018/preservation.json']; },
  approval => { approval.layoutRepair.baselineSourceCommit = 'bd21413c5673cab5758e454e656a6e89fd35a430'; },
  approval => { approval.layoutRepair.runtimeChangedFiles.push('components/product/learner-app.tsx'); },
  approval => { approval.layoutRepair.reviewEvidence = 'unrelated.json'; },
 ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Smaller header successor retains historical approval and permits only the exact approved dimensions', () => {
  for (const change of [
    approval => { delete approval.logoSizing; },
    approval => { approval.logoSizing.userRequest = 'unrelated'; },
    approval => { approval.logoSizing.desktopWidth = 60; },
    approval => { approval.logoSizing.mobileWidth = 50; },
    approval => { approval.logoSizing.breakpoint = 600; },
    approval => { approval.logoSizing.baselineSourceCommit = '277147e4589459472713240e1566de39bf6e8d43'; },
    approval => { approval.logoSizing.runtimeChangedFiles.push('components/product/learner-app.tsx'); },
    approval => { approval.supersedesAuthorization = 'unrelated.json'; },
    approval => { delete approval.files['docs/klink-owner-release-short-screen-20261018.json']; },
    approval => { approval.files['app/taalroute-header.css'] = '0'.repeat(64); },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Header sizing rejects extra CSS changes even when approval hashes match the source files', () => {
  for (const change of [
    css => css.replace('width: 66px', 'width: 60px'),
    css => css.replace('--taalroute-header-height: 60px', '--taalroute-header-height: 70px'),
    css => css + '\n.unrelated { display: none; }\n',
  ]) assert(check(proof, undefined, undefined, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Wordbuild publication requires exact consent, reviewed selection and verified source backup', () => {
  for (const change of [
    approval => { delete approval.wordbuildRelease; },
    approval => { approval.wordbuildRelease.userRequest = 'unrelated'; },
    approval => { approval.wordbuildRelease.publicationApproved = false; },
    approval => { approval.wordbuildRelease.additionalModelTasks++; },
    approval => { approval.wordbuildRelease.audioPaused = false; },
    approval => { approval.wordbuildRelease.humanReviewClaimed = true; },
    approval => { approval.wordbuildRelease.baselineSourceCommit = '7008a35917f73f5ea52df1089c5c2e7c53a741f4'; },
    approval => { approval.wordbuildRelease.runtimeChangedFiles.push('data/klink-curriculum.json'); },
    approval => { delete approval.files['data/klink-lexicon-wordbuild-rest.json']; },
    approval => { delete approval.files['docs/klink-wordbuild-release-20261019/source-drive-verification.json']; },
    approval => { delete approval.files['docs/klink-owner-release-smaller-header-20261019.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Wordbuild source changes, hidden omissions and new audio cannot reuse the prior approval', () => {
  for (const change of [
    catalog => { catalog.packs[0].exercises.pop(); },
    catalog => { catalog.packs[0].exercises[0].exampleWord += 'x'; },
    catalog => { catalog.packs[0].words[0].audio = '/new.mp3'; },
    catalog => { catalog.selectionPolicy.excludedLexemeIds = []; },
  ]) assert(check(proof, undefined, undefined, undefined, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

// A maintenance release cannot loosen historical content approvals or its exact scope.
test('Maintenance approval rejects an expanded scope, missing consent and altered source hashes', () => {
  for (const change of [
    approval => { approval.maintenanceRelease.publicationApproved = false; },
    approval => { approval.maintenanceRelease.changedFiles.push('data/klink-curriculum.json'); },
    approval => { approval.maintenanceRelease.baselineSourceCommit = '0'.repeat(40); },
    approval => { delete approval.files['app/landing.css']; },
    approval => { approval.files['scripts/test-group-practice.mjs'] = '0'.repeat(64); },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

// Footer consent cannot admit unrelated changes or replace historical approval.
test('Landing footer approval remains limited to the explicit request', () => {
  for (const change of [
    approval => { approval.landingRelease.publicationApproved = false; },
    approval => { approval.landingRelease.changedFiles.push('data/klink-curriculum.json'); },
    approval => { approval.landingRelease.baselineSourceCommit = '0'.repeat(40); },
    approval => { delete approval.files['components/product/entry-design.tsx']; },
    approval => { approval.files['docs/klink-owner-release-maintenance-20261024.json'] = '0'.repeat(64); },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Sharing release cannot extend runtime scope or erase the previous maintenance approval', () => {
 for (const change of [
   a => { a.sharingRelease.changedFiles.push('data/klink-curriculum.json'); },
   a => { a.sharingRelease.baselineSourceCommit = '0'.repeat(40); },
   a => { delete a.files['docs/klink-owner-release-landing-footer-20261024.json']; },
   a => { a.sharingRelease.headerRequest = 'unrelated'; },
 ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Header repair retains the published sharing and content approval', () => {
 for (const change of [a=>{a.headerRepair.changedFiles.push('data/klink-curriculum.json');},a=>{a.headerRepair.baselineSourceCommit='0'.repeat(40);},a=>{delete a.files['docs/klink-owner-release-sharing-20261024.json'];},a=>{a.headerRepair.userRequest='unrelated';}]) assert(check(proof,change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

// The new visual approval must not admit content changes or discard its predecessor.
test('Compact exercise release requires exact consent, scope, source and verified backup', () => {
  for (const change of [
    a => { a.compactExercises.publicationApproved = false; },
    a => { a.compactExercises.userRequest = 'unrelated'; },
    a => { a.compactExercises.baselineSourceCommit = '0'.repeat(40); },
    a => { a.compactExercises.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-owner-release-appmenu-20261024.json']; },
    a => { delete a.files['docs/klink-compact-exercises-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('KLINK menu addition cannot widen content scope or discard the approved header repair',()=>{
 for(const change of [a=>{a.appMenu.changedFiles.push('data/klink-curriculum.json');},a=>{a.appMenu.userRequest='unrelated';},a=>{a.headerRepair.userRequest='unrelated';}])assert(check(proof,change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Collapsible exercise menu binds consent, unchanged content scope and verified backup', () => {
  for (const change of [
    a => { a.exerciseMenu.publicationApproved = false; },
    a => { a.exerciseMenu.userRequest = 'unrelated'; },
    a => { a.exerciseMenu.baselineSourceCommit = '0'.repeat(40); },
    a => { a.exerciseMenu.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-owner-release-compact-exercises-20261024.json']; },
    a => { delete a.files['docs/klink-exercise-menu-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Beginner release binds current live ancestry, exact scope and owner publication request', () => {
  for (const change of [
    approval => { delete approval.beginnerRelease; },
    approval => { approval.beginnerRelease.baselineSourceCommit = '0'.repeat(40); },
    approval => { approval.beginnerRelease.guidedExercises = 103; },
    approval => { approval.beginnerRelease.userRequest = 'No publication'; },
    approval => { approval.beginnerRelease.humanReviewClaimed = true; },
    approval => { approval.beginnerRelease.changedFiles.pop(); },
    approval => { delete approval.files['lib/lesson-plan.ts']; },
    approval => { delete approval.files['docs/klink-beginners-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('In release preserves beginner scope and binds its publication and backup', () => {
  for (const change of [
    a => { delete a.inRelease; },
    a => { a.inRelease.publicationApproved = false; },
    a => { a.inRelease.guidedExercises = 113; },
    a => { a.inRelease.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.inRelease.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-in-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Consistent layout keeps the current beginners release, owner consent and exact source scope', () => {
  for (const change of [
    approval => { delete approval.consistentLayout; },
    approval => { approval.consistentLayout.publicationApproved = false; },
    approval => { approval.consistentLayout.baselineSourceCommit = '6f7de9248c933e538a2fec928694db726158bbf4'; },
    approval => { approval.consistentLayout.changedFiles.push('lib/lesson-plan.ts'); },
    approval => { delete approval.files['docs/klink-owner-release-in-20261024.json']; },
    approval => { delete approval.files['docs/klink-consistent-layout-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('En release binds its scope, live ancestry and verified backup without weakening earlier approvals', () => {
  for (const change of [
    a => { delete a.enRelease; },
    a => { a.enRelease.publicationApproved = false; },
    a => { a.enRelease.baselineSourceCommit = '0'.repeat(40); },
    a => { a.enRelease.guidedExercises = 116; },
    a => { a.enRelease.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.enRelease.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-en-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('White workspace approval preserves the latest lessons and binds menu, geometry and backup evidence', () => {
  for (const change of [
    approval => { approval.whiteWorkspace.baselineSourceCommit = '0'.repeat(40); },
    approval => { approval.whiteWorkspace.publicationApproved = false; },
    approval => { approval.whiteWorkspace.changedFiles.pop(); },
    approval => { delete approval.files['scripts/test-white-workspace-browser.mjs']; },
    approval => { delete approval.files['docs/klink-white-workspace-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Is release binds its scope, live ancestry and verified backup without weakening earlier approvals', () => {
  for (const change of [
    a => { delete a.isRelease; },
    a => { a.isRelease.publicationApproved = false; },
    a => { a.isRelease.baselineSourceCommit = '0'.repeat(40); },
    a => { a.isRelease.guidedExercises = 119; },
    a => { a.isRelease.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.isRelease.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-is-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Kan release binds its scope, live ancestry and verified backup without weakening earlier approvals', () => {
  for (const change of [
    a => { delete a.kanRelease; },
    a => { a.kanRelease.publicationApproved = false; },
    a => { a.kanRelease.baselineSourceCommit = '0'.repeat(40); },
    a => { a.kanRelease.guidedExercises = 122; },
    a => { a.kanRelease.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.kanRelease.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-kan-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Kast release binds its scope, live ancestry and verified backup without weakening earlier approvals', () => {
  for (const change of [
    a => { delete a.kastRelease; },
    a => { a.kastRelease.publicationApproved = false; },
    a => { a.kastRelease.baselineSourceCommit = '0'.repeat(40); },
    a => { a.kastRelease.guidedExercises = 125; },
    a => { a.kastRelease.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.kastRelease.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-kast-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Mens release binds its scope, live ancestry and verified backup without weakening earlier approvals', () => {
  for (const change of [
    a => { delete a.mensRelease; },
    a => { a.mensRelease.publicationApproved = false; },
    a => { a.mensRelease.baselineSourceCommit = '0'.repeat(40); },
    a => { a.mensRelease.guidedExercises = 128; },
    a => { a.mensRelease.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.mensRelease.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-mens-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Nek release binds its scope, live ancestry and verified backup without weakening earlier approvals', () => {
  for (const change of [
    a => { delete a.nekRelease; },
    a => { a.nekRelease.publicationApproved = false; },
    a => { a.nekRelease.baselineSourceCommit = '0'.repeat(40); },
    a => { a.nekRelease.guidedExercises = 131; },
    a => { a.nekRelease.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.nekRelease.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-nek-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});


test('Overview workspace release binds the three exceptions to the latest lessons and verified backup', () => {
  for (const change of [
    a => { delete a.overviewWorkspace; },
    a => { a.overviewWorkspace.publicationApproved = false; },
    a => { a.overviewWorkspace.baselineSourceCommit = '0'.repeat(40); },
    a => { a.overviewWorkspace.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.overviewWorkspace.userRequest = 'unrelated'; },
    a => { delete a.files['scripts/test-overview-workspace-browser.mjs']; },
    a => { delete a.files['docs/klink-overviews-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Nek continuation requires scoped owner authorization, current ancestry and verified backup', () => {
  for (const change of [
    a => { delete a.nekContinuation; },
    a => { a.nekContinuation.publicationApproved = false; },
    a => { a.nekContinuation.nextLessonId = 'unrelated'; },
    a => { a.nekContinuation.baselineSourceCommit = '0'.repeat(40); },
    a => { a.nekContinuation.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.nekContinuation.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-nekvervolg-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Kop/sok binds exact scope and preserves the full checked baseline with targeted regression', () => {
  for (const change of [
    a => { delete a.kopSokRelease; },
    a => { a.kopSokRelease.publicationApproved = false; },
    a => { a.kopSokRelease.lessonId = 'unrelated'; },
    a => { a.kopSokRelease.baselineSourceCommit = '0'.repeat(40); },
    a => { a.kopSokRelease.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-kopsok-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});


test('Landing audiences release requires exact scope, owner request and verified backup', () => {
  for (const change of [
    a => { delete a.landingAudiences; },
    a => { a.landingAudiences.publicationApproved = false; },
    a => { a.landingAudiences.baselineSourceCommit = '0'.repeat(40); },
    a => { a.landingAudiences.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.landingAudiences.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-landing-audiences-20261024/source-drive-verification.json']; },
    a => { a.files['public/klink-entry-hero.webp'] = '0'.repeat(64); },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});


test('Session stability requires current source, scoped authorization, stress proof and verified backup', () => {
  for (const change of [
    a => { delete a.sessionStability; },
    a => { a.sessionStability.publicationApproved = false; },
    a => { a.sessionStability.baselineSourceCommit = '0'.repeat(40); },
    a => { a.sessionStability.changedFiles.push('data/klink-curriculum.json'); },
    a => { a.sessionStability.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-session-stability-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Grouped lesson guidance requires scoped counts, review and verified source backup', () => {
  for (const change of [
    a => { delete a.group4Guidance; },
    a => { a.group4Guidance.publicationApproved = false; },
    a => { a.group4Guidance.steps++; },
    a => { a.group4Guidance.lessons++; },
    a => { a.group4Guidance.baselineSourceCommit = '0'.repeat(40); },
    a => { a.group4Guidance.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-groep4-publication-20261024/review.json']; },
    a => { delete a.files['docs/klink-groep4-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Group five letter combinations requires scoped counts, review and verified source backup', () => {
  for (const change of [
    a => { delete a.group5Guidance; },
    a => { a.group5Guidance.publicationApproved = false; },
    a => { a.group5Guidance.steps++; },
    a => { a.group5Guidance.lessons++; },
    a => { a.group5Guidance.baselineSourceCommit = '0'.repeat(40); },
    a => { a.group5Guidance.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-groep5-publication-20261024/review.json']; },
    a => { delete a.files['docs/klink-groep5-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Matching card layout requires scoped approval and verified review/backup', () => {
  for (const change of [
    a => { delete a.matchingCards; },
    a => { a.matchingCards.publicationApproved = false; },
    a => { a.matchingCards.baselineSourceCommit = '0'.repeat(40); },
    a => { a.matchingCards.changedFiles.push('lib/lesson-plan.ts'); },
    a => { delete a.files['docs/klink-matching-cards-publication-20261024/review.json']; },
    a => { delete a.files['docs/klink-matching-cards-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Group six letter combinations requires scoped counts, review and verified source backup', () => {
  for (const change of [
    a => { delete a.group6Guidance; },
    a => { a.group6Guidance.publicationApproved = false; },
    a => { a.group6Guidance.steps++; },
    a => { a.group6Guidance.lessons++; },
    a => { a.group6Guidance.baselineSourceCommit = '0'.repeat(40); },
    a => { a.group6Guidance.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-groep6-publication-20261024/review.json']; },
    a => { delete a.files['docs/klink-groep6-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});


test('Landing review preserves exact approved baseline, scope and review evidence', () => {
  for (const change of [
    a => { delete a.landingReview; },
    a => { a.landingReview.publicationApproved = false; },
    a => { a.landingReview.baselineSourceCommit = '0'.repeat(40); },
    a => { a.landingReview.changedFiles.push('lib/mixed-practice.ts'); },
    a => { a.landingReview.userRequest = 'unrelated'; },
    a => { delete a.files['docs/klink-landing-review-20261024/review-rounds.json']; },
    a => { delete a.files['docs/klink-landing-review-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});


test('Group seven letter combinations requires scoped counts, review and verified source backup', () => {
  for (const change of [
    a => { delete a.group7Guidance; },
    a => { a.group7Guidance.publicationApproved = false; },
    a => { a.group7Guidance.steps++; },
    a => { a.group7Guidance.lessons++; },
    a => { a.group7Guidance.baselineSourceCommit = '0'.repeat(40); },
    a => { a.group7Guidance.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-groep7-publication-20261024/review.json']; },
    a => { delete a.files['docs/klink-groep7-publication-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

test('Exercise frame changes require exact scope, review, predecessor and verified backup', () => {
  for (const change of [
    a => { delete a.exerciseFrames; },
    a => { a.exerciseFrames.publicationApproved = false; },
    a => { a.exerciseFrames.baselineSourceCommit = '0'.repeat(40); },
    a => { a.exerciseFrames.changedFiles.push('lib/lesson-plan.ts'); },
    a => { delete a.files['docs/klink-exercise-frames-20261025/review.json']; },
    a => { delete a.files['docs/klink-exercise-frames-20261025/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});


test('Klankenkaart publication requires exact live ancestry, owner instruction, scope and verified backup', () => {
  for (const change of [
    a => { delete a.soundReference; },
    a => { a.soundReference.publicationApproved = false; },
    a => { a.soundReference.baselineSourceCommit = '0'.repeat(40); },
    a => { a.soundReference.userRequest = 'unrelated'; },
    a => { a.soundReference.cards++; },
    a => { a.soundReference.newAudioConnections++; },
    a => { a.soundReference.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-klanken-publication-20261025/source-drive-verification.json']; },
    a => { delete a.files['docs/klink-owner-release-exercise-frames-20261025.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});


test('Group eight letter combinations requires scoped counts, review and verified source backup', () => {
  for (const change of [
    a => { delete a.group8Guidance; },
    a => { a.group8Guidance.publicationApproved = false; },
    a => { a.group8Guidance.steps++; },
    a => { a.group8Guidance.lessons++; },
    a => { a.group8Guidance.baselineSourceCommit = '0'.repeat(40); },
    a => { a.group8Guidance.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-groep8-publication-20261025/review.json']; },
    a => { delete a.files['docs/klink-groep8-publication-20261025/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});

 test('Article release requires meaning review, preserved previous scope and verified source backup', () => {
 for (const change of [
 a => { delete a.wordArticles; },
 a => { a.wordArticles.publicationApproved = false; },
 a => { a.wordArticles.meaningsChecked++; },
 a => { a.wordArticles.articleLabels++; },
 a => { a.wordArticles.newAudio++; },
 a => { a.wordArticles.changedFiles.push('data/klink-curriculum.json'); },
 a => { delete a.files['docs/klink-articles-20261025/meaning-review.json']; },
 a => { delete a.files['docs/klink-articles-20261025/source-drive-verification.json']; },
 ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
 });

test('Group nine letter combinations requires scoped counts, review and verified source backup', () => {
  for (const change of [
    a => { delete a.group9Guidance; },
    a => { a.group9Guidance.publicationApproved = false; },
    a => { a.group9Guidance.steps++; },
    a => { a.group9Guidance.lessons++; },
    a => { a.group9Guidance.baselineSourceCommit = '0'.repeat(40); },
    a => { a.group9Guidance.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-groep9-publication-20261025/review.json']; },
    a => { delete a.files['docs/klink-groep9-publication-20261025/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});


test('Group ten letter combinations requires scoped counts, review and verified source backup', () => {
  for (const change of [
    a => { delete a.group10Guidance; },
    a => { a.group10Guidance.publicationApproved = false; },
    a => { a.group10Guidance.steps++; },
    a => { a.group10Guidance.lessons++; },
    a => { a.group10Guidance.baselineSourceCommit = '0'.repeat(40); },
    a => { a.group10Guidance.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-groep10-publication-20261025/review.json']; },
    a => { delete a.files['docs/klink-groep10-publication-20261025/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});


test('Five follow-up groups requires scoped counts, review and verified source backup', () => {
  for (const change of [
    a => { delete a.followupGuidance; },
    a => { a.followupGuidance.publicationApproved = false; },
    a => { a.followupGuidance.steps++; },
    a => { a.followupGuidance.lessons++; },
    a => { a.followupGuidance.packageIds.push('voorbereiding'); },
    a => { a.followupGuidance.baselineSourceCommit = '0'.repeat(40); },
    a => { a.followupGuidance.changedFiles.push('data/klink-curriculum.json'); },
    a => { delete a.files['docs/klink-vervolg-publication-20261025/review.json']; },
    a => { delete a.files['docs/klink-vervolg-publication-20261025/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});
