import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((x,y)=>x.localeCompare(y));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const folder='docs/writing-messages-texts-audio-fix-20261103/';
export function verifyMessagesTextsAudioFix(read=readFileSync,end){
 const json=p=>JSON.parse(read(p)),r=json('docs/klink-owner-release-messages-texts-audio-fix-20261103.json'),m=json(folder+'import-manifest.json'),a=json(folder+'audio-review.json'),old=p=>git('show',r.baselineSourceCommit+':'+p);
 assert.equal(r.baselineSourceCommit,m.baselineSourceCommit);assert.equal(r.liveSourceCommit,r.baselineSourceCommit);assert.equal(json(folder+'baseline-live-release.json').sourceCommit,r.liveSourceCommit);
 git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved);assert.equal(r.standingPolicySha256,sha(read('docs/klink-invullen-20261101/automatic-owner-approval.json')));
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,...(end?[end]:[]),'--',...roots)),...(end?[]:lines(git('ls-files','--others','--exclude-standard','--',...roots)))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const [p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,...(end?[end]:[]),'--','public').length,0);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,...(end?[end]:[]),'--','app','components','lib','hooks','.github').length,0);
 assert.equal(a.bundles.length,2);const packs=new Map(a.bundles.map(b=>{const data=read('public'+b.src);assert.equal(sha(data),b.sha256);assert.equal(data.length,b.bytes);assert(data.length<4*1024*1024);return [b.src,data];}));
 const historicalAudio=read('public'+a.supersededBundle.src);assert.equal(sha(historicalAudio),a.supersededBundle.sha256);assert(Buffer.concat([...packs.values()]).equals(historicalAudio));
 const prev=JSON.parse(old('docs/writing-messages-texts-20261103/audio-review.json'));assert.equal(a.selected.length,70);
 for(const [i,x]of a.selected.entries()){assert.deepEqual(x.record,prev.selected[i].record);assert.equal(sha(packs.get(x.source.src).subarray(x.offset,x.offset+x.length)),x.record.sha256);}
 const previous=JSON.parse(old('docs/writing-messages-texts-20261103/import-manifest.json')),bundle=json('public'+m.deliveryBundle.src);assert.equal(sha(read('public'+m.deliveryBundle.src)),m.deliveryBundle.sha256);
 assert.equal(previous.newRows.length,33);assert.equal(m.newRows.length,33);
 for(const [i,{row,sha256,sourceIds}] of m.newRows.entries()){
  const p=previous.newRows[i];assert.deepEqual(sourceIds,p.sourceIds);assert.deepEqual(row,{...p.row,url:row.url,bundleUrl:row.bundleUrl});
  const bytes=read('public'+row.url),prior=json('public'+p.row.url);assert.equal(sha(bytes),sha256);assert.equal(bundle.banks[row.id],bytes.toString());
  for(const e of prior.exercises){const k=e.exerciseId.includes('-SB-')?'SB':'ZS';assert.equal(e.instructionAudio.src,prev.instructions[k].src);e.instructionAudio.src=a.instructions[k].src;}
  assert.deepEqual(JSON.parse(bytes),prior);
 }
 const idx='data/klink-production-index.json',ins='data/klink-production-instructions.json';
 assert.deepEqual(json(idx),[...JSON.parse(old(idx)).slice(0,-33),...m.newRows.map(x=>x.row)]);
 assert.deepEqual(json(ins),[...JSON.parse(old(ins)).slice(0,-2),...Object.values(a.instructions)]);
 assert.equal(json(folder+'local/media.json').checks.length,70);
 const b=json(folder+'local/browser.json');assert.equal(b.checks.length,440);assert.equal(b.native.length,4);assert(b.fullResponseScenario);assert.deepEqual(b.errors,[]);
 const l=json(folder+'local/layout-native.json');assert.equal(l.checks.length,16);assert.equal(l.played.length,4);
 const backup=json(folder+'backup.json');assert(backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforeMessagesTextsAudioFix(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
