import {verifyProductionRelease, readBeforeProduction} from './check-production-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git = (...args) => execFileSync('git', args, {maxBuffer:64*1024*1024});
const sha = b => createHash('sha256').update(b).digest('hex');
export function verifyMenuPhotoRelease(read = readFileSync) {
  const successor = verifyProductionRelease(read), currentRead = read;
  read = file => readBeforeProduction(file, successor, currentRead);
  const release = JSON.parse(read('docs/klink-owner-release-menu-photos-20261029.json'));
  assert.equal(release.baselineSourceCommit, '252f39c41ba70113720f15976c838aa1df379c35');
  assert.equal(release.liveSourceCommit, '430beb7346d1436f85cf4de081773189e0c6d85d');
  assert.equal(release.userRequest, 'Prima, zet dit allemaal online als het online staat, super. Hou zo.');
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  const roots = ['app','components','hooks','data','lib','public','scripts'];
  const lines = b => b.toString().trim().split('\n').filter(Boolean);
  const changed = lines(git('diff','--name-only',release.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
  const untracked = []; // Current changes are checked by the source-bound production successor.
  assert.deepEqual([...new Set([...changed,...untracked])].sort((a,b)=>a.localeCompare(b)), [...release.changedFiles].sort((a,b)=>a.localeCompare(b)));
  for(const [file, hash] of Object.entries(release.files)) assert.equal(sha(read(file)),hash,file);
  assert(release.changedFiles.every(file=>release.files[file]));
  assert.equal(git('diff',release.baselineSourceCommit,successor.baselineSourceCommit,'--','db','drizzle','hooks','public/package-audio','public/klink-wordmark.svg','lib/learner-progress.ts','lib/alfa-c-docent.ts','components/product/alfa-c-docent.tsx','data/klink-alfa-c-docent.json','data/klink-alfa-c-docent-audio.json','data/klink-curriculum.json','data/klink-alfa-c.json','data/klink-alfa-c-functioneel.json','data/klink-alfa-c-dagelijks.json').length,0,'Preserve live teaching content, audio, storage and logo');
  const publicChanges = lines(git('diff','--name-status',release.baselineSourceCommit,successor.baselineSourceCommit,'--','public'));
  assert.equal(publicChanges.length,18);
  assert(publicChanges.every(line=>/^A\tpublic\/package-media\/word-photo-repair-20261029\/[a-z]+\.webp$/.test(line)),'Keep all existing media');
  const rows=JSON.parse(read('docs/word-photo-repair-20261029/manifest.json'));
  assert.equal(rows.length,18);
  const previous=JSON.parse(git('show',`${release.baselineSourceCommit}:data/klink-media.json`));
  const expected=structuredClone(previous), current=JSON.parse(read('data/klink-media.json'));
  for(const row of rows) {
    assert.deepEqual(previous[row.id],row.original);
    assert.equal(sha(read('public'+row.original.image)),row.original_sha256);
    assert.equal(sha(read('public'+row.replacement)),row.replacement_sha256);
    expected[row.id].image=row.replacement;
  }
  assert.deepEqual(current,expected,'Only the eighteen requested image links change');
  const proof=JSON.parse(read(release.reviewPath));
  for(const key of ['types','lint','build','curriculum','navigation','all27TeacherTasks','old180Tasks','photoCards','localOnly']) assert.equal(proof[key],true,key);
  const backup=JSON.parse(read('docs/word-photo-repair-20261029/backup.json'));
  assert.equal(backup.sha256,'6a8cd2eaf67369fc6252a43ee04c8744020e8d71937bbb987a0d37cb3e36823a');
  return { ...release, successor };
}
export function readBeforeMenuPhoto(file, release, read=readFileSync) {
  return release.changedFiles.includes(file) || ['AGENTS.md','docs/KLINK-DOCENTHANDLEIDING.md'].includes(file) ? git('show',`${release.baselineSourceCommit}:${file}`) : readBeforeProduction(file, release.successor, read);
}
