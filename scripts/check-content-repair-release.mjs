import {verifyDirectNavigationRelease,readBeforeDirectNavigation} from './check-direct-navigation-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
export const repairBaseline='9d4a78ed';
export function verifyContentAmendments(read=readFileSync){
 const m=JSON.parse(read('docs/content-audio-repair-20261030/source-amendments.json'));
 assert.equal(m.baseline,repairBaseline);
 for(const file of new Set(m.changes.map(c=>c.path[0]))){
  const current=JSON.parse(read(file));
  for(const c of m.changes.filter(c=>c.path[0]===file)){
   let o=current;for(const key of c.path.slice(1,-1))o=o[key];const key=c.path.at(-1);
   if(!c.removed)assert.deepEqual(o[key],c.after,c.path.join('/'));
   if(c.added)delete o[key];else o[key]=c.before;
  }
  assert.deepEqual(current,JSON.parse(git('show',repairBaseline+':'+file)),file);
 }
 return m;
}
export function verifyContentRepairRelease(read=readFileSync){
 const successor=verifyDirectNavigationRelease(read),currentRead=read;read=file=>readBeforeDirectNavigation(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-content-repair-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Ja, herstel ook die vijf twijfelachtige opnamen, de medische dialoog en de zin met keel. Je mag daarvoor nieuwe audio maken. Los daarna de publicatieproblemen op, controleer alles en zet de herstelversie live.');
 assert.equal(r.baselineSourceCommit,'624f5a02');assert.equal(r.liveSourceCommit,'3d72be4d35cf1c8a2ac9ed386a0198e3094d2ca9');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots))])].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const allowed=['components/product/imported-teacher-workflow.tsx','lib/connected-content.ts','data/klink-connected-content.json','data/klink-content-routing.json','data/klink-dialogue-repair.json','data/klink-functional-writing.json','data/klink-imported-practice.json','data/klink-docent-mat.json','data/klink-media.json','public/content-register/active.json','public/content-register/planned.json','public/content-register/summary.json','scripts/build-audio-register.mjs','scripts/check-archive-continuation-release.mjs','scripts/check-dialogue-release.mjs','scripts/check-curriculum-release.mjs','scripts/check-content-repair-release.mjs','scripts/test-archive-continuation-20261030.mjs','scripts/test-sections.mjs','scripts/test-dialogue-repair.mjs','scripts/test-cumulative-integration.mjs','scripts/test-content-repair-20261030.mjs','scripts/test-content-repair-browser-20261030.mjs','scripts/test-content-audio-repair-20261030.mjs','scripts/test-content-audio-repair-browser-20261030.mjs'];
 assert(changed.every(f=>allowed.includes(f)||/^public\/package-audio\/inhoudherstel-20261030\/(bij|glas|hoed|groente-kort|groente-lang|keel|medische-vraag)\.mp3$/.test(f)));
 for(const [f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);
 for(const f of changed)assert(r.files[f],f);
 verifyContentAmendments(read);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,successor.baselineSourceCommit,'--','public/package-audio').length,0,'Old recordings stay intact');
 const clips=JSON.parse(read('docs/content-audio-repair-20261030/audio.json'));assert.equal(clips.length,7);
 for(const c of clips){assert.equal(sha(read('public'+c.src)),c.sha256);assert(c.metadataVerified&&c.audioPacketsUnchanged);assert.notEqual(c.voiceId,'h6uBOiAjLKklte8hdYio');for(const k of ['artist','album_artist','publisher'])assert.equal(c.metadata[k],'Taalroute');}
 const review=JSON.parse(read('docs/content-audio-repair-20261030/review.json'));
 for(const k of ['types','lint','build','unit','browser','nativePlayback','audioMetadata','preservation','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/content-audio-repair-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeContentRepair(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeDirectNavigation(file,r.successor,read);}
