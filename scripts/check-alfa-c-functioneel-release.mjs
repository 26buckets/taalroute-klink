import {verifyChoiceRelease,readBeforeChoice} from './check-alfa-c-choice-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:64*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const evidence='docs/klink-alfa-c-functioneel-20261028';
const functionalCodeFiles=[
 'components/product/alfa-c-practice.tsx','components/product/alfa-c-practice.css','components/product/alfa-c-functioneel.tsx',
 'lib/alfa-c-functioneel.ts','data/klink-alfa-c-functioneel.json','data/klink-alfa-c-functioneel-audio.json','data/klink-teacher-manual.json',
 'public/alfa-c/antwoordbladen.html','public/alfa-c/handschrift/lesbriefje.png','public/alfa-c/handschrift/voorbeeldbriefje.png',
 'scripts/check-alfa-c-audio-release.mjs','scripts/check-alfa-c-functioneel-release.mjs',
 'scripts/test-alfa-c-functioneel.mjs','scripts/test-alfa-c-functioneel-browser.mjs','scripts/test-alfa-c-functioneel-audio-browser.mjs','scripts/test-alfa-c-functioneel-release.mjs','scripts/test-alfa-c-integration.mjs','scripts/test-publication-proof.mjs',
];
export function verifyFunctionalRelease(read=readFileSync,release=JSON.parse(readFileSync('docs/klink-owner-release-alfa-c-functioneel-20261028.json'))){
 const choiceRelease=verifyChoiceRelease(read);
 const currentReader=read;read=file=>readBeforeChoice(file,choiceRelease,currentReader);
 const functionalFiles=[...functionalCodeFiles,...JSON.parse(read('data/klink-alfa-c-functioneel-audio.json')).clips.filter(c=>!c.reused).map(c=>'public'+c.src)];
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
 assert.equal(release.userRequest,'Oké, dan mogen ze online gezet worden.');
 assert.equal(release.completionRequest,'Maak alles.');
 assert.equal(release.baselineSourceCommit,'4898980d81299fe8c30e25146d3159624fe3c1c7');
 assert.equal(release.liveSourceCommit,'bc6ac526f2879962d13b848a4fd63c6c5ce1fd1a');
 git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);
 git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 assert.equal(release.tasks,72);assert.equal(release.availableTasks,72);assert.equal(release.closedTasks,0);
 assert.equal(release.newAudio,386);assert.equal(release.newImages,2);assert.equal(release.humanLearnerTrial,false);
 const roots=['app','components','hooks','data','lib','public','scripts'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,choiceRelease.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=[]; // The choice successor validates the current delta.
 assert.deepEqual([...new Set([...changed,...untracked])].sort((a,b)=>a<b?-1:a>b?1:0),[...functionalFiles].sort((a,b)=>a<b?-1:a>b?1:0));
 const expected=[...functionalFiles,'docs/KLINK-DOCENTHANDLEIDING.md',...['owner-request','live-baseline','reviewed-package','audio-plan','audio-metadata','transcripts','image-review','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
 assert.deepEqual(Object.keys(release.files).sort((a,b)=>a<b?-1:a>b?1:0),expected.sort((a,b)=>a<b?-1:a>b?1:0));
 for(const [path,hash] of Object.entries(release.files))assert.equal(sha(read(path)),hash,path);
 const source=JSON.parse(read(`${evidence}/reviewed-package.json`));
 const data=JSON.parse(read('data/klink-alfa-c-functioneel.json'));
 assert.equal(data.sourceSha256,sha(read(`${evidence}/reviewed-package.json`)));
 const steps=data.blocks.flatMap(b=>b.steps);assert.equal(data.blocks.length,6);assert(data.blocks.every(b=>b.steps.length===12));
 assert.equal(steps.length,72);assert.equal(steps.filter(s=>s.closed).length,0);
 for(const block of data.blocks)for(const step of block.steps){
  const old=source.exerciseInstances.find(s=>s.id===step.id);assert(old);
  assert.equal(step.instruction,old.instruction.spokenText);assert.equal(step.helpVisible,old.helpVisible);assert.equal(step.retryVisible,old.retryVisible);assert.equal(step.exampleVisible,old.exampleVisible);
  assert.equal(step.closed,false);
  if(step.kind==='dictation')assert.deepEqual(step.dictationTexts,old.exerciseAudio.texts);
  if(step.presentation.some(v=>v.kind==='requiredHandwrittenSource'))assert(step.handwriting&&step.exampleHandwriting);
 }
 assert.equal(JSON.parse(read(`${evidence}/owner-request.json`)).userRequest,release.userRequest);
 assert.equal(JSON.parse(read(`${evidence}/owner-request.json`)).completionRequest,release.completionRequest);
 const audio=JSON.parse(read('data/klink-alfa-c-functioneel-audio.json'));
 assert.equal(audio.clips.length,393);assert.equal(audio.clips.filter(c=>!c.reused).length,386);
 assert.equal(audio.voiceId,'h6uBOiAjLKklte8hdYio');assert.equal(audio.targetVoiceId,'0qLmDzgqulxcvv0yf3kg');assert.notEqual(audio.voiceId,audio.targetVoiceId);assert.equal(audio.generationSpeed,0.85);
 const metadata=JSON.parse(read(`${evidence}/audio-metadata.json`));assert.equal(metadata.length,393);
 for(const c of audio.clips){
  assert.equal(sha(read('public'+c.src)),c.sha256);const m=metadata.find(m=>m.id===c.id);assert(m);
  for(const k of ['artist','album_artist','publisher'])assert.equal(m.metadata[k],'Taalroute');assert.equal(m.audioReencoded,false);
  if(!c.reused){assert(c.src.startsWith('/package-audio/alfa-c-functioneel-20261028/'));assert.equal(c.voiceId,c.role==='guide'?audio.voiceId:audio.targetVoiceId);assert(m.audioPacketHash&&m.originalSha256);}
 }
 const transcripts=JSON.parse(read(`${evidence}/transcripts.json`));assert.equal(transcripts.completed,393);assert.equal(transcripts.humanListeningReview,'open');
 assert(transcripts.checks.every(c=>c.exactNormalized||(['alfa-c-f-261b1422095af6','alfa-c-f-8e0e9acd8b0077'].includes(c.id)&&c.resolution?.accepted)));
 const images=JSON.parse(read(`${evidence}/image-review.json`));assert.equal(images.images.length,2);for(const image of images.images){assert(image.textVisuallyChecked&&image.spellingAndTimeCorrect&&image.handwrittenLetterforms);assert.equal(sha(read('public'+image.src)),image.sha256);assert.equal(image.smallScreenReview,'passed');}
 const baseline=JSON.parse(read(`${evidence}/live-baseline.json`));assert.equal(baseline.sourceCommit,release.liveSourceCommit);assert.equal(baseline.sourceClean,true);
 const review=JSON.parse(read(`${evidence}/review.json`));assert.equal(review.status,'passed-local');
 for(const k of ['all72Checked','bothBrowsers','all72Narrow','paperAnswerPlaces','all72MediaReady','wrongAndRetry','progressPreserved','previous36Passed','integrationPassed','typesPassed','lintPassed','buildPassed','curriculumPassed','native393','audioMetadata','transcriptsPassed'])assert.equal(review[k],true,k);
 assert.equal(review.humanLearnerTrial,false);assert.equal(review.audioCreated,true);
 const manifest=JSON.parse(read(`${evidence}/source-manifest.json`));
 assert.deepEqual(manifest.map(x=>x.path),expected.filter(p=>!p.endsWith('/source-manifest.json')&&!p.endsWith('/source-drive-verification.json')));
 for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const backup=JSON.parse(read(`${evidence}/source-drive-verification.json`));
 assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
 assert.equal(backup.originalsVerified,389);
 for(const path of ['docs/klink-owner-release-alfa-c-audio-20261027.json','lib/alfa-c-practice.ts','data/klink-alfa-c-audio.json','data/klink-alfa-c-texts.json','data/klink-audio-policy.json','components/product/learner-app.tsx','vite.config.ts'])
  assert.equal(sha(read(path)),sha(git('show',release.baselineSourceCommit+':'+path)),'Preserve '+path);
 const publicFiles=functionalFiles.filter(p=>p.startsWith('public/'));
 assert.deepEqual([...new Set([...changed,...untracked])].filter(p=>p.startsWith('public/')).sort((a,b)=>a<b?-1:a>b?1:0),publicFiles.sort((a,b)=>a<b?-1:a>b?1:0));
 assert.equal(git('ls-tree',release.baselineSourceCommit,'--','public/alfa-c/antwoordbladen.html').length,0);
 return {...release,choiceRelease};
}
export function readBeforeFunctional(file,release,read=readFileSync){return release.files[file]?git('show',release.baselineSourceCommit+':'+file):readBeforeChoice(file,release.choiceRelease,read);}
