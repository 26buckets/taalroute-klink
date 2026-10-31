import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6});
const base='92e78dc85e137856314818bd28eb72e8288288f2';
const runtime='components/product/practice-line.tsx';
const allowed=[runtime,'scripts/check-listen-playfield-left-release-20261031.mjs','scripts/check-single-practice-title-release-20261031.mjs','scripts/test-single-practice-title-release-20261031.mjs','scripts/test-single-practice-title-browser-20261031.mjs'].sort();
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifySinglePracticeTitleRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-single-practice-title-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,'e1a13cd175fed4b235ebb4017b85f3444e214474');assert(r.userRequest);
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const lines=b=>b.toString().trim().split('\n').filter(Boolean);
 const changed=[...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,allowed);assert.deepEqual(r.changedFiles,allowed);assert.deepEqual(Object.keys(r.files).sort(),allowed);
 for(const f of allowed)assert.equal(createHash('sha256').update(read(f)).digest('hex'),r.files[f],f);
 assert.equal(read(runtime).toString(),git('show',base+':'+runtime).toString().replace('<h2>Zo oefen je</h2>','{onSelect && <h2>Zo oefen je</h2>}'),'Only the redundant overview heading changes');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),old=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));
 assert.deepEqual({...floor,approvedUpdates:old.approvedUpdates},old);assert.deepEqual(floor.approvedUpdates,[...old.approvedUpdates,r.approval]);
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.deepEqual(approval.files,r.files);
 const checks=JSON.parse(read('docs/single-practice-title-20261031/browser-checks.json'));assert.equal(checks.checks.length,12);assert.deepEqual(checks.errors,[]);
 const backup=JSON.parse(read('docs/single-practice-title-20261031/backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);
 return r;
}
export function readBeforeSinglePracticeTitle(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',base+':'+file):read(file);}
