import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyCompleteContent} from './check-klink-complete-content-20261101.mjs';
const base='9b4e0937dcad82e14e25ebc97e8a4b08b244042f',folder='docs/klink-complete-release-20261101/';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export const completeCoreFiles=[
 'components/product/extended-practice-surface.tsx','data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json',
 'scripts/check-sentence-listen-repair-release-20261101.mjs','scripts/check-klink-complete-content-20261101.mjs','scripts/check-klink-complete-release-20261101.mjs',
 'scripts/test-klink-complete-content-20261101.mjs','scripts/test-klink-complete-browser-20261101.mjs','scripts/test-klink-complete-progress-browser-20261101.mjs',
 'scripts/test-klink-complete-recorder-browser-20261101.mjs','scripts/test-klink-complete-release-20261101.mjs',
];
export function verifyCompleteRelease(read=readFileSync){
 const json=file=>JSON.parse(read(file));
 const r=json('docs/klink-owner-release-complete-20261101.json'),request=json(folder+'owner-instruction.json');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChanged,false);
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,'dd3e3528b57ed9edcee4f99361dddbe3ab43da71');
 assert.equal(r.userRequest,request.userRequest);assert(r.userRequest.includes('Publiceer alles en zet alles online.'));
 assert.equal(request.newAudioAuthorized,true);assert.equal(request.independentHumanReviewClaimed,false);assert.equal(request.learnerPilotClaimed,false);
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const manifest=json(folder+'import-manifest.json'),plans=['voice-plan.json','voice-plan-b1.json'].map(f=>json(folder+f));
 const clips=plans.flatMap(p=>p.clips);assert.equal(clips.length,807);
 const expected=sort([...completeCoreFiles,...manifest.runtimeFiles,...clips.map(c=>'public'+c.src)]);
 assert.equal(new Set(expected).size,expected.length);
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,expected);assert.deepEqual(r.changedFiles,expected);assert.deepEqual(sort(Object.keys(r.files)),expected);
 for(const file of expected)assert.equal(sha(read(file)),r.files[file],file);
 for(const[file,hash]of Object.entries(r.evidenceFiles))assert.equal(sha(read(file)),hash,file);
 const ui='components/product/extended-practice-surface.tsx';
 const unchanged=read(ui).toString().replace("      const optionFeedback = (exercise.optionFeedback as Record<string, unknown> | undefined)?.[option.id];\n",'')
  .replace("const feedback = typeof optionFeedback === 'string' ? optionFeedback : synonyms || exercise.readingRoundId",'const feedback = synonyms || exercise.readingRoundId');
 assert.equal(unchanged,git('show',base+':'+ui).toString(),'Only the requested choice-specific feedback handling changes');
 assert.equal(sha(read('docs/appearance-floor-20261031/floor.json')),sha(git('show',base+':docs/appearance-floor-20261031/floor.json')));
 const oldAliases=JSON.parse(git('show',base+':data/klink-progress-image-aliases-20261030.json')),aliases=json('data/klink-progress-image-aliases-20261030.json');
 for(const[k,v]of Object.entries(oldAliases))assert.equal(aliases[k],v,'Old progress alias '+k);
 for(const row of json(folder+'baseline.json').originalRows){const current=manifest.rows.find(r=>r.id===row.id);assert(current);assert.equal(aliases[current.url],oldAliases[row.url]??row.url);}
 const previousPublic=new Set(lines(git('ls-tree','-r','--name-only',base,'--','public')));
 for(const file of expected.filter(f=>f.startsWith('public/')))assert(!previousPublic.has(file),'Existing content and media files remain byte-identical');
 assert.equal(verifyCompleteContent(read).exercises,1740);
 const audit=json(folder+'audio-file-audit.json');assert.equal(audit.checked,1066);assert.deepEqual(audit.issues,[]);
 for(const clip of audit.records){assert.equal(sha(read('public'+clip.src)),clip.sha256,clip.id);assert(clip.fullDecodeVerified);for(const field of ['artist','album_artist','publisher'])assert.equal(clip.metadata[field],'Taalroute');}
 const replacements=new Map(json(folder+'audio-repairs.json').map(x=>[x.sourceId,x]));
 const activeVoices=[];
 for(const clip of clips){
  assert.notEqual(clip.voiceId,plans[0].instructionVoiceId);
  const replacement=replacements.get(clip.id),record=json(folder+'recordings/'+(replacement?.replacementRecordId??clip.id)+'.json');
  assert.equal(record.voiceId,replacement?.voiceIdAfter??clip.voiceId);assert.equal(record.src,clip.src);assert.equal(record.sha256,sha(read('public'+clip.src)));
  if(record.voiceId!==clip.voiceId){assert.equal(clip.role,'learner-model-utterance');assert.equal(replacement.scope,'new-unpublished-learner-model-without-character');assert.equal(record.sourceText,clip.text);}
  activeVoices.push(record.gender);
  assert(record.audioPacketsUnchanged&&record.metadataVerified&&record.fullDecodeVerified);assert.equal(record.humanListeningReview,false);
  assert.equal(record.originalSha256,sha(read(folder+'originals/'+record.id+'.mp3')));
 }
 assert.equal(clips.filter(c=>c.gender==='female').length,404);assert.equal(clips.filter(c=>c.gender==='male').length,403);
 assert.equal(activeVoices.filter(g=>g==='female').length,405);assert.equal(activeVoices.filter(g=>g==='male').length,402);
 const transcripts=json(folder+'transcript-resolution.json');assert.equal(transcripts.checked,1066);assert.equal(transcripts.unresolved,0);assert.equal(transcripts.humanListeningReview,false);
 const browser=json(folder+'browser/checks.json');assert.deepEqual(browser.errors,[]);assert.equal(browser.checks.length,948);
 assert.equal(browser.checks.filter(c=>c.full).length,316);assert.equal(browser.checks.reduce((n,c)=>n+c.questions,0),2912);
 const progress=json(folder+'progress-checks.json');assert.deepEqual(progress.errors,[]);assert.equal(progress.checks.length,24);
 const recorder=json(folder+'recorder-checks.json');assert.deepEqual(recorder.errors,[]);assert(recorder.checks.length>=10);
 const review=json(folder+'verification.json');for(const flag of ['sourceCounts','sourceEquality','originalSixTexts','originalTwentyFourQuestions','allChoiceFeedback','allGoals','localBrowserChecks','recordingControls','progress','types','lint','build','appearancePreserved','oldAudioPreserved','localOnly'])assert.equal(review[flag],true,flag);
 assert.equal(review.humanListeningReview,false);assert.equal(review.learnerPilot,false);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId&&backup.sha256);
 assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return r;
}
export function readBeforeCompleteRelease(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):read(file);}
