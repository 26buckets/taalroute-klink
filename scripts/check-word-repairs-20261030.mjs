import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function assertWordRepairs(before,after,clips){
 const expected=structuredClone(before);assert.deepEqual(clips.map(c=>c.word).sort((a,b)=>a.localeCompare(b)),['mappen','noot']);
 for(const c of clips){assert.equal(c.voiceId,'0qLmDzgqulxcvv0yf3kg');assert.equal(c.src,`/package-audio/woordherstel-20261030/${c.word}.mp3`);assert.equal(c.originalSrc,before[`klink-woord-${c.word}`].audio);expected[`klink-woord-${c.word}`].audio=c.src;}
 assert.deepEqual(after,expected,'Only noot and mappen audio links may change');
}
export function verifyWordRepairs(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-word-repairs-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'a3826557ca3af7c4935c0fd2969d9f8bbb2a8096');assert.equal(r.liveSourceCommit,'89fe121338c1c08ed7238dceaba794a953c7fec2');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));
 const allowed=['data/klink-media.json','public/content-register/active.json','public/content-register/planned.json','scripts/test-sections.mjs','public/package-audio/woordherstel-20261030/noot.mp3','public/package-audio/woordherstel-20261030/mappen.mp3','scripts/check-image-release-20261030.mjs','scripts/check-word-repairs-20261030.mjs','scripts/test-word-repairs-20261030.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,allowed);assert.deepEqual([...r.changedFiles].sort((a,b)=>a.localeCompare(b)),allowed);
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 const before=JSON.parse(git('show',`${r.baselineSourceCommit}:data/klink-media.json`));assertWordRepairs(before,JSON.parse(read('data/klink-media.json')),r.clips);
 let register=git('show',`${r.baselineSourceCommit}:public/content-register/active.json`).toString();
 for(const c of r.clips){assert(register.includes(c.originalSrc));register=register.replaceAll(c.originalSrc,c.src);assert.equal(sha(read('public'+c.src)),c.sha256);assert.equal(c.metadata.artist,'Taalroute');assert.equal(c.metadata.album_artist,'Taalroute');assert.equal(c.metadata.publisher,'Taalroute');assert.equal(c.transcript,c.word);}
 assert.equal(read('public/content-register/active.json').toString(),register);
 let planned=git('show',`${r.baselineSourceCommit}:public/content-register/planned.json`).toString();for(const c of r.clips)planned=planned.replaceAll(c.originalSrc,c.src);assert.equal(read('public/content-register/planned.json').toString(),planned);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public/package-audio').length,0,'Original recordings stay intact');
 return r;
}
export function readBeforeWordRepairs(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):read(file);}
