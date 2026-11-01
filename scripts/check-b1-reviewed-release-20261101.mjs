import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const folder='docs/b1-reviewed-release-20261101/';
const base='35182be471e139a7615181206ce1288c45886c86';
const live='35182be471e139a7615181206ce1288c45886c86';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];

export function verifyB1ReviewedRelease(read=readFileSync) {
  const json=f=>JSON.parse(read(f)),r=json('docs/klink-owner-release-b1-reviewed-20261101.json');
  assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearanceUnchanged&&r.progressPreserved);
  assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);
  assert(r.userRequest.includes('Zorg dat de nagekeken B1-bronnen online komen'));
  assert.equal(r.humanListeningReview,false);assert.equal(r.independentNt2Review,false);
  git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
  const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
  assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
  const scripts=['scripts/check-space-mixed-input-release-20261101.mjs','scripts/check-b1-reviewed-release-20261101.mjs','scripts/test-b1-reviewed-browser-20261101.mjs','scripts/test-b1-reviewed-progress-browser-20261101.mjs'];
  assert(changed.every(f=>scripts.includes(f)||['data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json'].includes(f)||/^public\/(practice-content|package-audio)\/b1-review-20261101\//.test(f)));
  assert.equal(changed.filter(f=>f.startsWith('public/practice-content/')).length,20);
  assert.equal(changed.filter(f=>f.startsWith('public/package-audio/')).length,114);
  for(const [f,h] of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(f)),h,f);
  const beforeIndex=JSON.parse(git('show',base+':data/klink-production-index.json')),index=json('data/klink-production-index.json');
  const oldAliases=JSON.parse(git('show',base+':data/klink-progress-image-aliases-20261030.json')),aliases=json('data/klink-progress-image-aliases-20261030.json');
  const manifest=json(folder+'b1-release-manifest.json'),sources=json(folder+'b1-final-source-items.json');
  assert.equal(index.length,beforeIndex.length);assert.equal(manifest.rows.length,20);assert.equal(sources.length,120);
  assert.equal(Object.keys(aliases).length,Object.keys(oldAliases).length+20);
  for(const[k,v]of Object.entries(oldAliases))assert.equal(aliases[k],v,k);
  const counts={A:0,B:0,C:0};let questions=0;
  for(let i=0;i<index.length;i++) {
    const row=index[i],old=beforeIndex[i];assert.equal(row.id,old.id);
    if(!row.id.startsWith('klink-flitslezen-b1-')){assert.deepEqual(row,old);continue;}
    assert.deepEqual({...row,url:old.url},old);assert.equal(aliases[row.url],oldAliases[old.url]??old.url);
    const entry=manifest.rows.find(e=>e.after.id===row.id);assert.deepEqual(entry.after,row);assert.deepEqual(entry.before,old);
    const raw=read('public'+row.url),data=JSON.parse(raw),prior=JSON.parse(git('show',base+':public'+old.url));assert.equal(sha(raw),entry.sha256);
    assert.deepEqual(data.exercises.map(e=>e.exerciseId),prior.exercises.map(e=>e.exerciseId));
    for(const [j,e]of data.exercises.entries()) {
      const source=sources.find(s=>s.id===e.sourceContentIds[0]),q=source.questions.find(q=>q.id===e.exerciseId);assert(q);
      const permitted=['contentTitle','sourceText','sourceBlocks','question','options','answer','optionFeedback','correctFeedback','sourceStatus'];
      assert.deepEqual(Object.fromEntries(Object.entries(e).filter(([k])=>!permitted.includes(k))),Object.fromEntries(Object.entries(prior.exercises[j]).filter(([k])=>!permitted.includes(k))));
      assert.equal(e.contentTitle,source.title);assert.equal(e.sourceText,source.text);assert.equal(e.sourceDocumentId,source.documentId);
      assert.deepEqual(e.sourceBlocks.map(b=>[b.id,b.text]),[[source.id,source.text]]);assert.equal(e.question,q.question);assert.deepEqual(e.options,q.options);assert.deepEqual(e.optionFeedback,q.feedback);
      assert.deepEqual(e.answer.correctOptionIds,[q.answer]);assert.equal(e.correctFeedback,q.feedback[q.answer]);assert.equal(new Set(q.options.map(o=>o.label)).size,3);
      for(const option of ['A','B','C'])assert.equal(/^Goed\b/.test(q.feedback[option]),option===q.answer);
      counts[q.answer]++;questions++;
    }
  }
  assert.equal(questions,240);assert.deepEqual(counts,{A:80,B:80,C:80});
  const audio=json(folder+'b1-final-audio-manifest.json');assert.equal(audio.clips.length,114);assert.equal(audio.retainedClips.length,6);assert(audio.automatedReviewPassed&&!audio.humanListeningReview&&!audio.extraCreditsPurchased);
  const plan=json(folder+'b1-voice-plan-final.json');
  for(const clip of audio.clips){assert.equal(sha(read('public'+clip.url)),clip.sha256);assert.equal(clip.sourceTextSha256,sha(sources.find(s=>s.id===clip.id).text));assert.notEqual(clip.voiceId,plan.instructionVoiceId);assert(clip.metadataVerified&&clip.fullDecodeVerified&&clip.audioDataUnchangedDuringBranding);}
  const native=json(folder+'b1-native-readback-verification.json');assert.equal(native.documents.length,20);assert.equal(native.fieldsMatched,1800);assert(native.exactFieldsEqual);
  const browser=json(folder+'local/browser/checks.json');assert.equal(browser.checks.length,80);assert.deepEqual(browser.errors,[]);assert.equal(browser.checks.reduce((n,c)=>n+c.questions,0),960);assert.equal(browser.checks.reduce((n,c)=>n+c.nativeAudioFiles,0),120);
  const progress=json(folder+'progress-checks.json');assert.equal(progress.checks.length,80);assert.deepEqual(progress.errors,[]);assert(progress.checks.every(c=>c.oldCompletionPreserved&&c.restoredPosition&&c.canonicalProgressKey&&c.unrelatedStoragePreserved));
  const verification=json(folder+'verification.json');for(const k of ['types','lint','editorialReviewAll240','nativeSourcesExact','audioFilesDecodedAndBranded','appearanceUnchanged','progressPreserved','keyboardRegression','localOnly'])assert.equal(verification[k],true,k);
  const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.parts.length>=2);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
  return r;
}
export function readBeforeB1Reviewed(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):read(file);}
