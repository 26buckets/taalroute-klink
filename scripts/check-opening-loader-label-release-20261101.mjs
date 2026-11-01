import {verifyInstructionCandidate,readBeforeInstructionCandidate} from './check-instruction-candidate.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='be7d78289945084612b20a0aa3058bb7730a43a5',folder='docs/opening-loader-label-20261101/';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyOpeningLoaderLabelRelease(read=readFileSync){
 const candidate=verifyInstructionCandidate(read),currentRead=read;read=file=>readBeforeInstructionCandidate(file,candidate,currentRead);
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-opening-loader-label-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceChangeApproved);
 assert.equal(r.userRequest,'Ik mis op dit moment nog wel klink wordt geopend. puntje puntje puntje.');
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort(lines(git('diff','--name-only',base,candidate.integration.liveSourceCommit,'--',...roots)));
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const [f,h] of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(f)),h,f);
 assert.deepEqual(changed.filter(f=>/^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f)),['components/product/klink-opening-loader.css','components/product/klink-opening-loader.tsx']);
 const component='components/product/klink-opening-loader.tsx',css='components/product/klink-opening-loader.css';
 assert.equal(read(component).toString(),git('show',base+':'+component).toString().replace('className="sr-only"','className="klink-opening-label"'),'Only expose the existing accessible text; timer, image decode and callbacks unchanged');
 const added='\n.klink-opening-label {\n  position: absolute;\n  top: calc(50% + 55px);\n  inset-inline: 0;\n  text-align: center;\n  font-size: 14px;\n  line-height: 20px;\n  font-weight: 400;\n}\n';
 assert.equal(read(css).toString(),git('show',base+':'+css).toString().replace('.klink-opening-loader {','.klink-opening-loader {\n  position: relative;').trimEnd()+added,'Keep image size and centre; only add the quiet label');
 const floor='docs/appearance-floor-20261031/floor.json',oldFloor=JSON.parse(git('show',base+':'+floor));
 assert.deepEqual(json(floor),{...oldFloor,approvedUpdates:[...oldFloor.approvedUpdates,r.approval]});
 const approval=json(r.approval);assert(approval.appearanceChangeApproved&&approval.publicationApproved);assert.equal(approval.userRequest,r.userRequest);
 assert.deepEqual(approval.files,{[component]:r.files[component],[css]:r.files[css]});
 const browser=json(folder+'local/checks.json');assert.equal(browser.checks.length,16);assert.deepEqual(browser.errors,[]);
 for(const check of browser.checks){assert.equal(check.compactWidth,158);for(const key of ['visibleLabel','exactText','imageCentreUnchanged','labelBelow','noOverflow','accessible','originalAsset','minimumTwoSeconds','removedWhenReady','storagePreserved','routePreserved'])assert.equal(check[key],true,key);}
 const v=json(folder+'verification.json');for(const key of ['types','lint','desktopMobile','lightDark','reducedMotion','twoSecondMinimum','originalAnimationUnchanged','allOtherRuntimeUnchanged','localOnly'])assert.equal(v[key],true,key);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return {...r,instructionCandidate:candidate};
}
export function readBeforeOpeningLoaderLabel(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):readBeforeInstructionCandidate(file,r.instructionCandidate,read);}
