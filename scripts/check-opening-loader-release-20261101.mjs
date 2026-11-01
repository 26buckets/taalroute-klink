import{verifyLearningGoalsRelease,readBeforeLearningGoals}from'./check-learning-goals-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='a160cd5816dd92e70feb6729e18dc74fe44d66a8',live='e6fc6294fb4670b0624c5e8c909018fe52ad5804';
const folder='docs/opening-loader-20261101/',floor='docs/appearance-floor-20261031/floor.json';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyOpeningLoaderRelease(read=readFileSync){
 const successor=verifyLearningGoalsRelease(read),currentRead=read;read=file=>readBeforeLearningGoals(file,successor,currentRead);
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-opening-loader-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceChangeApproved);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);
 assert.equal(r.userRequest,'Ja, deze is goed. Zet deze loader nu in Klink op de plek van ‘Klink wordt geopend…’. Houd de rest van de vormgeving en alle bestaande functies hetzelfde.');
 git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)));
 assert.deepEqual(changed,sort([...r.changedFiles,floor,r.approval]));assert.deepEqual(sort(Object.keys(r.files)),r.changedFiles);
 for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);
 const runtime=changed.filter(f=>/^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f));
 assert.deepEqual(runtime,sort(['app/page.tsx','components/product/classroom-boundary.tsx','components/product/klink-opening-loader.tsx','components/product/klink-opening-loader.css','public/opening-loader-v4-20261101/klink-loader.svg','public/opening-loader-v4-20261101/klink-static.svg']));
 for(const[file,statement]of[['app/page.tsx',"import { KlinkOpeningLoader } from '@/components/product/klink-opening-loader';"],['components/product/classroom-boundary.tsx',"import { KlinkOpeningLoader } from './klink-opening-loader';"]]){
  assert.equal(read(file).toString(),git('show',base+':'+file).toString().replace("'use client';","'use client';\n\n"+statement).replaceAll('<output>Klink wordt geopend…</output>','<KlinkOpeningLoader />'),'Only replace the existing loader; retain all routing, privacy and recovery logic');
 }
 const assets=json(folder+'approved-assets.json');for(const[name,h]of Object.entries(assets.files))assert.equal(sha(read('public/opening-loader-v4-20261101/'+name)),h,'Exact approved v4 asset');
 const oldFloor=JSON.parse(git('show',base+':'+floor));assert.deepEqual(json(floor),{...oldFloor,approvedUpdates:[...oldFloor.approvedUpdates,r.approval]});
 const approval=json(r.approval);assert.equal(approval.userRequest,r.userRequest);assert.deepEqual(approval.files,Object.fromEntries(runtime.map(f=>[f,r.files[f]])));assert(approval.publicationApproved&&approval.appearanceChangeApproved);
 const browser=json(folder+'local/checks.json');assert.equal(browser.checks.length,32);assert.deepEqual(browser.errors,[]);for(const c of browser.checks)for(const k of['visibleDuringLoad','removedWhenReady','noControls','noFakeProgress','storagePreserved','routePreserved'])assert.equal(c[k],true,k);assert(browser.checks.filter(c=>c.reducedMotion==='reduce').every(c=>c.staticStable));assert.equal(browser.checks.filter(c=>c.oneShot).length,2);
 const views=json(folder+'screens/checks.json');assert.equal(views.checks.length,24);assert.deepEqual(views.errors,[]);assert(views.checks.every(c=>c.changedFraction<0.001));
 const info=json(folder+'info/checks.json');assert.equal(info.checks.length,12);assert.deepEqual(info.errors,[]);for(const c of info.checks)assert(c.keyboardContained&&c.answerPreserved&&c.progressPreserved&&c.reloadPreserved&&c.teacherNotesPrivate);
 const proof=json(folder+'verification.json');for(const k of['types','lint','teacherRecovery','teacherPrivacy','approvedAssetsUnchanged','runtimeScopeExact','appearanceCompared','contentMediaAndStorageUnchanged','localOnly'])assert.equal(proof[k],true,k);
 for(const[f,h]of Object.entries(r.evidenceFiles))assert.equal(sha(read(f)),h,f);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return {...r,successor};
}
export function readBeforeOpeningLoader(file,r,read=readFileSync){return r.changedFiles.includes(file)||file===floor?git('show',base+':'+file):readBeforeLearningGoals(file,r.successor,read);}
