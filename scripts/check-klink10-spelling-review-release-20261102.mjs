import {verifyKlink10SpeakingRelease,readBeforeKlink10Speaking} from './check-klink10-speaking-release-20261102.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifySpellingReviewRelease(read=readFileSync){
 const next=verifyKlink10SpeakingRelease(read),currentRead=read;read=file=>readBeforeKlink10Speaking(file,next,currentRead);
 const json=p=>JSON.parse(read(p)),dir='docs/klink10-spelling-review-aa-20261102/';
 const r=json('docs/klink-owner-release-spelling-review-20261102.json');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');
 assert(r.publicationApproved&&r.existingAppearancePreserved&&r.progressPreserved);
 assert.equal(r.baselineSourceCommit,'ca8cd417a02bfe759a2b065d92db954e7add6dd9');
 assert.equal(r.liveSourceCommit,'d52a891e9129b6664ec5ed72759a5f402f736ca7');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort(lines(git('diff','--name-only',r.baselineSourceCommit,next.baselineSourceCommit,'--',...roots)));
 const allowed=['components/product/word-listening.tsx','lib/learning-review.ts','lib/practice-chapters.ts','lib/production-practice.ts','lib/source-spelling-review.ts','data/klink10-spelling-review-aa-20261102.json','scripts/test-practice-chapters.mjs','scripts/test-klink10-spelling-review-aa.mjs','scripts/test-klink10-spelling-review-aa-browser.mjs','scripts/check-klink10-text-a2-evidence-release-20261102.mjs','scripts/check-klink10-spelling-review-release-20261102.mjs','scripts/test-klink10-spelling-review-release-20261102.mjs'];
 assert(changed.every(p=>allowed.includes(p)));assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,next.baselineSourceCommit,'--','public').length,0);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 const content=json(dir+'content-review.json');assert.equal(content.rows.length,10);assert.equal(content.newQuestions,0);assert.equal(content.independentHumanNT2Review,false);
 assert(content.rows.every(x=>x.uniqueCorrectAnswer&&x.feedbackMatchesMaskedLetter&&x.stagesReviewed&&x.canonicalQuestionIds.length===4));
 const bank=json('data/klink10-spelling-review-aa-20261102.json');assert.equal(bank.exercises.length,10);
 for(const e of bank.exercises){assert(e.reviewEligible&&!e.independentReading&&e.access==='teacher-supported');assert(e.exerciseId.endsWith(':recall'));}
 const b=json(dir+'browser.json');assert.equal(b.checks.length,26);assert.deepEqual(b.errors,[]);
 const w=json(dir+'word-audio/checks.json');assert.equal(w.checks.length,44);assert.deepEqual(w.errors,[]);
 const media=json(dir+'media-review.json');assert.equal(media.checks.length,13);assert.equal(media.newAudio,0);for(const m of media.checks){assert(m.fullDecode);assert.equal(sha(read('public'+m.src)),m.sha256);}
 const v=json(dir+'validation.json');for(const k of ['unitTenRecalls','typescript','lint','diffWhitespace','sourceReview'])assert(v[k]);
 const backup=json(dir+'backup.json');assert(backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return {...r,next};
}
export function readBeforeSpellingReview(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeKlink10Speaking(file,r.next,read);}
