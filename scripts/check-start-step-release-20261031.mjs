import {verifyWordLibraryRelease,readBeforeWordLibrary} from './check-word-library-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
export function verifyStartStepRelease(read=readFileSync){
 const successor=verifyWordLibraryRelease(read),currentRead=read;read=file=>readBeforeWordLibrary(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-start-step-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChangeApproved,true);
 assert.equal(r.baselineSourceCommit,'ec613bafcdae4591add4b94a65390773df46738f');assert.equal(r.liveSourceCommit,'cc7fff4646d3ad9bdb33f13cc7e75eec1b356fa2');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json'));assert.equal(floor.scope,'appearance-only');assert.equal(floor.sourceCommit,r.liveSourceCommit);
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 const expected=['components/product/learner-app.tsx','scripts/test-direct-navigation-browser.mjs','scripts/check-start-step-release-20261031.mjs','scripts/check-docent-lessons-release-20261031.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,expected);assert.deepEqual(r.changedFiles,expected);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 const file='components/product/learner-app.tsx',before=git('show',r.baselineSourceCommit+':'+file).toString();
 const button='    <button className="secondary-button" onClick={onPackages}><PackageOpen aria-hidden="true" />Stap voor stap<ArrowRight aria-hidden="true" /></button>\n';
 const sound='      <button className="secondary-button" onClick={onSounds}><Ear aria-hidden="true" />Klankenkaart<ArrowRight aria-hidden="true" /></button>\n';
 assert.equal(before.split(button).length,2);assert.equal(before.split(sound).length,2);
 assert.equal(read(file).toString(),before.replace(button,'').replace(sound,sound+'  '+button),'Only move the existing button');
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','app','hooks','data','lib','public').length,0,'Existing styles, content, media, audio and storage unchanged');
 const review=JSON.parse(read('docs/start-step-20261031/review.json'));for(const k of ['navigation','mobile','keyboard','progress','contentPreserved','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/start-step-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeStartStep(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeWordLibrary(file,r.successor,read);}
