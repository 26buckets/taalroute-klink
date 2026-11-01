import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='6233c816205a92f41f7f3a429a0ed3677632da6a';
const folder='docs/twenty-word-audio-20261101/';
export const twentyWordApprovalFile=folder+'approval.json';
const approvalHash='9b9bb27232ee45dbd2d1a2eb6be91fff44b85fcdfdb6c64669ed4fb40b41a31b';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const sorted=a=>a.toSorted((a,b)=>a<b?-1:a>b?1:0);
export function verifyTwentyWordAudioRelease(read=readFileSync){
 const bytes=read(twentyWordApprovalFile);assert.equal(sha(bytes),approvalHash,'Exact reviewed word-audio release');
 const r=JSON.parse(bytes);assert.equal(r.baselineSourceCommit,base);assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.humanListeningReview,'approved');
 assert.equal(r.userRequest,'Goed, deze twintig woorden klinken goed. Koppel ze nu aan de juiste woorden in Klink, controleer alles en zet ze online. Behoud de opmaak en de bestaande goede audio.');
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sorted([...new Set([...lines(git('diff','--name-only',base)),...lines(git('ls-files','--others','--exclude-standard'))])].filter(f=>!f.startsWith(folder)&&f!=='PUBLICATIE-ACTUEEL.md'&&f!=='scripts/check-twenty-word-audio-release-20261101.mjs'));
 assert.deepEqual(changed,sorted(Object.keys(r.files)),'Only the reviewed bindings, media and release checks may change');
 for(const[f,h]of Object.entries(r.files)){assert.equal(sha(read(f)),h.after,f);if(h.before)assert.equal(sha(git('show',base+':'+f)),h.before,f);}
 for(const[f,h]of Object.entries(r.evidenceFiles))assert.equal(sha(read(f)),h,f);
 const registry=JSON.parse(read('data/klink-word-audio-twenty-reviewed-20261101.json'));assert.equal(registry.approvedBy,'Nico');assert.equal(registry.publicationApproved,true);assert.equal(registry.clips.length,20);
 assert.deepEqual(registry.clips.map(c=>c.word),r.words);assert.equal(new Set(r.words).size,20);
 const review=JSON.parse(read(folder+'audio-review.json'));assert.equal(review.length,20);
 for(const c of registry.clips){
  assert.equal(c.humanReview,'approved');assert.equal(c.role,'target');assert.equal(c.voiceId,'0qLmDzgqulxcvv0yf3kg');assert.equal(c.metadataApproved,true);assert.equal(c.localOnly,true);
  const row=review.find(x=>x.word===c.word);assert(row);assert.equal(sha(read('public'+c.src)),row.sha256,c.word);assert.equal(row.retainedPcmUnchanged,true);
  for(const k of ['artist','album_artist','publisher'])assert.equal(row.metadata[k],'Taalroute');
 }
 return r;
}
export function readBeforeTwentyWordAudio(file,r,read=readFileSync){return r?.files[file]?.before?git('show',base+':'+file):read(file);}
