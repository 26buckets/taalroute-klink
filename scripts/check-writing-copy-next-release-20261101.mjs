import {verifyGoalAuditRelease,readBeforeGoalAudit} from './check-goal-audit-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='86ef96a12e8b90a19dccaa56e1711240a39dc4c5',live='501b0b199de79e28fc20429718af8d5f5d14d167';
const folder='docs/writing-copy-next-20261101/';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyWritingCopyNextRelease(read=readFileSync){
  const successor=verifyGoalAuditRelease(read),currentRead=read;read=file=>readBeforeGoalAudit(file,successor,currentRead);
  const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-writing-copy-next-20261101.json');
  assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);assert.equal(r.approvedBy,'Nico');
  assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved&&r.appearanceUnchanged);
  assert(r.userRequest.includes('overige Klink-invulbatches zelfstandig af'));
  const policy='docs/klink-invullen-20261101/automatic-owner-approval.json';assert.equal(sha(read(policy)),sha(git('show',base+':'+policy)));
  git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
  assert.equal(git('diff','--name-only',live,base,'--',...roots).length,0,'The baseline retains the current approved live runtime');
  const changed=sort(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)));
  assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
  for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);
  for(const[f,h]of Object.entries(r.evidenceFiles))assert.equal(sha(read(f)),h,f);
  assert.equal(git('diff','--name-only',base,successor.baselineSourceCommit,'--','app','hooks','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','package.json','package-lock.json','vite.config.ts').length,0,'Preserve appearance, storage, dependencies and workflows');
  assert.deepEqual(changed.filter(f=>f.startsWith('components/')),['components/product/package-exercise-browser.tsx']);
  assert.deepEqual(changed.filter(f=>f.startsWith('data/')),['data/klink-production-index.json']);
  assert.deepEqual(changed.filter(f=>f.startsWith('lib/')),['lib/copy-answer.ts','lib/production-practice.ts']);
  const component='components/product/package-exercise-browser.tsx';
  const before=git('show',base+':'+component).toString();
  const expected=before.replace("import { exactCopyAnswer } from '@/lib/copy-answer';", "import { exactCopyAnswer, copyDifferenceFeedback } from '@/lib/copy-answer';")
    .replace("onFinish(value, accepted.some(answer => exercise.answerPolicy === 'exact-copy' ? exactCopyAnswer(answer, value) : normalize(answer) === normalize(value)))", "onFinish(value, accepted.some(answer => exercise.answerPolicy === 'exact-copy' ? exactCopyAnswer(answer, value) : normalize(answer) === normalize(value)), exercise.answerPolicy === 'exact-copy' && accepted[0] !== undefined ? copyDifferenceFeedback(accepted[0], value, exercise.feedback) : undefined)");
  assert.equal(read(component).toString(),expected,'Only source-required difference feedback; preserve markup, goals and existing handlers');
  assert(read('lib/copy-answer.ts').toString().startsWith(git('show',base+':lib/copy-answer.ts').toString()),'Preserve the published exact-answer rule');
  const validator='lib/production-practice.ts',guard="    if (exercise.answerPolicy === 'exact-copy') {\n      const fields = exercise.fields;\n      if (exercise.componentId !== 'ALF-CMP-006' || exercise.mode !== 'copy-word' || typeof exercise.exampleWord !== 'string' || !exercise.exampleWord.trim() || !Array.isArray(fields) || fields.length !== 1 || !fields[0] || !Array.isArray(fields[0].acceptedAnswers) || fields[0].acceptedAnswers.length !== 1 || fields[0].acceptedAnswers[0] !== exercise.exampleWord) throw new Error('Invalid copy model');\n    }\n";
  assert.equal(read(validator).toString(),git('show',base+':'+validator).toString().replace('    ids.add(exercise.exerciseId);',guard+'    ids.add(exercise.exerciseId);'),'Only validate the new exact-copy contract');
  const index=json('data/klink-production-index.json'),old=JSON.parse(git('show',base+':data/klink-production-index.json'));
  assert.deepEqual(index.slice(0,old.length),old);assert.equal(index.length,old.length+4);
  const source=json(folder+'source.json').rows;assert.equal(source.length,80);
  const originalRow=old.find(r=>r.id==='production:copy:alfa-c:KSW-AC-TN-001-020');
  const original=json('public'+originalRow.url).exercises.find(e=>e.exerciseId==='KSW-AC-TN-020');
  assert.equal(sha(read('public'+originalRow.url)),sha(git('show',base+':public'+originalRow.url)));
  const aliases=[],publicFiles=[];
  for(const row of index.slice(old.length)){
    assert.equal(row.activity,'copy');assert.equal(row.level,'alfa-c');assert.equal(row.help,'guided');assert.equal(row.count,20);
    const file='public'+row.url,collection=json(file);publicFiles.push(file);
    assert(/^public\/practice-content\/klink-writing-20261101\/ksw-ac-tn-(?:021-040|041-060|061-080|081-100)-[a-f0-9]{16}\.json$/.test(file));
    assert(row.url.includes(sha(read(file)).slice(0,16)));assert.equal(collection.id,row.id);assert.equal(collection.exercises.length,20);assert.equal(new Set(collection.exercises.map(e=>e.exerciseId)).size,20);
    for(const e of collection.exercises){
      const s=source.find(r=>r.canonicalId===e.exerciseId);assert(s,e.exerciseId);const raw=s.sourceRecord;
      assert.equal(s.model,raw.visibleModel??raw.displayedSource??raw.sourceText??raw.source?.visibleText);assert.equal(e.exampleWord,s.model);assert.deepEqual(e.fields[0].acceptedAnswers,[s.model]);
      assert.equal(e.componentId,'ALF-CMP-006');assert.equal(e.answerPolicy,'exact-copy');assert(!e.requiresAudio&&!e.prompt&&!e.instructionAudio&&!e.independentReading&&!e.reviewEligible);
      if(e.exerciseId===original.exerciseId)assert.deepEqual(e,original);else assert.equal(e.feedback,s.feedback);
    }
    aliases.push(...Object.entries(collection.sourceAliases));
  }
  assert.deepEqual(sort(changed.filter(f=>f.startsWith('public/'))),sort(publicFiles));
  assert(lines(git('diff','--name-status',base,'--','public')).every(l=>l.startsWith('A\t')),'Keep every existing public file unchanged');
  assert.deepEqual(aliases,[['KSW-AC-TN-097','KSW-AC-TN-020']]);
  const review=json(folder+'content-review.json');assert.equal(review.rows.length,80);assert(review.rows.every(r=>r.review==='passed'));assert.equal(review.totalSourcePositions,100);assert.equal(review.canonicalTasks,99);assert.equal(review.independentHumanReview,false);assert.equal(review.classroomPilot,'open');assert.equal(json(folder+'feedback-edits.json').length,20);
  const browser=json(folder+'local/browser-checks.json');assert.equal(browser.checks.length,1200);assert.equal(browser.preserved.length,8);assert.deepEqual(browser.errors,[]);assert(browser.checks.every(c=>c.firstDifferenceExplained&&c.individualHintPreserved&&c.modelAlwaysVisible&&c.nextFits));
  const layout=json(folder+'local/layout-checks.json');assert.equal(layout.checks.length,96);assert.deepEqual(layout.errors,[]);assert(layout.checks.every(c=>c.inputAndButtonsFit&&c.modelReachable&&(c.modelFullyVisible||c.modelScrollTested)));
  const loading=json(folder+'local/loading-checks.json');assert.equal(loading.checks.length,2);assert.deepEqual(loading.errors,[]);assert(loading.checks.every(c=>c.malformedBankRejected&&c.retryWorks&&c.oldProgressPreserved));
  const goals=json(folder+'local/goals-copy/checks.json');assert.equal(goals.checks.length,12);assert.deepEqual(goals.errors,[]);
  const checks=json(folder+'verification.json');for(const k of['types','lint','unit','sourcePreserved','allAnswers','differenceFeedback','browser','progressPreserved','appearancePreserved','learningGoalsPreserved','localOnly'])assert.equal(checks[k],true,k);
  const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
  return {...r,successor};
}
export function readBeforeWritingCopyNext(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):readBeforeGoalAudit(file,r.successor,read);}
