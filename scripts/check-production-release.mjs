import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const compare=(a,b)=>a < b ? -1 : a > b ? 1 : 0;
const sha=b=>createHash('sha256').update(b).digest('hex');
export function verifyProductionRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-production-20261029.json'));
 assert.equal(r.baselineSourceCommit,'b10aa30ea9969c2e98845d4342e22a35060fd131');
 assert.equal(r.liveSourceCommit,'548fd736208b3e99262c6ae7ec9a0b306a425d35');
 assert.equal(r.userRequest,'Moet afgemaakt worden en online gezet worden.');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.newImageGenerationApproved,false);assert.equal(r.humanListeningReview,'open');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);
 git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort(compare);
 assert.deepEqual(changed,[...r.changedFiles].sort(compare));
 for(const [file,hash] of Object.entries(r.files))assert.equal(sha(read(file)),hash,file);
 assert(changed.every(file=>r.files[file]));
 const oldPublic=lines(git('diff','--name-status',r.baselineSourceCommit,'--','public'));
 assert(oldPublic.every(line=>line.startsWith('A\t')),'All existing public media must remain byte-identical');
 assert.equal(git('diff',r.baselineSourceCommit,'--','app','hooks','db','drizzle','lib/learner-progress.ts','data/klink-curriculum.json','data/klink-media.json','data/klink-audio-policy.json','package.json','package-lock.json').length,0,'Preserve app, storage, curriculum, original media policy and dependencies');
 for(const file of changed.filter(f=>f.startsWith('public/')))assert(/^public\/(?:practice-content\/klink-20261029\/|package-media\/klink-productie-20261029\/|package-audio\/(?:afronding-20261029|kijk-luister-20261029|productie-instructies-20261029|alfa-c-online-20261029)\/)/.test(file),file);
 const report=JSON.parse(read(r.reviewPath));
 for(const key of ['types','lint','build','content','browser','answers','regression','images','audioMetadata','localOnly','storagePreserved'])assert.equal(report[key],true,key);
 const content=JSON.parse(read('docs/production-20261029/content-check.json'));
 assert.equal(content.collections,1113);assert.equal(content.exercisePlacements,56207);assert.equal(content.oldAlfaAIdsPreserved,true);assert.equal(content.all45AlfaBRecallTasks,true);
 const browser=JSON.parse(read('docs/production-20261029/browser-check.json'));assert.deepEqual(browser.errors,[]);assert(browser.checks.some(c=>c.allCollections===1113));
 const images=JSON.parse(read('docs/production-20261029/images.json'));assert.equal(images.length,10);assert(images.every(i=>i.handReview==='passed'&&i.placedReview==='passed'));assert(images.reduce((n,i)=>n+i.bytes,0)<600000);
 const media=JSON.parse(read('docs/production-20261029/audio-check.json'));assert.equal(media.files.length,914);assert(media.files.every(f=>f.metadataVerified&&f.hashVerified));
 const online=JSON.parse(read('docs/production-20261029/online-browser-check.json'));assert.deepEqual(online.errors,[]);assert.equal(online.checks.length,8);
 const functional=JSON.parse(read('docs/production-20261029/online-functional-check.json'));assert.equal(functional.steps.length,144);assert.deepEqual(functional.errors,[]);
 const teacher=JSON.parse(read('docs/production-20261029/online-teacher-check.json'));assert.equal(teacher.checks.length,66);assert.deepEqual(teacher.errors,[]);
 const onlineAudio=JSON.parse(read('docs/production-20261029/online-audio-check.json'));assert.equal(onlineAudio.files.length,29);assert(onlineAudio.files.every(f=>f.metadataVerified&&f.hashVerified));
 const existing=JSON.parse(read('docs/production-20261029/existing-public-check.json'));
 assert.equal(existing.baseline,r.baselineSourceCommit);assert.equal(existing.files.length,9745);
 const backup=JSON.parse(read('docs/production-20261029/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const file of changed)assert.equal(backup.runtimeFiles[file],r.files[file],`Verified Drive backup must contain current bytes: ${file}`);
 return r;
}
export function readBeforeProduction(file,release,read=readFileSync){
 return release.changedFiles.includes(file)?git('show',`${release.baselineSourceCommit}:${file}`):read(file);
}
