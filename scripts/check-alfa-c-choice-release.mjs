import assert from 'node:assert/strict';
import {verifyDailyRelease, readBeforeDaily} from './check-alfa-c-dagelijks-release.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:64*1024*1024});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const evidence='docs/klink-alfa-c-keuze-opdracht-20261028';
export const choiceFiles=[
 'components/product/alfa-c-functioneel.tsx','components/product/alfa-c-practice.css',
 'scripts/test-alfa-c-functioneel-browser.mjs','scripts/check-alfa-c-functioneel-release.mjs',
 'scripts/test-publication-proof.mjs','scripts/check-alfa-c-choice-release.mjs','scripts/test-alfa-c-choice-release.mjs',
];
export function verifyChoiceRelease(read=readFileSync,release=JSON.parse(readFileSync('docs/klink-owner-release-alfa-c-keuze-opdracht-20261028.json'))){
 const dailyRelease=verifyDailyRelease(read), currentRead=read;
 read=file=>readBeforeDaily(file,dailyRelease,currentRead);
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
 assert.equal(release.userRequest,'Het is mij absoluut niet duidelijk dat ik hier moet kiezen tussen drie antwoorden. Dus deze stijl, dat moet veranderen.');
 assert.equal(release.followupRequest,'Het mist eigenlijk een opdracht. Wat moet... wat moet je doen? Ik moet kiezen, maar wat precies? En waarom? Dus dat is echt niet duidelijk.');
 assert.equal(release.baselineSourceCommit,'666a6e4798140e9dd49777aa636d28440953747a');
 assert.equal(release.liveSourceCommit,'a66670f8016306e6952ed456be5876374584a80d');
 git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);
 git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 assert.equal(release.choiceTasks,28);assert.equal(release.newAudio,0);assert.equal(release.newImages,0);assert.equal(release.humanLearnerTrial,false);
 const roots=['app','components','hooks','data','lib','public','scripts'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,dailyRelease.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=[]; // The daily successor checks the current working tree.
 assert.deepEqual([...new Set([...changed,...untracked])].sort((a,b)=>a<b?-1:a>b?1:0),[...choiceFiles].sort((a,b)=>a<b?-1:a>b?1:0));
 assert.equal(git('diff',release.baselineSourceCommit,dailyRelease.baselineSourceCommit,'--','public','data','lib').length,0,'Preserve all content, audio, images and storage');
 const expected=[...choiceFiles,...['owner-request','live-baseline','review','browser-review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
 assert.deepEqual(Object.keys(release.files).sort((a,b)=>a<b?-1:a>b?1:0),expected.sort((a,b)=>a<b?-1:a>b?1:0));
 for(const [path,hash] of Object.entries(release.files))assert.equal(sha(read(path)),hash,path);
 const owner=JSON.parse(read(`${evidence}/owner-request.json`));assert.equal(owner.userRequest,release.userRequest);assert.equal(owner.followupRequest,release.followupRequest);
 const live=JSON.parse(read(`${evidence}/live-baseline.json`));assert.equal(live.sourceCommit,release.liveSourceCommit);assert.equal(live.sourceClean,true);
 const review=JSON.parse(read(`${evidence}/review.json`));assert.equal(review.status,'passed-local');
 for(const key of ['concreteTaskAtAnswers','all28ChoiceTasks','keyboardWrongRetry','all72StepsBothBrowsers','all72Narrow','progressPreserved','previous36Passed','integrationPassed','typesPassed','lintPassed','buildPassed','curriculumPassed'])assert.equal(review[key],true,key);
 assert.equal(review.humanLearnerTrial,false);
 const browser=JSON.parse(read(`${evidence}/browser-review.json`));assert.equal(browser.steps.length,144);assert.equal(browser.narrowScreens,144);assert.equal(browser.choiceChecks.length,112);assert.deepEqual(browser.errors,[]);
 const steps=JSON.parse(read('data/klink-alfa-c-functioneel.json')).blocks.flatMap(b=>b.steps).filter(s=>s.kind==='choice');assert.equal(steps.length,28);
 for(const step of steps)for(const engine of ['chromium','webkit'])for(const viewport of ['desktop','mobile'])assert(browser.choiceChecks.some(c=>c.task===step.id&&c.engine===engine&&c.viewport===viewport&&c.concreteInstruction&&c.threeVisibleControls));
 const manifest=JSON.parse(read(`${evidence}/source-manifest.json`));
 assert.deepEqual(manifest.map(r=>r.path).sort((a,b)=>a<b?-1:a>b?1:0),expected.filter(p=>!p.endsWith('/source-manifest.json')&&!p.endsWith('/source-drive-verification.json')).sort((a,b)=>a<b?-1:a>b?1:0));
 for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const backup=JSON.parse(read(`${evidence}/source-drive-verification.json`));assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
 return {...release,dailyRelease};
}
export function readBeforeChoice(file,release,read=readFileSync){return release.files[file]?git('show',release.baselineSourceCommit+':'+file):readBeforeDaily(file,release.dailyRelease,read);}
