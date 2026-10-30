import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyBetaRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-beta-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Ja, prima. Zet deze gecontroleerde wijzigingen nu live in Klink, inclusief Klink Plus docent, de oefenaantallen en de luisteroefeningen voor Alfa C, A1, A2 en B1.');
 assert.equal(r.baselineSourceCommit,'60525ae784e46f66756ed4fbca415032bfb71b8c');
 assert.equal(r.liveSourceCommit,'6d19f7f5f262abcdf38c788ce7a0c5ab62df3244');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public').length,0,'All published assets remain immutable');
 assert.equal(git('diff',r.baselineSourceCommit,'--','data/klink-media.json','data/klink-progress-image-aliases-20261030.json','lib/round-progress.ts','lib/media-player.ts','db','drizzle','package.json','package-lock.json','vite.config.ts','.github').length,0,'Keep repairs, progress, audio policy, storage and deployment unchanged');
 const before=JSON.parse(git('show',`${r.baselineSourceCommit}:data/klink-production-index.json`));
 const index=JSON.parse(read('data/klink-production-index.json'));
 assert.deepEqual(index.filter(x=>!x.id.startsWith('audio-words:')),before);
 const added=index.filter(x=>x.id.startsWith('audio-words:'));assert.equal(added.length,96);
 for(const [level,n] of Object.entries({'alfa-c':16,a1:12,a2:8,b1:12}))for(const activity of ['listen','hear-match'])assert.equal(added.filter(x=>x.level===level&&x.activity===activity&&x.help==='practice').length,n);
 const review=JSON.parse(read('docs/beta-publication-20261030/review.json'));
 for(const k of ['types','lint','build','content','answers','menu','integration','imagesPreserved','audioMetadata','betaUI','teacher','progress','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/beta-publication-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeBetaRelease(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):read(file);}
