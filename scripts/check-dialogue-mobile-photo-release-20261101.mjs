import {verifyTeacherModuleRecoveryRelease,readBeforeTeacherModuleRecovery} from './check-teacher-module-recovery-release-20261101.mjs';
import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const base='51f4cbcfe704a2358d80e95988f363da50bd634c',folder='docs/dialogue-mobile-photo-20261101/';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['VORMGEVING-VASTGEZET.md','app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const allowed=sort(['VORMGEVING-VASTGEZET.md','app/learner-layout.css','scripts/check-synonym-context-release-20261101.mjs','scripts/check-dialogue-mobile-photo-release-20261101.mjs','scripts/test-dialogue-mobile-photo-release-20261101.mjs','scripts/test-dialogue-mobile-photo-browser-20261101.mjs']);
export function verifyDialogueMobilePhotoRelease(read=readFileSync){
 const successor=verifyTeacherModuleRecoveryRelease(read),currentRead=read;read=file=>readBeforeTeacherModuleRecovery(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-dialogue-mobile-photo-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChangeApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,'51f4cbcfe704a2358d80e95988f363da50bd634c');assert(r.userRequest.includes('Maak die kleiner'));
 assert.equal(JSON.parse(read(r.publicationAuthorizationRef)).publicationApproved,true);git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)));
 assert.deepEqual(changed,allowed);assert.deepEqual(r.changedFiles,allowed);assert.deepEqual(sort(Object.keys(r.files)),allowed);for(const f of allowed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',base,successor.baselineSourceCommit,'--','components','hooks','data','lib','public','db','drizzle','.github','package.json','package-lock.json','wrangler.jsonc').length,0,'No content, media, player logic, persistence or dependencies change');
 assert(read('app/learner-layout.css').toString().startsWith(git('show',base+':app/learner-layout.css').toString()),'Only the approved mobile overrides are appended');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),old=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));
 assert.deepEqual({...floor,approvedUpdates:old.approvedUpdates},old);assert.deepEqual(floor.approvedUpdates,[...old.approvedUpdates,r.approval]);const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.deepEqual(approval.files,r.files);
 const browser=JSON.parse(read(folder+'browser-checks.json'));assert.equal(browser.dialogues,128);assert.equal(browser.images,16);assert.equal(browser.checks.length,48);assert.equal(browser.native.length,2);assert.deepEqual(browser.errors,[]);assert.equal(browser.checks.filter(c=>c.desktopPixelIdentical).length,4);assert(browser.native.every(c=>c.nativeOriginalFourTurns&&c.miniPanelTouchDuringPlayback&&c.spaceReplay&&c.pause&&c.progressPreserved));
 const review=JSON.parse(read(folder+'review.json'));for(const key of['contentPreserved','audioPreserved','progressPreserved','desktopPreserved','photoUncropped','textSizePreserved','controlsVisible','mobileTouch','keyboard','nativePlayback','lint','localOnly'])assert.equal(review[key],true,key);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);return {...r,successor};
}
export function readBeforeDialogueMobilePhoto(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',base+':'+file):readBeforeTeacherModuleRecovery(file,r.successor,read);}
