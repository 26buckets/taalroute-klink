import {verifyB1ReviewedRelease,readBeforeB1Reviewed} from './check-b1-reviewed-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const base='ded58bb090a90c87f6a5881b35830fa44f3b4de2',folder='docs/space-mixed-input-20261101/';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];

export function verifySpaceMixedInputRelease(read=readFileSync) {
  const successor=verifyB1ReviewedRelease(read),currentRead=read;read=file=>readBeforeB1Reviewed(file,successor,currentRead);
  const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-space-mixed-input-20261101.json');
  assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceUnchanged);
  assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,base);
  assert(r.userRequest.includes('Spatie moet na een muiskeuze de audio herhalen'));
  assert(r.userRequest.includes('zet het online'));
  git('merge-base','--is-ancestor',base,'HEAD');
  const changed=sort(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)));
  assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
  for(const [f,h] of Object.entries({...r.files,...r.evidenceFiles})) assert.equal(sha(read(f)),h,f);
  assert.deepEqual(changed.filter(f=>!f.startsWith('scripts/')),['components/product/package-exercise-browser.tsx','hooks/use-practice-keyboard.ts']);
  const hook='hooks/use-practice-keyboard.ts',player='components/product/package-exercise-browser.tsx';
  const button="    const button = target.closest('button, a, summary, [role=\"button\"]');";
  const expectedHook=git('show',base+':'+hook).toString()
    .replace(button,button+"\n    root.dataset.practiceFocusNext = event.key === ' ' && (!button || selectedAnswer) ? 'false' : 'true';")
    .replace('  return { ref, onKeyDownCapture };','  return { ref, onKeyDownCapture, onPointerDownCapture: () => {\n    // A mouse or touch answer must not inherit an earlier keyboard focus move.\n    if (ref.current) delete ref.current.dataset.practiceFocusNext;\n  } };');
  assert.equal(read(hook).toString(),expectedHook,'Only focus provenance changes; existing shortcuts and safeguards remain');
  const expectedPlayer=git('show',base+':'+player).toString().replace("if (keyboardMode && result === 'right' && !recording) keyboard.ref.current?.querySelector", "if (keyboardMode && result === 'right' && !recording && keyboard.ref.current?.dataset.practiceFocusNext === 'true') keyboard.ref.current.querySelector");
  assert.equal(read(player).toString(),expectedPlayer,'No content, audio, assessment, storage, layout or other player changes');
  for(const [name,count] of [['mixed',8],['audio',4]]) {
    const proof=json(folder+'local/'+name+'.json');assert.equal(proof.checks.length,count);assert.deepEqual(proof.errors,[]);
    assert(proof.checks.every(c=>c.mouseAfterEnterReplay&&c.mouseAfterArrowsReplay&&c.repeatedReplay&&c.heldSpaceSafe&&c.answerRetained&&c.enterAndArrowsRetained&&c.explicitTabSpaceNative&&c.keyboardAnswerFocusPreserved&&c.storagePreserved));
    if(name==='audio') assert(proof.checks.every(c=>c.nativeAudio));
  }
  const existing=json(folder+'local/existing.json');assert.equal(existing.checks.length,14);assert.deepEqual(existing.errors,[]);
  const next=json(folder+'local/audio-next.json');assert.equal(next.checks.length,2);assert.deepEqual(next.errors,[]);assert(next.checks.every(c=>c.arrowAfterCorrectWhilePlaying&&c.oldAudioStopped));
  const parity=json(folder+'local/parity.json');assert.equal(parity.forms,60);assert.equal(parity.checks.length,482);assert.deepEqual(parity.errors,[]);
  const writing=json(folder+'local/writing.json');assert.equal(writing.checks.length,8);assert.equal(writing.preservation.length,2);assert.deepEqual(writing.errors,[]);assert(writing.checks.every(c=>c.progressPreserved&&c.oldSessionPreserved));
  const verification=json(folder+'verification.json');
  for(const key of ['types','lint','mouseTouchMix','nativeKeyboardAccessibility','realAudioReplay','latestApprovedBasisPreserved','contentAudioProgressUnchanged','appearanceUnchanged','localOnly']) assert.equal(verification[key],true,key);
  const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);
  assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
  return {...r,successor};
}
export function readBeforeSpaceMixedInput(file,r,read=readFileSync) {
  return r.changedFiles.includes(file)?git('show',base+':'+file):readBeforeB1Reviewed(file,r.successor,read);
}
