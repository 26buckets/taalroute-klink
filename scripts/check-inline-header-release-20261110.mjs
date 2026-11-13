import assert from 'node:assert/strict';
import {verifyNicoAudioRelease, readBeforeNicoAudio, nicoBaseline} from './check-nico-audio-release-20261113.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const headerBaseline='d5323c964970eaf9691fab0c3eb62d7d144f91b3';
const folder='docs/header-inline-20261110/',floor='docs/appearance-floor-20261031/floor.json',update='docs/appearance-floor-20261031/approved-updates/inline-header-20261110.json';
const expected=['VORMGEVING-VASTGEZET.md','app/taalroute-header.css','components/product/taalroute-header.tsx',floor,update,'public/taalroute-menu/menu-controls.css','public/taalroute-menu/app-chooser.css','scripts/check-inline-header-release-20261110.mjs','scripts/check-ui-release-20261109.mjs','scripts/deploy-static-audio.mjs','scripts/test-inline-header-release-20261110.mjs','scripts/test-shared-header-browser.mjs','scripts/test-teacher-direct-board-browser.mjs'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.sort((a,b)=>a<b?-1:a>b?1:0),lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyInlineHeaderRelease(read=readFileSync){
 const nico=verifyNicoAudioRelease(read),currentRead=read;read=path=>readBeforeNicoAudio(path,nico,currentRead);
 const json=p=>JSON.parse(read(p)),r=json(folder+'approval.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceChangeApproved);assert.equal(r.userRequest,'Ja, dit is wat ik bedoel. Trek deze header nu door naar alle Taalroute-apps, met de appnaam altijd naast het logo en alle knoppen vierkant. zet alles online');assert.equal(r.baselineSourceCommit,headerBaseline);
 assert.equal(r.liveSourceCommit,'165de2436468739873b70f861170903b3c21a03d');assert.equal(r.liveWorkerVersion,'eaf4a3c9-109e-456b-be07-1585712f04bf');assert.equal(r.liveAudioWorkerVersion,'d4878527-6ef1-426f-89c8-a76ec5918405');assert.equal(r.newMeteredServices,0);assert(r.audioWorkerPreviouslyExists);assert.equal(r.normalCommand,'npm run deploy');
 git('merge-base','--is-ancestor',r.liveSourceCommit,headerBaseline);git('merge-base','--is-ancestor',headerBaseline,'HEAD');
 const changed=sort(lines(git('diff','--name-only',headerBaseline,nicoBaseline)).filter(p=>!p.startsWith(folder)&&p!=='PUBLICATIE-ACTUEEL.md'));
 assert.deepEqual(changed,sort([...expected]));assert.deepEqual(sort(Object.keys(r.files)),sort([...expected]));for(const[p,h]of Object.entries(r.files))assert.equal(sha(read(p)),h,p);
 const oldFloor=JSON.parse(git('show',headerBaseline+':'+floor));assert.deepEqual(json(floor),{...oldFloor,approvedUpdates:[...oldFloor.approvedUpdates,update]});const appearance=json(update);assert.equal(appearance.userRequest,r.userRequest);assert(appearance.publicationApproved&&appearance.appearanceChangeApproved);for(const[p,h]of Object.entries(appearance.files))assert.equal(sha(read(p)),h,p);
 const checks=json(folder+'verification.json');assert(checks.headerLayouts===8&&checks.teacherMaterials&&checks.existingNavigation&&checks.contentMediaAndStorageUnchanged&&checks.noWorkflows);
 const backup=json(folder+'backup.json');assert(backup.readbackVerified&&backup.sha256&&backup.url);return {...r,nico};
}
export function readBeforeInlineHeader(file,release,read=readFileSync){return release&&Object.hasOwn(release.files,file)?git('show',headerBaseline+':'+file):release?.nico?readBeforeNicoAudio(file,release.nico,read):read(file);}
