import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifyKlink10TextA2EvidenceRelease(read=readFileSync){
 const json=p=>JSON.parse(read(p)),dir='docs/klink10-text-a2-evidence-20261102/',r=json('docs/klink-owner-release-ten-text-a2-evidence-20261102.json');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved&&r.existingAppearancePreserved&&r.progressPreserved);
 assert.equal(r.baselineSourceCommit,'6b3df6a15f3c0882c976568077fa78d99c2c7ebb');assert.equal(r.liveSourceCommit,'e3ce253798375049f0dbc7478b5133963205f0a6');git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 const allowed=['data/klink-production-index.json','data/klink-production-instructions.json','data/klink-word-listening.json','data/klink-word-listening-audio.json','scripts/test-practice-chapters.mjs','scripts/check-klink10-text-evidence-release-20261102.mjs','scripts/check-klink10-text-a2-evidence-release-20261102.mjs','scripts/test-klink10-text-a2-evidence-20261102.mjs','scripts/test-klink10-text-a2-evidence-browser-20261102.mjs','scripts/test-klink10-text-a2-evidence-media-20261102.mjs','scripts/test-klink10-text-a2-evidence-release-20261102.mjs'];
 assert(changed.every(p=>allowed.includes(p)||p.startsWith('public/practice-content/klink10-text-a2-evidence-20261102/')||p.startsWith('public/package-audio/klink10-text-a2-evidence-20261102/')));assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public').length,0);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 const m=json(dir+'manifest.json'),old=p=>JSON.parse(git('show',r.baselineSourceCommit+':'+p));assert.equal(m.sourcePositions,10);assert.equal(m.newQuestions,10);assert.equal(m.newAudio,20);assert.equal(m.positions.length,10);
 assert.deepEqual(json('data/klink-production-index.json').filter(x=>x.id!==m.row.id),old('data/klink-production-index.json'));assert.equal(sha(read('public'+m.row.url)),m.sha256);
 const bank=json('public'+m.row.url);assert.equal(bank.exercises.length,10);assert.deepEqual(bank.exercises.map(e=>e.exerciseId),m.questionIds);for(const e of bank.exercises){assert.equal(e.mode,'text-evidence');assert.equal(e.standardTask.kind,'mark');assert(e.manualAdvance&&e.requiresExplicitCompletion&&!e.reviewEligible&&!e.independentReading);}
 const prior=old('data/klink-production-instructions.json'),now=json('data/klink-production-instructions.json');assert.deepEqual(now.slice(0,prior.length),prior);assert.equal(now.length,prior.length+10);
 for(const p of ['data/klink-word-listening.json','data/klink-word-listening-audio.json']){const current=json(p),before=old(p);for(const word of m.newWordAudio){assert(!before[word]&&current[word]);delete current[word];}assert.deepEqual(current,before);}
 for(const[src,a]of Object.entries(m.media))assert.equal(sha(read('public'+src)),a.sha256);
 assert.equal(json(dir+'local/content.json').checks.length,10);const b=json(dir+'local/browser.json');assert.equal(b.checks.length,40);assert.deepEqual(b.errors,[]);assert(b.completedProgressAndResumePreserved&&b.existingDraftPreserved);
 const n=json(dir+'local/native-media.json');assert.equal(n.checks.length,40);assert.equal(n.flows.length,4);assert.equal(json(dir+'local/visibility.json').checks.length,2);
 const audio=json(dir+'selected-media-verification.json');assert.equal(audio.checks.length,20);assert(audio.checks.every(x=>x.fullDecode&&x.metadataVerified&&x.pronunciationEvidence));
 const v=json(dir+'verification.json');for(const k of['types','lint','coreTests','wordAudioCoverage','screensVisuallyReviewed','sourceReview','existingPublicBytesPreserved'])assert(v[k]);assert.equal(v.humanListening,false);
 const backup=json(dir+'backup.json');assert(backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforeKlink10TextA2Evidence(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
