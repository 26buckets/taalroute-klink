import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const folder='docs/writing-dictation-20261101/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));

export function verifyWritingDictationRelease(read=readFileSync){
 const json=file=>JSON.parse(read(file)),r=json('docs/klink-owner-release-writing-dictation-20261101.json');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved&&r.appearanceUnchanged);assert.equal(r.handwritingAdded,false);
 assert(r.userRequest.includes('overige Klink-invulbatches zelfstandig af'));assert(r.userRequest.includes('zonder opnieuw om akkoord te vragen'));
 const standing=json('docs/klink-invullen-20261101/automatic-owner-approval.json');assert.equal(standing.owner,'Nico');assert(standing.automaticOwnerApproval&&standing.automaticPublicationApproval);assert.equal(standing.mayInventHumanReviewEvidence,false);assert.equal(standing.mayBypassPublicationGate,false);
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const[file,hash]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(file)),hash,file);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,'--','app','hooks','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','package.json','package-lock.json','vite.config.ts','next.config.ts','wrangler.jsonc').length,0,'Preserve appearance, routes, dependencies, database and deployment configuration');
 assert.deepEqual(lines(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public')),[],'All previously published media remain byte-identical');
 assert.deepEqual(changed.filter(f=>f.startsWith('components/')),['components/product/learner-app.tsx','components/product/package-exercise-browser.tsx','components/product/package-group-practice.tsx','components/product/practice-chapters.tsx']);
 assert.deepEqual(changed.filter(f=>f.startsWith('lib/')),['lib/practice-chapters.ts','lib/word-rounds.ts','lib/writing-answer.ts','lib/writing-dictation.ts']);
 assert.deepEqual(changed.filter(f=>f.startsWith('data/')),['data/klink-production-instructions.json','data/klink-word-library-index.json','data/klink-writing-dictation-20261101.json']);
 const batch=json('data/klink-writing-dictation-20261101.json'),positions=batch.rounds.flatMap(x=>x.positions);
 assert.equal(batch.rounds.length,15);assert(batch.rounds.every(x=>[6,7].includes(x.positions.length)));assert.equal(new Set(positions.map(p=>p.id)).size,100);assert.equal(new Set(positions.map(p=>p.sourceId)).size,100);assert.equal(positions.filter(p=>p.id!==p.sourceId).length,54);assert.equal(positions.filter(p=>p.id===p.sourceId).length,46);
 assert.deepEqual(changed.filter(f=>f.startsWith('public/')),sort([...new Set(positions.flatMap(p=>p.instructionAudio?['public'+p.instructionAudio]:[]))]));
 const oldInstructions=JSON.parse(git('show',r.baselineSourceCommit+':data/klink-production-instructions.json')),instructions=json('data/klink-production-instructions.json');assert.deepEqual(instructions.slice(0,oldInstructions.length),oldInstructions);assert.equal(instructions.length,oldInstructions.length+6);
 const revisions=json(folder+'sources/current-revisions.json');assert.equal(revisions.documents.length,5);assert(revisions.documents.every(d=>d.unchanged&&d.actual===d.expected));
 const source=json(folder+'sources/source-references.json');assert.equal(source.length,100);assert.equal(new Set(source.map(p=>p.id)).size,100);
 const browser=json(folder+'local/browser.json');assert.equal(browser.checks.length,200);assert.equal(browser.rounds.length,30);assert.deepEqual(browser.errors,[]);assert(browser.rounds.every(c=>c.oldProgressAndDraftsUnchanged&&c.resumeAtSix&&c.completionRetainedOnRestart));
 const sheet=json(folder+'local/sheet.json');assert.equal(sheet.checks.length,200);assert.deepEqual(sheet.errors,[]);assert(sheet.checks.every(c=>c.audioRequiredBeforeTyping&&c.helpAndReplayTracked&&c.correctExplanation&&c.noAnswerOrImageBeforeHelp));
 const layout=json(folder+'local/layout.json');assert.equal(layout.checks.length,108);assert.deepEqual(layout.errors,[]);assert(layout.checks.every(c=>c.noHorizontalOverflow&&c.buttonsAtLeast44));
 assert(browser.checks.every(c=>c.noHintAfterWrong&&c.sourceHintBehindHelp));assert(sheet.checks.every(c=>c.noHintAfterWrong&&c.sourceHintBehindHelp));
 const wordAudio=json(folder+'local/word-audio-coverage.json');assert.equal(wordAudio.sourcePositions,100);assert.deepEqual(wordAudio.missing,[]);assert(wordAudio.spellingUnitsExcluded);
 const globalWords=json(folder+'local/global-word-coverage/source-coverage.json');assert.equal(globalWords.writingSourcePositions,100);assert.deepEqual(globalWords.missing,[]);
 const library=json(folder+'local/library-index.json');assert.equal(library.newWritingCollections,15);assert(library.allExistingChaptersActivitiesMembershipsPreserved);assert.equal(library.newWordModels,0);
 const help=json(folder+'local/help-audio.json');assert.equal(help.simulatedPlayback,false);assert.equal(help.checks.length,2);assert.deepEqual(help.errors,[]);assert(help.checks.every(c=>c.nativeHelpWordEnded&&c.spellingFragmentExcluded&&c.ownAnswerUnchangedByHelp&&c.firstWrongRetained&&c.helpTracked));
 const storage=json(folder+'local/answer-storage.json');assert.equal(storage.checks.length,12);assert.deepEqual(storage.errors,[]);assert(storage.checks.filter(c=>c.draftReloaded&&c.firstIncorrectKept&&c.latestCorrectKept&&c.modelNeverPrefilled).length===8);assert(storage.checks.filter(c=>c.storageDenied&&c.inMemoryResponseRetained&&c.storageRecoveryKeepsFirstResponse).length===2);assert(storage.checks.filter(c=>c.legacyAttemptOutsideNewWriting&&c.priorHistoryByteIdentical&&c.availableCopyFirstAndLastPreservedBeforeRollingAppend).length===2);
 const failures=json(folder+'local/audio-errors.json');assert.equal(failures.checks.length,4);assert.deepEqual(failures.errors,[]);assert(failures.checks.every(c=>c.realAudio&&c.answerBlockedAfter503&&c.retryRecovered));
 const audit=json(folder+'audio-audit.json');assert(audit.passed);assert.equal(audit.targets.length,100);assert(audit.targets.every(t=>t.passed));assert.equal(audit.files.length,107);
 for(const file of audit.files)assert(file.metadataPassed&&sha(read('public'+file.src))===file.sha256,file.src);
 const media=json(folder+'local/media-checks.json');assert.equal(media.simulatedPlayback,false);assert.equal(media.hashes.length,107);assert.equal(media.decoded.length,2);assert(media.decoded.every(c=>c.files.length===107));assert.equal(media.played.length,36);assert(media.played.every(c=>c.nativeElement&&c.ended&&c.playedThroughExistingControl));assert.deepEqual(media.errors,[]);
 const verified=json(folder+'verification.json');for(const key of['types','lint','coreTests','realSourceRevisions','answerContracts','appearancePreserved','publishedCopyDraftsPreserved','sourceProgressPreserved','reactReview','localOnly'])assert.equal(verified[key],true,key);assert.equal(verified.humanListeningPerformed,false);assert.equal(verified.humanNt2ReviewPerformed,false);
 const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return r;
}
export function readBeforeWritingDictation(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
