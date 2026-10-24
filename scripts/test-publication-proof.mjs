import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync, cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const baseline = JSON.parse(readFileSync('data/klink-release-readiness.json')).baseline;
const proof = JSON.parse(readFileSync(baseline.proofFile));
function check(candidate, changeApproval, changeImported, changeHeaderCss, changeWordbuild) {
  const dir = mkdtempSync(join(tmpdir(), 'klink-proof-test-'));
  try {
    mkdirSync(join(dir, 'scripts')); mkdirSync(join(dir, 'data')); mkdirSync(join(dir, 'lib'));
    cpSync('lib', join(dir, 'lib'), { recursive: true });
    cpSync('data', join(dir, 'data'), { recursive: true });
    if (changeWordbuild) {
      const path = join(dir, 'data/klink-lexicon-wordbuild-rest.json');
      const catalog = JSON.parse(readFileSync(path));
      changeWordbuild(catalog);
      writeFileSync(path, JSON.stringify(catalog));
    }
    if (changeImported) {
      const path = join(dir, 'data/klink-imported-practice.json');
      const catalog = JSON.parse(readFileSync(path));
      changeImported(catalog);
      writeFileSync(path, JSON.stringify(catalog));
    }
    copyFileSync('scripts/check-curriculum-release.mjs', join(dir, 'scripts/check-curriculum-release.mjs'));
    if (changeApproval) {
      const approvalPath = 'docs/klink-owner-release-compact-exercises-20261024.json';
      const approval = JSON.parse(readFileSync(approvalPath));
      changeApproval(approval);
      const fixture = join(dir, 'approval.json');
      writeFileSync(fixture, JSON.stringify(approval));
      const gate = join(dir, 'scripts/check-curriculum-release.mjs');
      writeFileSync(gate, readFileSync(gate, 'utf8').replace(`'${approvalPath}'`, JSON.stringify(fixture)));
    }
    if (changeHeaderCss) {
      const cssFixture = join(dir, 'header.css');
      writeFileSync(cssFixture, changeHeaderCss(readFileSync('app/taalroute-header.css', 'utf8')));
      const gate = join(dir, 'scripts/check-curriculum-release.mjs');
      writeFileSync(gate, readFileSync(gate, 'utf8').replace("readFileSync('app/taalroute-header.css', 'utf8')", `readFileSync(${JSON.stringify(cssFixture)}, 'utf8')`));
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
    a => { delete a.files['docs/klink-owner-release-header-repair-20261024.json']; },
    a => { delete a.files['docs/klink-compact-exercises-20261024/source-drive-verification.json']; },
  ]) assert(check(proof, change).includes('Het inhoudsgebonden publicatieakkoord van de eigenaar ontbreekt of past niet meer.'));
});
