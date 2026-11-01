import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const instructionCandidateFile='docs/instruction-integration-20261101/prepared.json';
const base='b670d0c1337eea07e96662237de4b9508de9735c';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const sourceCache=new Map();
const git=(...args)=>{if(args[0]!=='show')return execFileSync('git',args,{maxBuffer:128e6});const key=args.join('\0');if(!sourceCache.has(key))sourceCache.set(key,execFileSync('git',args,{maxBuffer:128e6}));return Buffer.from(sourceCache.get(key));};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.toSorted();
const snapshots=new Map();
export function instructionBaseline(file){
 if(!snapshots.has(file))snapshots.set(file,git('show',base+':'+file));
 return Buffer.from(snapshots.get(file));
}
const grammarScopeFile='docs/grammar-self-lessons-20261101/scope.json';
const grammarScopeHash='cee00e034ad935352d030763d55766d7227d6f134b82d3db8e9b08f6fb44e005';
function grammarBefore(file,scope){
 const record=scope.files[file];
 return record?.before ? git('show',scope.baselineSourceCommit+':'+file) : undefined;
}
const alfaScopeFile='docs/grammar-alfa-b1-20261101/scope.json';
const alfaScopeHash='bfb03db9da8d5c5cb0cd47f32f1fe5083e56fea1fe572e5f3f549f2a2d785bd0';
const integrationFile='docs/grammar-live-integration-20261101/scope.json';
const integrationHash='678815f360b2e4f92bfb89b7b4d8b1b5f6c4c1625532b2e6cfb401ac1ab71188';
function verifyIntegration(read){
 const bytes=read(integrationFile);assert.equal(sha(bytes),integrationHash,'Only the reviewed local merge is allowed');
 const r=JSON.parse(bytes);
 assert.equal(r.liveSourceCommit,'be7d78289945084612b20a0aa3058bb7730a43a5');
 assert.equal(r.previousCandidate,'f16073e9');
 assert.equal(r.localOnly,true);assert.equal(r.publicationApproved,false);assert.equal(r.productionBatch,false);
 for(const revision of [r.liveSourceCommit,r.previousCandidate])git('merge-base','--is-ancestor',revision,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.liveSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,sort([...Object.keys(r.files),'scripts/check-instruction-candidate.mjs']),'Every local merge change must be accounted for');
 for(const[file,hash]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(file)),hash,file);
 for(const[file,hash]of Object.entries(r.liveFingerprints))assert.equal(sha(git('show',r.liveSourceCommit+':'+file)),hash,file);
 return r;
}
export function verifyInstructionCandidate(read=readFileSync){
 const integration=verifyIntegration(read);
 // Validate the previously frozen local scopes at their original source after checking every merged byte.
 read=file=>git('show',integration.previousCandidate+':'+file);
 const currentRead=read,alfaBytes=read(alfaScopeFile);
 assert.equal(sha(alfaBytes),alfaScopeHash,'Only the authorized Alfa/B1 local rehearsal is allowed');
 const alfa=JSON.parse(alfaBytes);
 assert.equal(alfa.localOnly,true);assert.equal(alfa.publicationApproved,false);assert.equal(alfa.productionBatch,false);
 git('merge-base','--is-ancestor',alfa.baselineSourceCommit,'HEAD');
 for(const[file,record]of Object.entries(alfa.files)){
  assert.equal(sha(read(file)),record.after,file);
  if(record.before)assert.equal(sha(grammarBefore(file,alfa)),record.before,file);
 }
 read=file=>alfa.files[file]?.before?grammarBefore(file,alfa):currentRead(file);
 const originalRead=read;
 const scopeBytes=read(grammarScopeFile);assert.equal(sha(scopeBytes),grammarScopeHash,'Only the reviewed local grammar integration is allowed');
 const grammar=JSON.parse(scopeBytes);
 assert.equal(grammar.localOnly,true);assert.equal(grammar.publicationApproved,false);
 for(const[file,record]of Object.entries(grammar.files)){
  assert.equal(sha(read(file)),record.after,file);
  if(record.before)assert.equal(sha(grammarBefore(file,grammar)),record.before,file);
 }
 read=file=>grammar.files[file]?.before?grammarBefore(file,grammar):originalRead(file);
 if(!existsSync(instructionCandidateFile))return null;
 const r=JSON.parse(read(instructionCandidateFile));
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.approvedBy,'Nico');
 assert.equal(r.localOnly,true);assert.equal(r.publicationApproved,false,'This preparation grants no publication authority');
 assert.equal(r.userRequest,'Voeg deze correcties samen met de nieuwste livebasis en los de resterende testafwijkingen en vrijgavepunten veilig op. Behoud deze opmaak, test alles lokaal en publiceer nog niets.');
 git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort(lines(git('diff','--name-only',base,integration.previousCandidate,'--',...roots)));
 assert.deepEqual(changed,sort([...new Set([...Object.keys(r.files),...grammar.releaseFiles,...alfa.releaseFiles])]),'Every changed or untracked release file must be accounted for');
 const instructionChanges=Object.keys(r.files);
 for(const [file,hash]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(file)),hash,file);
 const oldScope='docs/instruction-local-20261101/scope.json';
 assert.deepEqual(read(oldScope),git('show','19e7db5c:'+oldScope));
 const allowedRuntime=new Set(JSON.parse(read(oldScope)).files.map(f=>f.path));
 for(const f of ['components/product/imported-practice-surface.tsx','data/klink-alfa-c-readalong.json','lib/learner-route.ts'])allowedRuntime.add(f);
 for(const file of instructionChanges)assert(file.startsWith('scripts/')||allowedRuntime.has(file),'Unexpected runtime change: '+file);
 for(const file of instructionChanges.filter(f=>/^(components|lib)\//.test(f)&&f!=='lib/learner-route.ts'))assert.deepEqual(read(file),git('show','19e7db5c:'+file),'Preserve the reviewed instruction fix: '+file);
 const suffix=read('docs/instruction-local-20261101/layout-addition.css');
 assert.equal(sha(suffix),'fb22accf4eca581e4bf3576add6b8e6e3f5b5e4f9320b05911d7abf653172cc0');
 assert.equal(read('app/learner-layout.css').toString(),instructionBaseline('app/learner-layout.css').toString()+suffix.toString());
 assert.equal(read('lib/learner-route.ts').toString(),instructionBaseline('lib/learner-route.ts').toString().replace("'context-order', 'situation-point'","'word-combinations', 'suitable-reply', 'context-order', 'situation-point'"));
 const jsonFiles=instructionChanges.filter(f=>f.endsWith('.json')),restored=new Map(jsonFiles.map(f=>[f,JSON.parse(read(f))]));
 for(const[path,hash]of[
  ['docs/instruction-simplification-20261101/amendment.json','516c09aa6f83dc243b865ad937a4649b84fb588790cd5793b098a26f9f23c773'],
  ['docs/local-instruction-appwide-20261101/amendment.json','bdcc4e401f559f675a9ebeb73534c7c2bda1cf307835061874ba1d34053ccd06'],
  ['docs/local-instruction-review-20261101/amendment.json','9545730f58edead36ce9a8ef9e0e038367df0a19ad57799248a2d8513489b4dd']]){
  const bytes=read(path);assert.equal(sha(bytes),hash);
  for(const c of JSON.parse(bytes).changes){const file=c.file??'data/klink-imported-practice.json';if(!restored.has(file))continue;let parent=restored.get(file);for(const key of c.path.slice(0,-1))parent=parent[key];const key=c.path.at(-1);assert.deepEqual(parent[key],c.after);parent[key]=c.before;}
 }
 const alignment='data/klink-alfa-c-readalong.json',oldAlignment=JSON.parse(instructionBaseline(alignment)),current=restored.get(alignment);let periods=0;
 for(let i=0;i<current.clips.length;i++){const clip=current.clips[i],old=oldAlignment.clips[i],last=clip.words.length-1;if(clip.words[last].text!==old.words[last].text){assert.equal(clip.words[last].text,old.words[last].text+'.');assert.equal(clip.words.map(w=>w.text).join('').replace(/\s/g,''),clip.text.replace(/\s/g,''));clip.words[last].text=old.words[last].text;periods++;}}
 assert.equal(periods,2);
 for(const[file,data]of restored)assert.deepEqual(data,JSON.parse(instructionBaseline(file)),'All other source fields remain unchanged: '+file);
 for(const f of JSON.parse(read('docs/instruction-local-20261101/scope.json')).files.filter(f=>f.path.endsWith('.pdf')))assert.equal(sha(read(f.path)),f.afterSha256);
 return {...r,grammarExtension:grammar,alfaExtension:alfa,integration};
}
export function readBeforeInstructionCandidate(file,proof,read=readFileSync){
 if(proof?.integration)return Object.hasOwn(proof.integration.liveFiles,file)?git('show',proof.integration.liveSourceCommit+':'+file):read(file);
 return proof&&Object.hasOwn(proof.files,file)?instructionBaseline(file):proof?.grammarExtension?.files[file]?.before?grammarBefore(file,proof.grammarExtension):proof?.alfaExtension?.files[file]?.before?grammarBefore(file,proof.alfaExtension):read(file);
}
