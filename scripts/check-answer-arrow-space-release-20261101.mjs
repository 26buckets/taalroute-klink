import {verifyCardTitlesRelease,readBeforeCardTitles} from './check-card-titles-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const base='38b937ebb11005942fc018e603f6658a53882857',live='b670d0c1337eea07e96662237de4b9508de9735c';
const folder='docs/answer-arrow-space-20261101/';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];

export function verifyAnswerArrowSpaceRelease(read=readFileSync) {
  const successor=verifyCardTitlesRelease(read),currentRead=read;read=file=>readBeforeCardTitles(file,successor,currentRead);
  const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-answer-arrow-space-20261101.json');
  assert.equal(r.approvedBy,'Nico');
  assert(r.publicationApproved&&r.appearanceUnchanged);
  assert.equal(r.baselineSourceCommit,base);
  assert.equal(r.liveSourceCommit,live);
  assert(r.userRequest.includes('pijltjestoetsen en spatie'));
  git('merge-base','--is-ancestor',live,base);
  git('merge-base','--is-ancestor',base,'HEAD');
  const changed=sort([...new Set([...lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)),])]);
  assert.deepEqual(changed,r.changedFiles);
  assert.deepEqual(sort(Object.keys(r.files)),changed);
  assert.deepEqual(changed.filter(f=>!f.startsWith('scripts/')),['docs/KLINK-DOCENTHANDLEIDING.md','hooks/use-practice-keyboard.ts']);
  for(const [f,h] of Object.entries(r.files)) assert.equal(sha(read(f)),h,f);
  for(const [f,h] of Object.entries(r.evidenceFiles)) assert.equal(sha(read(f)),h,f);
  const focused=json(folder+'local/focus.json');
  assert.equal(focused.checks.length,20);assert.deepEqual(focused.errors,[]);
  assert(focused.checks.every(c=>(c.scenario==='selected-space'?c.selectedAnswerAudioReplay&&c.spaceKeepsAnswer:c.arrowsFromActualFocus&&c.heldKeySafe)&&c.storagePreserved));
  assert.equal(focused.checks.filter(c=>c.spaceKeepsAnswer&&c.spaceDoesNotScroll).length,8);
  const audio=json(folder+'local/audio.json');
  assert.equal(audio.checks.length,2);assert.deepEqual(audio.errors,[]);
  assert(audio.checks.every(c=>c.nativeAudio&&c.spaceFromActualBodyFocus&&c.arrowAfterCorrectWhilePlaying&&c.backBlockedDuringAudio&&c.oldAudioStopped&&c.storagePreserved));
  for(const [name,count] of [['enter',8],['sheets',4],['existing',14]]) {
    const checks=json(folder+'local/'+name+'.json');assert.equal(checks.checks.length,count);assert.deepEqual(checks.errors,[]);
  }
  const parity=json(folder+'local/parity.json');
  assert.equal(parity.forms,60);assert.equal(parity.checks.length,482);assert.deepEqual(parity.errors,[]);
  const verification=json(folder+'verification.json');
  for(const k of ['types','lint','actualMouseFocus','nativeInputAndRecording','enterRegression','contentAudioProgressUnchanged','appearanceUnchanged','localOnly']) assert.equal(verification[k],true,k);
  const backup=json(folder+'backup.json');
  assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);
  assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
  return {...r,successor};
}
export function readBeforeAnswerArrowSpace(file,r,read=readFileSync) {
  return r.changedFiles.includes(file)?git('show',base+':'+file):readBeforeCardTitles(file,r.successor,read);
}
