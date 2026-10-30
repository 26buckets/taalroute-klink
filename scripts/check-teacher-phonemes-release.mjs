import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyTeacherPhonemesRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-teacher-phonemes-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert(r.userRequest.includes('Pak ook die drie klanken mee.'));
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const expected=['components/product/teacher-classroom.tsx','public/content/klink-docent-audio.json','public/klank-audio/docent/m-20261030.mp3','public/klank-audio/docent/a-20261030.mp3','public/klank-audio/docent/t-20261030.mp3','scripts/test-teacher-classroom.mjs','scripts/test-teacher-phonemes-browser-20261030.mjs','scripts/check-teacher-phonemes-release.mjs',r.previousGate].sort();
 assert(/^scripts\/check-[a-z0-9-]+\.mjs$/.test(r.previousGate));
 const roots=['docs/KLINK-DOCENTHANDLEIDING.md','app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort();
 assert.deepEqual(changed,expected);assert.deepEqual([...r.changedFiles].sort(),expected);
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.deepEqual(lines(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public')),['public/content/klink-docent-audio.json']);
 const original=JSON.parse(git('show',`${r.baselineSourceCommit}:public/content/klink-docent-audio.json`));assert.deepEqual(original,{m:null,a:null,t:null});
 const registry=JSON.parse(read('public/content/klink-docent-audio.json'));assert.deepEqual(Object.keys(registry),['m','a','t']);
 const audio=JSON.parse(read('docs/teacher-phonemes-20261030/audio.json'));assert.equal(audio.clips.length,3);assert.notEqual(audio.targetVoiceId,audio.instructionVoiceId);
 for(const id of ['m','a','t']){
  assert.equal(registry[id],`/klank-audio/docent/${id}-20261030.mp3`);const clip=audio.clips.find(c=>c.id===id);assert(clip);assert.equal(clip.src,registry[id]);
  const bytes=read('public'+registry[id]);assert.equal(sha(bytes),clip.sha256);assert.deepEqual(bytes,read(`public/klank-audio/klanken-20261025/${id}.mp3`));
  assert.equal(clip.newSynthesis,false);for(const tag of ['artist','album_artist','publisher'])assert.equal(clip.metadata[tag],'Taalroute');
 }
 const review=JSON.parse(read('docs/teacher-phonemes-20261030/review.json'));for(const k of ['types','lint','build','unit','browser','nativePlayback','audioMetadata','progress','errorRecovery','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/teacher-phonemes-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeTeacherPhonemes(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):read(file);}
