import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {verifyPointerFocusRelease,readBeforePointerFocus} from './check-pointer-focus-release-20261105.mjs';
const root = 'docs/storage-player-repair-20261105/';
const roots = ['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const sort = values => values.sort((a,b) => a.localeCompare(b));
export function verifyStorageRepairContent(read = readFileSync) {
  const successor=verifyPointerFocusRelease(read),currentRead=read;read=file=>readBeforePointerFocus(file,successor,currentRead);
  const json = path => JSON.parse(read(path)), r = json(root+'approval.json'), request = json(root+'publication-request.json');
  assert.equal(r.approvedBy, 'Nico'); assert(r.publicationApproved && request.publicationApproved);
  assert.equal(request.userRequest, 'Publiceer deze gecontroleerde herstelversie nu via de normale publicatieroute. Controleer eerst de actuele livebasis en behoud alle inhoud, audio, voortgang en het huidige uiterlijk.');
  assert.equal(r.baselineSourceCommit, 'fc51e7c5501f5bf410ee96e569e3676b51d65568');
  assert.equal(r.liveSourceCommit, '93d69b044b5e3a5bf177c88cb0cfd2fe0bb03402');
  assert.equal(r.checkedCandidateCommit, 'b5bdcc76707ff1f8ba1e1846d9b0005c8735452d');
  git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);
  git('merge-base','--is-ancestor',r.baselineSourceCommit,r.checkedCandidateCommit);
  git('merge-base','--is-ancestor',r.checkedCandidateCommit,'HEAD');
  const changed = sort(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)));
  assert.deepEqual(changed,r.changedFiles); assert.deepEqual(sort(Object.keys(r.files)),changed);
  for (const [path,hash] of Object.entries({...r.files,...r.evidenceFiles})) assert.equal(sha(read(path)),hash,path);
  // Runtime stays byte-identical to the fully checked repair; only its release proof is new.
  const runtime = roots.filter(path => path !== 'scripts');
  assert.deepEqual(lines(git('diff','--name-only',r.checkedCandidateCommit,successor.baselineSourceCommit,'--',...runtime)),[]);
  // The successor validates the current tree and untracked files.
  const checks = json(root+'verification.json');
  assert(checks.typesPassed && checks.lintPassed && checks.normalBuildPassed && checks.dryRunPassed);
  assert.equal(checks.packageCommands,47); assert.equal(checks.productionCollections,1800); assert.equal(checks.historicalPublicationTests,50);
  assert(checks.offeredAssets<=20000 && checks.workerGzipKiB<10240);
  const commands = json(root+'local/package-results-final.json').commands;
  assert.equal(commands.length,47); assert(commands.every(c=>c.code===0));
  const appearance = [...json(root+'local/appearance-final/checks.json').checks,...json(root+'local/sheet-appearance/checks.json').checks];
  assert.equal(appearance.length,80); assert(appearance.every(c=>c.significantPixels===0));
  const storage = json(root+'local/storage-preservation/checks.json');
  assert.equal(storage.checks.length,6); assert.deepEqual(storage.errors,[]);
  const audio = json(root+'local/all-audio.json'), packed = json(root+'local/packed-audio.json');
  assert.equal(audio.files.length,13891); assert(audio.files.every(f=>f.passed)); assert.equal(packed.passed,6293); assert.equal(packed.total,6293);
  const repairs = json(root+'local/audio-metadata-repairs.json'); assert.equal(repairs.length,10); assert(repairs.every(f=>f.decodedAudioIdentical&&sha(read(f.file))===f.after));
  assert.equal(json(root+'live-before.json').sourceCommit,r.liveSourceCommit);
  const previousBackup = json(root+'checked-candidate-backup.json'); assert(previousBackup.fullReadback&&previousBackup.zipIntegrity&&previousBackup.allPayloadHashesMatch);
  return {...r,successor};
}
export function verifyStorageRepairRelease(read = readFileSync) {
  const r = verifyStorageRepairContent(read), backup = JSON.parse(read(root+'backup.json'));
  assert(backup.driveId&&backup.fullReadback&&backup.zipIntegrity&&backup.allPayloadHashesMatch);
  assert.deepEqual(backup.files,r.files); assert.deepEqual(backup.evidenceFiles,r.evidenceFiles); return r;
}
export function readBeforeStorageRepair(file,r,read=readFileSync) {
  return r.changedFiles.includes(file) ? git('show',r.baselineSourceCommit+':'+file) : readBeforePointerFocus(file,r.successor,read);
}
