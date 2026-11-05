import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const folder = 'docs/help-en-context-20261105/';
const roots = ['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const runtime = ['app/learner-layout.css','components/product/alfa-c-dagelijks.tsx','components/product/alfa-c-functioneel.tsx','components/product/alfa-c-practice.tsx','components/product/exercise-listen.tsx','components/product/extended-practice-surface.tsx','components/product/package-exercise-browser.tsx','components/product/standard-practice-surface.tsx','data/klink-media.json','lib/package-content.ts'];
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const paths = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sort = files => files.sort();

export function verifyHelpContextRelease(read = readFileSync) {
  const json = path => JSON.parse(read(path));
  const release = json(folder + 'approval.json'), request = json(folder + 'owner-request.json');
  assert.equal(request.userRequest, 'Zet Help rechtsboven naast Foto en Tekst en zorg dat de knop zichtbaar blijft bij scrollen. Test dit op mobiel en zet beide aanpassingen daarna online. Laat Inzicht-staging ongemoeid.');
  assert.equal(request.approvedBy, 'Nico'); assert.equal(request.publicationApproved, true);
  assert.equal(release.baselineSourceCommit, 'a272037664b8db01967aba2e4d7fe181a49ee1b7');
  assert.equal(release.liveSourceCommit, '8f310654410c683c772ce889b2164441b8a2a8c0');
  assert.equal(release.checkedCandidateCommit, 'c5fc18c68ba2c9e9e237d10c2189403ea1e22fb8');
  git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);
  git('merge-base','--is-ancestor',release.baselineSourceCommit,release.checkedCandidateCommit);
  git('merge-base','--is-ancestor',release.checkedCandidateCommit,'HEAD');
  const changed = sort([...new Set([...paths(git('diff','--name-only',release.baselineSourceCommit,'--',...roots)),...paths(git('ls-files','--others','--exclude-standard','--',...roots))])]);
  assert.deepEqual(changed, release.changedFiles);
  assert.deepEqual(sort(Object.keys(release.files)), changed);
  assert.deepEqual(changed.filter(path => !path.startsWith('scripts/')), sort([...runtime, 'VORMGEVING-VASTGEZET.md']));
  for (const [path, hash] of Object.entries({ ...release.files, ...release.evidenceFiles })) assert.equal(sha(read(path)), hash, path);
  for (const path of runtime) assert.equal(sha(read(path)),sha(git('show',release.checkedCandidateCommit+':'+path)),path);
  const media = json('data/klink-media.json');
  assert.equal(media['klink-woord-en'].imageCaption,'appel en peer');
  delete media['klink-woord-en'].imageCaption;
  assert.deepEqual(media,JSON.parse(git('show',release.baselineSourceCommit+':data/klink-media.json')));
  const local = json(folder + 'local-browser.json');
  assert.equal(local.checks.length,8);
  assert(local.checks.every(row=>row.helpStayedVisible&&row.openAndClosePreserved&&row.enWithPhoto&&row.enWithoutPhoto));
  assert.equal(local.checks.filter(row=>row.width<600).length,6);
  const build = json(folder + 'verification.json');
  assert(build.typesPassed&&build.lintPassed&&build.curriculumTests===49&&build.normalBuildPassed&&build.dryRunPassed);
  assert(build.offeredAssets<=20000&&build.workerGzipKiB<10240);
  assert.equal(json(folder + 'live-before.json').sourceCommit,release.liveSourceCommit);
  const backup = json(folder + 'backup.json');
  assert(backup.driveId&&backup.fullReadback&&backup.zipIntegrity);
  assert.deepEqual(backup.files,release.files);
  assert.deepEqual(backup.evidenceFiles,release.evidenceFiles);
  return release;
}
export function readBeforeHelpContext(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show',release.baselineSourceCommit+':'+file) : read(file);
}
