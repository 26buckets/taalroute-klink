import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='4612b27eebe2ef45c6d806ed18df09f7e8f1e934';
const live='4612b27eebe2ef45c6d806ed18df09f7e8f1e934';
const folder='docs/writing-copy-20261101/';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyWritingCopyRelease(read=readFileSync){
  const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-writing-copy-20261101.json');
  assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);
  assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');
  assert(r.publicationApproved&&r.appearanceUnchanged);
  assert.equal(r.userRequest,'Ga door met de eerste schrijfbatch en zet die na alle controles online. Werk daarna de overige Klink-invulbatches zelfstandig af en publiceer ze, zonder opnieuw om akkoord te vragen.');
  const policy='docs/klink-invullen-20261101/automatic-owner-approval.json';
  assert.equal(sha(read(policy)),sha(git('show',base+':'+policy)));
  git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
  const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
  assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
  for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);
  for(const[f,h]of Object.entries(r.evidenceFiles))assert.equal(sha(read(f)),h,f);
  assert.equal(git('diff','--name-only',base,'--','app','hooks','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','package.json','package-lock.json','vite.config.ts').length,0,'Preserve appearance, storage, dependencies and workflows');
  assert.deepEqual(changed.filter(f=>f.startsWith('components/')),['components/product/package-exercise-browser.tsx']);
  assert.deepEqual(changed.filter(f=>f.startsWith('lib/')),['lib/copy-answer.ts','lib/lesson-plan.ts']);
  assert.deepEqual(changed.filter(f=>f.startsWith('data/')),['data/klink-production-index.json']);
  const component='components/product/package-exercise-browser.tsx';
  const before=git('show',base+':'+component).toString();
  const expected=before.replace("import { readingSupportForExercise, wordMeaningContexts } from '@/lib/production-practice';", "$&\nimport { exactCopyAnswer } from '@/lib/copy-answer';")
    .replace("useExerciseViewTarget('text', typeof visibleWord === 'string')", "useExerciseViewTarget('text', typeof visibleWord === 'string' && exercise.answerPolicy !== 'exact-copy')")
    .replace('accepted.some(answer => normalize(answer) === normalize(value))',"accepted.some(answer => exercise.answerPolicy === 'exact-copy' ? exactCopyAnswer(answer, value) : normalize(answer) === normalize(value))");
  assert.equal(read(component).toString(),expected,'Only source-required grading and permanent model visibility');
  const help='lib/lesson-plan.ts';
  assert.equal(read(help).toString(),git('show',base+':'+help).toString().replace("return 'Typ het woord. Tik daarna op Controleer.';", "return exercise.answerPolicy === 'exact-copy' ? 'Typ precies na. Tik daarna op Controleer.' : 'Typ het woord. Tik daarna op Controleer.';"));
  const index=json('data/klink-production-index.json'),old=JSON.parse(git('show',base+':data/klink-production-index.json'));
  assert.deepEqual(index.slice(0,old.length),old);assert.equal(index.length,old.length+1);
  const row=index.at(-1),collection=json('public'+row.url),source=json(folder+'source.json').rows;
  assert.equal(row.id,'production:copy:alfa-c:KSW-AC-TN-001-020');assert.equal(row.count,20);assert.equal(collection.exercises.length,20);
  assert(row.url.includes(sha(read('public'+row.url)).slice(0,16)));
  assert.deepEqual(changed.filter(f=>f.startsWith('public/')),['public'+row.url]);
  assert(lines(git('diff','--name-status',base,'--','public')).every(l=>l.startsWith('A\t')),'All existing public files remain unchanged');
  for(const[i,e]of collection.exercises.entries()){
    assert.equal(e.exerciseId,`KSW-AC-TN-${String(i+1).padStart(3,'0')}`);
    assert.equal(e.exampleWord,source[i].sourceRecord.visibleModel);
    assert.deepEqual(e.fields[0].acceptedAnswers,source[i].sourceRecord.answerModel.acceptedExact);
    assert.equal(e.componentId,'ALF-CMP-006');assert.equal(e.answerPolicy,'exact-copy');
    assert(!e.requiresAudio&&!e.prompt&&!e.instructionAudio&&!e.independentReading&&!e.reviewEligible);
  }
  const review=json(folder+'content-review.json');assert.equal(review.rows.length,20);assert(review.rows.every(r=>r.review==='passed'));assert.equal(review.independentHumanReview,false);assert.equal(review.classroomPilot,'open');
  const browser=json(folder+'local/browser-checks.json');assert.equal(browser.checks.length,240);assert.equal(browser.preserved.length,8);assert.deepEqual(browser.errors,[]);
  assert(browser.checks.every(c=>c.wrongAnswersRejected>=3&&c.outerWhitespaceAccepted&&c.modelAlwaysVisible&&c.keyboardCheck&&c.nextFits));
  assert(browser.preserved.every(c=>c.existingPlayerGeometryAndStyleIdentical&&c.oldAnswerPolicyPreserved));
  const layouts=json(folder+'local/layout-checks.json');assert.equal(layouts.checks.length,16);assert(layouts.checks.every(c=>c.modelInputAndButtonsFit));
  const checks=json(folder+'verification.json');for(const k of['types','lint','unit','sourcePreserved','allAnswers','browser','progressPreserved','appearancePreserved','localOnly'])assert.equal(checks[k],true,k);
  const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
  return r;
}
export function readBeforeWritingCopy(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):read(file);}
