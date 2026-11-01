import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const instructionCandidateFile='docs/instruction-integration-20261101/prepared.json';
const base='92a560870a5c5368c6711394fb52394eec29a742';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.toSorted();
const snapshots=new Map();
export function instructionBaseline(file){
 if(!snapshots.has(file))snapshots.set(file,git('show',base+':'+file));
 return Buffer.from(snapshots.get(file));
}
export function verifyInstructionCandidate(read=readFileSync){
 if(!existsSync(instructionCandidateFile))return null;
 const r=JSON.parse(read(instructionCandidateFile));
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.approvedBy,'Nico');
 assert.equal(r.localOnly,true);assert.equal(r.publicationApproved,false,'This preparation grants no publication authority');
 assert.equal(r.userRequest,'Voeg deze correcties samen met de nieuwste livebasis en los de resterende testafwijkingen en vrijgavepunten veilig op. Behoud deze opmaak, test alles lokaal en publiceer nog niets.');
 git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,sort(Object.keys(r.files)),'Every changed or untracked release file must be accounted for');
 for(const [file,hash]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(file)),hash,file);
 const oldScope='docs/instruction-local-20261101/scope.json';
 assert.deepEqual(read(oldScope),git('show','19e7db5c:'+oldScope));
 const allowedRuntime=new Set(JSON.parse(read(oldScope)).files.map(f=>f.path));
 for(const f of ['components/product/imported-practice-surface.tsx','data/klink-alfa-c-readalong.json','lib/learner-route.ts'])allowedRuntime.add(f);
 for(const file of changed)assert(file.startsWith('scripts/')||allowedRuntime.has(file),'Unexpected runtime change: '+file);
 for(const file of changed.filter(f=>/^(components|lib)\//.test(f)&&f!=='lib/learner-route.ts'))assert.deepEqual(read(file),git('show','19e7db5c:'+file),'Preserve the reviewed instruction fix: '+file);
 const suffix=read('docs/instruction-local-20261101/layout-addition.css');
 assert.equal(sha(suffix),'fb22accf4eca581e4bf3576add6b8e6e3f5b5e4f9320b05911d7abf653172cc0');
 assert.equal(read('app/learner-layout.css').toString(),instructionBaseline('app/learner-layout.css').toString()+suffix.toString());
 assert.equal(read('lib/learner-route.ts').toString(),instructionBaseline('lib/learner-route.ts').toString().replace("'context-order', 'situation-point'","'word-combinations', 'suitable-reply', 'context-order', 'situation-point'"));
 const jsonFiles=changed.filter(f=>f.endsWith('.json')),restored=new Map(jsonFiles.map(f=>[f,JSON.parse(read(f))]));
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
 return r;
}
export function readBeforeInstructionCandidate(file,proof,read=readFileSync){
 return proof&&Object.hasOwn(proof.files,file)?instructionBaseline(file):read(file);
}
