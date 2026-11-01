import {verifyGrammarPublication,readBeforeGrammarPublication} from './check-grammar-publication-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='6d335687ef7c0fb01b55332935ddcbdde160d6f3',live='1069f8ac11730d313b4afdf7ccf4b886229c7882',folder='docs/mobile-choice-visibility-20261101/';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifyMobileChoiceVisibilityRelease(read=readFileSync){
 const grammar=verifyGrammarPublication(read),currentRead=read;read=file=>readBeforeGrammarPublication(file,grammar,currentRead);
 const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-mobile-choice-visibility-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceChangeApproved);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);
 assert(r.userRequest.includes('Herstel ook die overlap')&&r.userRequest.includes('alle antwoorden en Verder')&&r.userRequest.includes('zet het online'));
 git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort(lines(git('diff','--name-only',base,grammar.baselineSourceCommit,'--',...roots)));
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const[f,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(f)),h,f);
 assert.deepEqual(changed.filter(f=>/^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f)),['app/learner-layout.css']);
 const css='app/learner-layout.css',before=git('show',base+':'+css).toString(),after=read(css).toString();assert(after.startsWith(before),'All existing layout rules retained');assert.equal(sha(Buffer.from(after.slice(before.length))),r.appendedCssSha256);
 assert(after.slice(before.length).startsWith('\n/* Mobile choices share'));assert(after.slice(before.length).includes('@media (max-width: 820px)'));
 const floor='docs/appearance-floor-20261031/floor.json',oldFloor=JSON.parse(git('show',base+':'+floor));assert.deepEqual(json(floor),{...oldFloor,approvedUpdates:[...oldFloor.approvedUpdates,r.approval]});
 const approval=json(r.approval);assert(approval.appearanceChangeApproved&&approval.publicationApproved);assert.equal(approval.userRequest,r.userRequest);assert.deepEqual(approval.files,{[css]:r.files[css]});
 const geometry=json(folder+'local/checks.json');assert.equal(geometry.checks.length,192);assert.deepEqual(geometry.errors,[]);assert(geometry.checks.every(c=>c.allChoicesVisible&&c.listenVisible&&c.nextVisible&&c.toolbarSeparate&&c.stageFits&&c.progressPreserved&&c.correctFeedbackFits));
 const audio=json(folder+'local/audio.json');assert.equal(audio.checks.length,4);assert.deepEqual(audio.errors,[]);assert(audio.checks.every(c=>c.nativeAudio&&c.mouseAfterEnterReplay&&c.mouseAfterArrowsReplay&&c.answerRetained&&c.storagePreserved));
 const desktop=json(folder+'local/desktop.json');assert.equal(desktop.checks.length,8);assert(desktop.checks.every(c=>c.identical));
 const b1=json(folder+'local/b1-retained.json');assert.equal(b1.checks.length,80);assert.deepEqual(b1.errors,[]);assert(b1.checks.every(c=>c.allChoicesVisible&&c.nextVisible&&c.listenVisible&&c.stageFits&&c.sourceAndProgressPreserved&&c.afterCorrectFits));
 const retention=json(folder+'local/public-retention.json');assert.equal(retention.files.length,134);assert(retention.files.every(f=>f.byteEqual));
 const v=json(folder+'verification.json');for(const key of ['types','lint','touchAnswers','keyboard','nativeAudio','desktopUnchanged','contentAudioProgressUnchanged','localOnly'])assert.equal(v[key],true,key);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return {...r,grammar};
}
export function readBeforeMobileChoiceVisibility(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):readBeforeGrammarPublication(file,r.grammar,read);}
