import {verifyAnswerArrowSpaceRelease,readBeforeAnswerArrowSpace} from './check-answer-arrow-space-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='b7c04d8da4835c8b01f8314bd6247710ed75d0bf',folder='docs/opening-loader-duration-20261101/',floor='docs/appearance-floor-20261031/floor.json';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyOpeningLoaderDuration(read=readFileSync){
 const successor=verifyAnswerArrowSpaceRelease(read),currentRead=read;read=file=>readBeforeAnswerArrowSpace(file,successor,currentRead);
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-opening-loader-duration-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,base);assert.equal(r.userAnswer,'Ja, op de website');assert(r.userQuestion.includes('twee seconden'));git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)));assert.deepEqual(changed,sort([...r.changedFiles,floor,r.approval]));assert.deepEqual(sort(Object.keys(r.files)),r.changedFiles);
 for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);for(const[f,h]of Object.entries(r.evidenceFiles))assert.equal(sha(read(f)),h,f);
 const runtime=changed.filter(f=>/^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f));assert.deepEqual(runtime,['components/product/classroom-boundary.tsx','components/product/klink-opening-loader.tsx']);
 const loader=read(runtime[1]).toString(),boundary=read(runtime[0]).toString();assert(loader.includes('setTimeout(onComplete, 2000)'));assert(loader.includes('decode().then(start, start)'));assert(loader.includes('window.clearTimeout(timer)'));assert(boundary.includes('!openingComplete || !workspaceLoaded'));assert(boundary.includes('void preload.then(loaded, loaded)'));
 const oldFloor=JSON.parse(git('show',base+':'+floor));assert.deepEqual(json(floor),{...oldFloor,approvedUpdates:[...oldFloor.approvedUpdates,r.approval]});assert.equal(json(r.approval).userAnswer,r.userAnswer);assert.deepEqual(json(r.approval).files,Object.fromEntries(runtime.map(f=>[f,r.files[f]])));
 const checks=json(folder+'local/checks.json');assert.equal(checks.checks.length,32);assert.deepEqual(checks.errors,[]);assert(checks.checks.every(c=>c.minimumDuration&&c.parallelLoading&&c.routeAndStoragePreserved&&c.opens));
 const views=json(folder+'screens/after/checks.json');assert.equal(views.checks.length,24);assert.deepEqual(views.errors,[]);assert(views.checks.every(c=>c.changedFraction<.001));
 const verification=json(folder+'verification.json');for(const k of ['types','lint','teacherRecovery','teacherPrivacy','reactReview','originalArtworkPreserved','contentMediaAndStorageUnchanged','localOnly'])assert.equal(verification[k],true,k);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return {...r,successor};
}
export function readBeforeOpeningLoaderDuration(file,r,read=readFileSync){return r.changedFiles.includes(file)||file===floor?git('show',base+':'+file):readBeforeAnswerArrowSpace(file,r.successor,read);}
