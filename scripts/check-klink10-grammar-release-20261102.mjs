import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyKlink10ListeningRelease,readBeforeKlink10Listening} from './check-klink10-listening-release-20261102.mjs';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sorted=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifyKlink10GrammarRelease(read=readFileSync){
 const next=verifyKlink10ListeningRelease(read),currentRead=read;read=file=>readBeforeKlink10Listening(file,next,currentRead);
 const json=p=>JSON.parse(read(p)),dir='docs/klink10-grammar-20261102/',r=json('docs/klink-owner-release-ten-grammar-20261102.json');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved&&r.existingAppearancePreserved&&r.progressPreserved);
 assert.equal(r.baselineSourceCommit,'5542367d083aa4658403459accee7401c6cc0324');assert.equal(r.liveSourceCommit,'ea847e63a452dac67577da3e34a73a9255e7eca0');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sorted(lines(git('diff','--name-only',r.baselineSourceCommit,next.baselineSourceCommit,'--',...roots)));
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sorted(Object.keys(r.files)),changed);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 const allowed=['data/klink-production-index.json','data/klink-word-listening-audio.json','data/klink-word-listening.json','lib/practice-chapters.ts','components/product/package-exercise-browser.tsx','scripts/test-practice-chapters.mjs','scripts/check-handwriting-short-screen-release-20261102.mjs','scripts/check-klink10-grammar-release-20261102.mjs','scripts/test-klink10-grammar-20261102.mjs','scripts/test-klink10-grammar-browser-20261102.mjs','scripts/test-klink10-grammar-media-20261102.mjs','scripts/test-klink10-grammar-release-20261102.mjs'];
 assert(changed.every(p=>p.startsWith('public/practice-content/klink10-grammar-20261102/')||p.startsWith('public/package-audio/klink10-grammar-20261102/')||allowed.includes(p)));
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public').length,0,'Existing media are immutable');
 const m=json(dir+'import-manifest.json'),ids=new Set(m.newRows.map(x=>x.row.id));assert.equal(m.sourcePositions,120);assert.equal(m.blockedSourcePositions,40);assert.equal(ids.size,12);
 assert.deepEqual(json('data/klink-production-index.json').filter(x=>!ids.has(x.id)),JSON.parse(git('show',r.baselineSourceCommit+':data/klink-production-index.json')));
 for(const p of ['data/klink-word-listening-audio.json','data/klink-word-listening.json']){const old=JSON.parse(git('show',r.baselineSourceCommit+':'+p)),current=json(p);for(const[k,v]of Object.entries(old))assert.deepEqual(current[k],v);assert.equal(Object.keys(current).length,Object.keys(old).length+5);}
 const seen=new Set();for(const{row,sha256}of m.newRows){assert.equal(sha(read('public'+row.url)),sha256);const bank=json('public'+row.url);assert.equal(bank.id,row.id);assert.equal(bank.exercises.length,10);for(const e of bank.exercises){assert(!seen.has(e.exerciseId));seen.add(e.exerciseId);assert(e.manualAdvance&&e.requiresExplicitCompletion);assert.equal(e.reviewEligible,false);}}
 assert.equal(seen.size,120);
 const content=json(dir+'local/content.json');assert.equal(content.checks.length,120);assert(content.allPriorCollectionsAndWordModelsPreserved);
 const browser=json(dir+'local/browser.json');assert.equal(browser.checks.length,480);assert.deepEqual(browser.errors,[]);assert(browser.existingProgressPreserved);
 const media=json(dir+'selected-media-verification.json');assert.equal(media.checks.length,Object.keys(m.newAudio).length+Object.keys(m.reusedAudio).length);assert(media.checks.every(c=>c.fullDecode));assert.equal(media.humanListening,false);
 const native=json(dir+'local/native-media.json');assert.equal(native.checks.length,media.checks.length*2);assert.equal(native.playerPlaybackChecks,6);
 assert(json(dir+'source-recheck.json').fullTextUnchanged);
 const v=json(dir+'verification.json');assert(v.types&&v.lint&&v.wordAudioCoverage&&v.coreTests&&v.screensVisuallyReviewed);assert.equal(v.humanListening,false);assert.equal(v.physicalDeviceTested,false);
 const backup=json(dir+'backup.json');assert(backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return {...r,next};
}
export function readBeforeKlink10Grammar(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeKlink10Listening(file,r.next,read);}
