import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='0391320925fc10e4ec86f9c4e8b837fe660df46e',folder='docs/learner-info-release-20261101/',floor='docs/appearance-floor-20261031/floor.json';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyLearnerInfoRelease(read=readFileSync){
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-learner-info-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceChangeApproved);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,base);assert(r.userRequest.includes('Zet het ⓘ naast de vraag en de docentnotities bij de voorbereiding'));git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,sort([...r.changedFiles,floor,r.approval]));assert.deepEqual(sort(Object.keys(r.files)),r.changedFiles);for(const f of r.changedFiles)assert.equal(sha(read(f)),r.files[f],f);
 assert.deepEqual(lines(git('diff','--name-only',base,'--','app','components','hooks')),['app/learner-layout.css','components/product/imported-practice-surface.tsx','components/product/imported-teacher-workflow.tsx','hooks/use-practice-keyboard.ts']);
 assert.equal(git('diff','--name-only',base,'--','data','lib','public','db','drizzle','.github','AGENTS.md','package.json','package-lock.json','wrangler.jsonc').length,0,'Preserve content, media, storage, routes, dependencies and workflows');
 for(const f of ['app/learner-layout.css','components/product/imported-practice-surface.tsx','components/product/imported-teacher-workflow.tsx'])assert.equal(sha(read(f)),sha(git('show','6492b44a9bd2ac51a9e99f29544715b9130e527a:'+f)),'Only the explicitly approved working preview');
 const hook='hooks/use-practice-keyboard.ts';assert.equal(read(hook).toString(),git('show',base+':'+hook).toString().replace('[role="dialog"]', '[role="dialog"], [aria-haspopup="dialog"]'),'Only protect native dialog-trigger keys');
 const oldFloor=JSON.parse(git('show',base+':'+floor)),newFloor=json(floor);assert.deepEqual(newFloor,{...oldFloor,approvedUpdates:[...oldFloor.approvedUpdates,r.approval]});
 const approval=json(r.approval);assert.equal(approval.userRequest,r.userRequest);assert.equal(approval.baselineSourceCommit,base);assert(approval.appearanceChangeApproved&&approval.publicationApproved);assert.deepEqual(approval.files,Object.fromEntries(Object.entries(r.files).filter(([f])=>f.startsWith('app/')||f.startsWith('components/'))));
 const info=json(folder+'local/info/checks.json');assert.equal(info.checks.length,12);assert.deepEqual(info.errors,[]);for(const c of info.checks)for(const k of['fits','noScroll','targets','focusRestored','keyboardContained','answerPreserved','progressPreserved','reloadPreserved','teacherNotesPrivate','oldButtonRemoved'])assert.equal(c[k],true,k);
 const imported=json(folder+'local/imported/browser-checks.json');assert.equal(imported.errors.length,0);assert(imported.checks.length>=9);
 const keyboard=json(folder+'local/keyboard/checks.json');assert.equal(keyboard.checks.length,16);assert.equal(keyboard.audioNext.length,12);assert.equal(keyboard.native.length,2);assert.deepEqual(keyboard.errors,[]);
 const checks=json(folder+'verification.json');for(const k of['types','lint','keyboard','touch','teacherPreparationPrivacy','answerAndProgress','approvedPreviewUnchanged','contentAndMediaUnchanged','localOnly'])assert.equal(checks[k],true,k);
 for(const[f,h]of Object.entries(r.evidenceFiles))assert.equal(sha(read(f)),h,f);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforeLearnerInfo(file,r,read=readFileSync){return r.changedFiles.includes(file)||file===floor?git('show',base+':'+file):read(file);}
