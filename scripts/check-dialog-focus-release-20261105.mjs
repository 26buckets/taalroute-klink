import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const folder = 'docs/focus-audit-all-20261105/publication/';
const roots = ['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const runtime = ['app/globals.css','app/layout.tsx','components/product/pointer-focus.tsx','components/product/practice-line.tsx'];
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const paths = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyDialogFocusContent(read = readFileSync) {
  const json = path => JSON.parse(read(path));
  const release = json(folder+'approval.json'), request = json(folder+'owner-request.json');
  assert.equal(request.approvedBy, 'Nico'); assert.equal(request.publicationApproved, true);
  assert.equal(request.userRequest, 'Publiceer deze aanvullende klikrandenreparatie nu via de normale publicatieroute. Controleer eerst de actuele livebasis en behoud alle inhoud, audio, voortgang, toetsenbordbediening en de rest van het uiterlijk.');
  assert.equal(release.baselineSourceCommit, 'e8925763430601bea02fecfb89e91054e25015a7');
  assert.equal(release.liveSourceCommit, '43c05c9d4c40adb5373d564e6131d5dbdd90d546');
  assert.equal(release.checkedCandidateCommit, '8830be424dff20f3622da2a467bb08ff6efca892');
  git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);
  git('merge-base','--is-ancestor',release.baselineSourceCommit,release.checkedCandidateCommit);
  git('merge-base','--is-ancestor',release.checkedCandidateCommit,'HEAD');
  const changed = [...new Set([...paths(git('diff','--name-only',release.baselineSourceCommit,'--',...roots)),...paths(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a<b?-1:a>b?1:0);
  assert.deepEqual(changed, release.changedFiles);
  assert.deepEqual(Object.keys(release.files).sort((a,b)=>a<b?-1:a>b?1:0), changed);
  assert.deepEqual(changed, [...runtime,'VORMGEVING-VASTGEZET.md','scripts/check-help-en-context-release-20261105.mjs','scripts/check-dialog-focus-release-20261105.mjs','scripts/test-dialog-focus-release-20261105.mjs'].sort((a,b)=>a<b?-1:a>b?1:0));
  for (const [path, hash] of Object.entries({...release.files,...release.evidenceFiles})) assert.equal(sha(read(path)), hash, path);
  for (const path of runtime) assert.equal(sha(read(path)), sha(git('show','b87ec638fefae9d6a57884bb874cc41b945c232e:'+path)), path);
  const live = json(folder+'live-before.json');
  assert.equal(live.sourceCommit, release.liveSourceCommit); assert(live.sourceClean); assert.equal(live.branch,'main');
  const checks = json(folder+'verification.json');
  assert(checks.typesPassed && checks.lintPassed && checks.normalBuildPassed && checks.curriculumTests===49);
  for (const [path,count] of [['dialogs-after/checks.json',48],['base-dialogs-final/checks.json',16]]) {
    const result = json(folder+path); assert.equal(result.checks.length,count); assert.deepEqual(result.errors,[]);
  }
  const visual = json(folder+'touch-appearance/checks.json');
  assert.equal(visual.checks.length,8); assert.equal(visual.touch.length,2);
  assert(visual.checks.every(row=>row.geometryEqual && row.changedPixels===0));
  const help = json(folder+'help/browser.json'); assert.equal(help.checks.length,8);
  assert(help.checks.every(row=>row.helpStayedVisible && row.openAndClosePreserved && row.enWithPhoto && row.enWithoutPhoto));
  const preservation = json(folder+'preservation.json');
  assert.deepEqual(preservation.runtimeChangedFiles,runtime); assert.deepEqual(preservation.githubWorkflowFiles,[]);
  assert(preservation.contentMediaStorageUnchanged && preservation.latestHelpRetained);
  return release;
}
export function verifyDialogFocusRelease(read = readFileSync) {
  const release = verifyDialogFocusContent(read), backup = JSON.parse(read(folder+'backup.json'));
  assert(backup.driveId && backup.fullReadback && backup.zipIntegrity && backup.allPayloadHashesMatch);
  assert.deepEqual(backup.files,release.files); assert.deepEqual(backup.evidenceFiles,release.evidenceFiles);
  return release;
}
export function readBeforeDialogFocus(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show',release.baselineSourceCommit+':'+file) : read(file);
}
