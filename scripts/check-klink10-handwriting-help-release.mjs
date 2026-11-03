import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const root='docs/klink10-handwriting-help-ac-20261103/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifyHandwritingHelpContent(read=readFileSync){
 const json=p=>JSON.parse(read(p)),r=json('docs/klink-owner-release-handwriting-help-ac-20261103.json'),m=json(root+'manifest.json'),old=p=>git('show',r.baselineSourceCommit+':'+p);
 assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved&&r.appearancePreserved&&r.progressPreserved);
 assert.equal(r.standingPolicySha256,sha(read('docs/klink-invullen-20261101/automatic-owner-approval.json')));
 assert.equal(r.baselineSourceCommit,m.baseMain);assert.equal(r.liveSourceCommit,json(root+'baseline-live-release.json').sourceCommit);
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 assert.deepEqual(changed.filter(p=>!p.startsWith('scripts/')),['components/product/package-exercise-browser.tsx','data/klink-handwriting-help-20261103.json']);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,'--','public','app','lib','hooks','.github','wrangler.jsonc','package.json','package-lock.json').length,0);
 const path='components/product/package-exercise-browser.tsx',before=old(path).toString(),after=read(path).toString(),withoutHelp=s=>s.replace(/^import handwritingHints.*\n/m,'').replace(/function HandwritingSurface\([\s\S]*?(?=\nfunction )/,'');
 assert.equal(withoutHelp(after),withoutHelp(before),'Only HandwritingSurface and its bound data import may change');
 const hints=json('data/klink-handwriting-help-20261103.json'),source=json(root+'selected-source.json');assert.equal(hints.length,10);assert.deepEqual(hints.map(x=>x.sourceId),m.sourceIds);
 for(const [i,h]of hints.entries()){assert.equal(h.sourceId,source[i].sourceId);assert.equal(h.model,source[i].model);assert.equal(h.listeningHint,source[i].listenHint);}
 const b=json(root+'browser.json');assert.equal(b.checks.length,40);assert.equal(b.legacyChecks.length,16);assert.equal(b.rounds.length,8);assert.equal(b.nativePlays.length,136);assert.deepEqual(b.errors,[]);assert.equal(b.simulatedPlayback,false);
 assert.equal(json(root+'storage-edge.json').checks.length,4);assert.equal(json(root+'final-sound-units.json').checks.length,2);
 const p=json(root+'preservation/result.json');assert.equal(p.checks.length,8);assert(p.checks.every(x=>x.maxChannelDelta<=1));
 const v=json(root+'verification.json');assert(v.typesPassed&&v.lintPassed&&v.normalBuildPassed);assert.equal(v.tests,8);assert(!v.humanNt2ReviewPerformed&&!v.humanListeningPerformed&&!v.physicalPhoneOrPenTested);
 const c=json(root+'capacity-review.json'),assets=json(root+'offered-build-assets.json');assert.equal(sha(read(root+'offered-build-assets.json')),c.manifestSha256);assert.equal(assets.count,assets.paths.length);assert.equal(assets.count,20000);assert(assets.paths.every(x=>x.bytes<=25*1024*1024));assert(c.noBudgetLimitOrConfigurationChange&&c.noNewPublicSourceFiles);assert.equal(c.previousOrdinaryDeployDemonstratedOfferedCount,20000);
 assert.deepEqual(hints.map(h=>h.listeningHintUnits.map(start=>h.listeningHint.slice(start).match(/^[a-z]+/)[0])),[['a'],['s','k'],[],[],[],['ee'],['oo'],['uu'],['z'],['oo']]);
 return r;
}
export function verifyHandwritingHelpRelease(read=readFileSync){
 const r=verifyHandwritingHelpContent(read),json=p=>JSON.parse(read(p));
 const backup=json(root+'gate-backup.json');assert(backup.driveId&&backup.fullReadback&&backup.zipIntegrity);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return r;
}
export function readBeforeHandwritingHelp(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
