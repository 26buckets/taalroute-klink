import {verifyImportedAlfaCRelease,readBeforeImportedAlfaC} from './check-imported-alfa-c-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
const sha=b=>createHash('sha256').update(b).digest('hex');
export function verifySynonymReviewRelease(read=readFileSync){
 const successor=verifyImportedAlfaCRelease(read),currentRead=read;read=file=>readBeforeImportedAlfaC(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-synonym-review-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Controleer nu ook alle woordparen en antwoordopties in Synoniemen op betekenis en A1-, A2- en B1-niveau. Controleer de 68 nieuwe opnamen op uitspraak en afgekapt geluid en herstel eventuele fouten. zet het woord ook midden in de kaart. Ook graag iets dikgedrukter');
 assert.equal(r.priorPublicationRequest,'Ja, maak ook de ontbrekende audio en zet Synoniemen daarna online in Klink.');
 assert.equal(r.baselineSourceCommit,'f86dd0ffb872dbfb3b54c585860d6e9c6bb63054');assert.equal(r.liveSourceCommit,'f86dd0ffb872dbfb3b54c585860d6e9c6bb63054');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 const allowed=['app/learner-ui.css','data/klink-synonyms.json','lib/practice-chapters.ts','lib/synonyms.ts','scripts/check-drive-images-release-20261031.mjs','scripts/check-synonym-review-release-20261031.mjs','scripts/test-synonyms.mjs','scripts/test-synonyms-browser.mjs','scripts/test-synonym-review-browser.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,allowed);assert.deepEqual([...r.changedFiles].sort((a,b)=>a.localeCompare(b)),allowed);
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 for(const [f,h]of Object.entries(r.evidence))assert.equal(sha(read(f)),h,f);
 assert.deepEqual(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','public')),[],'All public media preserved');
 const bank=JSON.parse(read('data/klink-synonyms.json'));const before=JSON.parse(git('show',`${r.baselineSourceCommit}:data/klink-synonyms.json`));
 assert.equal(bank.entries.length,210);assert.equal(bank.entries.filter(x=>x.active).length,185);assert.deepEqual(bank.entries.map(x=>[x.id,x.word,x.synonym]),before.entries.map(x=>[x.id,x.word,x.synonym]));
 for(const [level,n]of [['a1',16],['a2',59],['b1',185]])assert.equal(bank.entries.filter(x=>x.active&&x.levels.includes(level)).length,n);
 const review=JSON.parse(read('docs/synonyms-review-20261031/word-review.json'));assert.equal(review.rows.length,210);assert.equal(review.withdrawnCount,25);assert.equal(review.levelChanges,35);
 for(const row of review.rows){assert(row.reason&&row.sharedSense&&row.allFourOptionsReviewed&&row.bothDirectionsReviewed);const e=bank.entries.find(x=>x.id===row.id);assert.deepEqual(row.options,e.options);assert.equal(row.active,e.active);assert.equal(row.minimumLevel,e.minimumLevel);assert.equal(e.review.individualCefrValidated,false);assert.equal(e.review.independentHumanReview,false);}
 const audio=JSON.parse(read('docs/synonyms-review-20261031/audio-review.json'));assert.equal(audio.rows.length,68);assert.equal(audio.directListeningStatus,'niet voltooid');assert.equal(audio.humanListeningReview,'open');assert.equal(audio.newRecordings,0);
 for(const c of audio.rows){assert(c.technicalPass&&c.blindScribe.match);assert.equal(c.pronunciationApprovedByListening,false);assert.equal(sha(read('public'+c.src)),c.sha256);}
 const v=JSON.parse(read('docs/synonyms-review-20261031/verification.json'));for(const k of ['types','lint','build','unit','allActiveQuestions','threeModes','nativePlayback','centeredCards','audioMetadata','preservation','localOnly'])assert.equal(v[k],true,k);
 const backup=JSON.parse(read('docs/synonyms-review-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeSynonymReview(file,release,read=readFileSync){return release.changedFiles.includes(file)?git('show',`${release.baselineSourceCommit}:${file}`):readBeforeImportedAlfaC(file,release.successor,read);}
