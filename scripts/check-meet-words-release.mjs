import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyMeetWordsRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-meet-words-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Ja, begin maar met Kijk en luister. Koppel de bestaande woordlijsten voor Alfa C, A1, A2 en B1, met de bestaande audio en placeholders. Maak rondes van twaalf woorden, controleer de aantallen en zet het live.');
 assert.equal(r.baselineSourceCommit,'407823f6f96fe51aac6534f6d5832a74d4b0874c');assert.equal(r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['docs/KLINK-DOCENTHANDLEIDING.md','app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const allowed=['app/learner-layout.css','components/product/taalroute-header.tsx','data/klink-production-index.json','scripts/build-meet-word-lists-20261030.mjs','scripts/build-practice-overview.mjs','scripts/check-teacher-phonemes-release.mjs','scripts/check-meet-words-release.mjs','scripts/test-meet-word-lists-20261030.mjs','scripts/test-meet-words-browser-20261030.mjs','scripts/test-meet-words-release.mjs','scripts/test-production-content.mjs','scripts/test-production-answers.mjs','scripts/test-word-image-beta.mjs','public/klink-oefenoverzicht-luisteren-20261030.html'];
 assert(changed.every(f=>allowed.includes(f)||/^public\/practice-content\/klink-20261029\/word-meet-(alfa-c|a1|a2|b1)-[a-zA-Z0-9_-]+\.json$/.test(f)));
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public').length,0);
 const old=JSON.parse(git('show',`${r.baselineSourceCommit}:data/klink-production-index.json`)),index=JSON.parse(read('data/klink-production-index.json'));
 assert.deepEqual(index.filter(x=>!x.id.startsWith('word-meet:')),old);
 const rows=index.filter(x=>x.id.startsWith('word-meet:'));assert.equal(rows.length,48);
 const totals={};for(const row of rows){
  assert.equal(row.activity,'meet');assert.equal(row.help,'practice');assert.equal(row.count,12);totals[row.level]=(totals[row.level]||0)+12;
  const source=old.find(x=>x.id===row.id.replace('word-meet:','beta-images:cards:'));assert(source);assert.equal(row.level,source.level);
  const ss=JSON.parse(read('public'+source.url)).exercises,es=JSON.parse(read('public'+row.url)).exercises;assert.equal(es.length,12);assert.equal(new Set(es.map(e=>e.wordId)).size,12);
  for(const [i,e]of es.entries()){assert.equal(e.mode,'model');assert.equal(e.text.primary,ss[i].cards[0].back.text);assert.deepEqual(e.prompt,{image:ss[i].cards[0].front.image,audio:ss[i].cards[0].audio});assert.deepEqual(e.sourceContentIds,ss[i].sourceContentIds);assert.equal(e.contentLevel,row.level);}
 }
 assert.deepEqual(totals,{'alfa-c':192,a1:144,a2:96,b1:144});
 const review=JSON.parse(read('docs/meet-words-20261030/review.json'));for(const key of ['types','changedFilesLint','build','content','answers','browser','navigation','progressPreserved','audioMetadata','localOnly'])assert.equal(review[key],true,key);
 const backup=JSON.parse(read('docs/meet-words-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeMeetWords(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):read(file);}
