import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='08fda5b385ed384d7bf6bebae7a8a2d388c4ac39',live='6a4c2acd346c436cb0344b77da21de8dadc09c16';
const folder='docs/insights-menu-link-20261101/',header='components/product/taalroute-header.tsx';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifyInsightsMenuRelease(read=readFileSync){
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-insights-menu-link-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceChangeApproved);
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);
 assert(r.userRequest.includes('inzichtenlink')&&r.destinationClarification.includes('inzicht.taalroute.nl'));
 git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const [f,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(f)),h,f);
 assert.deepEqual(changed.filter(f=>/^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f)),[header]);
 const before=git('show',base+':'+header).toString();
 const expected=before.replace('ChevronDown, Presentation }','ChevronDown, Presentation, ChartNoAxesCombined }').replace('<span>Klink+docent</span></a></div>','<span>Klink+docent</span></a><a href="https://inzicht.taalroute.nl/" target="_blank" rel="noopener noreferrer"><ChartNoAxesCombined aria-hidden="true"/><span>Inzichten</span></a></div>');
 assert.notEqual(expected,before);assert.equal(read(header).toString(),expected,'Only the approved external menu link and its existing Lucide icon');
 const floor='docs/appearance-floor-20261031/floor.json',old=JSON.parse(git('show',base+':'+floor));assert.deepEqual(json(floor),{...old,approvedUpdates:[...old.approvedUpdates,r.approval]});
 const approval=json(r.approval);assert(approval.appearanceChangeApproved&&approval.publicationApproved);assert.equal(approval.destination,'https://inzicht.taalroute.nl/');assert.deepEqual(approval.files,{[header]:r.files[header]});
 const proof=json(folder+'local/checks.json');assert.equal(proof.checks.length,16);assert.deepEqual(proof.errors,[]);
 for(const c of proof.checks)for(const k of ['oneLink','realDestination','existingMenuRetained','visibleWithoutScroll','sourcePageAndStoragePreserved','escapeRestoresFocus'])assert.equal(c[k],true,k);
 const v=json(folder+'verification.json');for(const k of ['types','lint','onlyExternalMenuLink','realLoginPageVerified','contentAudioProgressUnchanged','localOnly'])assert.equal(v[k],true,k);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return r;
}
export function readBeforeInsightsMenu(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):read(file);}
