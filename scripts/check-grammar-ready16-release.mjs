import {verifyLetterAbReady10Release,readBeforeLetterAbReady10} from './check-letter-ab-ready10-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='3f58c2136346e9dbe369b07610b7a12b570fea48',root='docs/grammar-ready16-20261104/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const expectedIds=['KHW','MDZ'].flatMap(g=>['001','002','003','005','006','007','008','010'].map(n=>`KGR-AA-${g}-${n}`)).sort((a,b)=>a.localeCompare(b));
const runtimeFiles=['app/api/grammar-aa-assets/[name]/route.ts','components/product/extended-practice-surface.tsx','components/product/package-exercise-browser.tsx','data/klink-grammar-aa-assets.json','data/klink-production-index.json','data/klink-production-instructions.json','lib/grammar-choice-answer.ts','lib/sequence-answer.ts'];
export function verifyGrammarReady16Content(read=readFileSync){
 const successor=verifyLetterAbReady10Release(read),currentRead=read;read=file=>readBeforeLetterAbReady10(file,successor,currentRead);
 const json=p=>JSON.parse(read(p)),r=json('docs/klink-owner-release-grammar-ready16-20261104.json');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,json(root+'audio-live-release-readback.json').sourceCommit);
 const approval=json(root+'audio-approval.json');assert.equal(r.ownerTurn,approval.turnId);assert.equal(approval.quote,'Ja, zo is de tas goed. Zorg dat alle audio hetzelfde volume heeft en rond de 40 grammaticaopdrachten af. Geen beelden of audio dubbel maken.');
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)));assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 assert.deepEqual(changed.filter(p=>/^(app|components|hooks|data|lib|public|db|drizzle)\//.test(p)),sort([...runtimeFiles]));
 assert.equal(git('diff','--name-only',base,successor.baselineSourceCommit,'--','public','hooks','.github','wrangler.jsonc','package.json','package-lock.json','vite.config.ts','next.config.ts','docs/appearance-floor-20261031','VORMGEVING-VASTGEZET.md').length,0);
 const index=json('data/klink-production-index.json'),prior=JSON.parse(git('show',base+':data/klink-production-index.json'));assert.deepEqual(index.slice(0,prior.length),prior);const rows=index.slice(prior.length);assert.equal(rows.length,2);assert(rows.every(x=>x.count===8&&['verb-choice','sentence-build'].includes(x.activity)));
 const a=json('data/klink-grammar-aa-assets.json'),used=new Set(),exerciseIds=[],source=new Map(json(root+'selected-source.json').map(x=>[x.id,x]));assert.deepEqual([...source.keys()].sort((a,b)=>a.localeCompare(b)),expectedIds);
 const walk=v=>{if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);else if(typeof v==='string'&&v.startsWith('/api/grammar-aa-assets/')){const k=v.split('/').at(-1);assert(a[k]);used.add(k);}};
 for(const row of rows){const k=row.url.split('/').at(-1);assert(a[k]);used.add(k);const bank=JSON.parse(Buffer.from(a[k].body,'base64'));assert.equal(bank.id,row.id);assert.equal(bank.exercises.length,8);
  for(const e of bank.exercises){exerciseIds.push(e.exerciseId);const s=source.get(e.exerciseId);assert(s);assert.equal(e.sourceRecordId,s.id);assert.equal(e.title,s.instruction);assert(e.requiresAudio&&e.requiresExplicitCompletion&&e.manualAdvance);assert(e.prompt.image?.src);assert(e.prompt.audio?.src);walk(e);
   if(e.items){assert.deepEqual(e.items.map(x=>x.text),s.cards);assert.equal(e.targetOrderIds.map(id=>e.items.find(x=>x.itemId===id).text).join(' ')+'.',s.model);assert(e.items.every(x=>x.audio?.src));}
   else{assert.deepEqual(e.options.map(x=>x.label),s.choices.map(x=>x.text));assert.deepEqual(e.answer.correctOptionIds,e.options.filter((x,i)=>s.choices[i].correct).map(x=>x.id));assert(e.options.every(x=>x.audio?.src));}
  }
 }
 assert.deepEqual(exerciseIds.sort((a,b)=>a.localeCompare(b)),expectedIds);assert.equal(used.size,Object.keys(a).length);
 for(const[k,e]of Object.entries(a)){const b=Buffer.from(e.body,'base64');assert.equal(sha(b),e.sha256);assert(k.startsWith(e.sha256+'.'));assert.equal(b.length,e.bytes);}
 assert(a[approval.approvedSha256+'.mp3']);
 const ins=json('data/klink-production-instructions.json'),oldIns=JSON.parse(git('show',base+':data/klink-production-instructions.json'));assert.deepEqual(ins.slice(0,oldIns.length),oldIns);
 const b=json(root+'browser-result.json');assert.equal(b.flows.length,32);assert.deepEqual(b.errors,[]);assert.deepEqual([...new Set(b.flows.map(x=>x.id))].sort((a,b)=>a.localeCompare(b)),expectedIds);assert(b.flows.every(x=>x.optionEndings===3));assert.equal(b.payloads.length,Object.keys(a).length);
 const v=json(root+'verification.json');assert(v.typesPassed&&v.lintPassed&&v.normalBuildPassed&&v.bankTestsPassed&&v.assetHttpCasesPassed&&v.storageRegressionPassed);assert.equal(v.appearanceChanged,false);assert.equal(v.newGeneration,0);assert.equal(v.independentHumanNt2Review,false);
 const p=json(root+'preservation.json');assert(p.runtimeMatchesPriorTestedIntegration&&p.allOldPublicBytesEqual);assert.equal(p.oldPublicFiles,20106);assert(p.inheritedVisualEvidence.length>0);
 const cap=json(root+'capacity.json');assert.equal(json(root+'offered-build-assets.json').count,20000);assert(cap.maxStaticFileBytes<=25*1024*1024&&cap.workerGzipKiB<10240&&cap.workerKiB<65536&&cap.noConfigLimitBudgetChanges);
 return {...r,successor};
}
export function verifyGrammarReady16Release(read=readFileSync){const r=verifyGrammarReady16Content(read),b=JSON.parse(read(root+'gate-backup.json'));assert(b.driveId&&b.fullReadback&&b.zipIntegrity);assert.deepEqual(b.files,r.files);assert.deepEqual(b.evidenceFiles,r.evidenceFiles);return r;}
export function readBeforeGrammarReady16(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):readBeforeLetterAbReady10(file,r.successor,read);}
