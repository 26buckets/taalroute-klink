import {verifyTwelveCategoriesRelease,readBeforeTwelveCategories} from './check-twelve-categories-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyWordImageBetaRelease(read=readFileSync){
 const successor=verifyTwelveCategoriesRelease(read),currentRead=read;read=file=>readBeforeTwelveCategories(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-placeholders-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert(r.userRequest.includes('een placeholder maken van een 1 bij 1 afbeelding'));
 assert(r.userRequest.includes('die content al online'));
 assert.equal(r.baselineSourceCommit,'dd51763f9d123a6a74c5fbe9cc2249df64a75d99');assert.equal(r.liveSourceCommit,r.baselineSourceCommit);
 git('merge-base','--is-ancestor',r.liveSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)).sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));assert(changed.length>490);
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,successor.baselineSourceCommit,'--','public').length,0,'Published public files remain immutable');
 assert.equal(git('diff',r.baselineSourceCommit,successor.baselineSourceCommit,'--','data/klink-media.json','data/klink-progress-image-aliases-20261030.json','lib/round-progress.ts','lib/media-player.ts','db','drizzle','package.json','package-lock.json','vite.config.ts','.github').length,0);
 const before=JSON.parse(git('show',`${r.baselineSourceCommit}:data/klink-production-index.json`)),index=JSON.parse(read('data/klink-production-index.json'));
 assert.deepEqual(index.filter(x=>!x.id.startsWith('beta-images:')),before);
 const added=index.filter(x=>x.id.startsWith('beta-images:'));assert.equal(added.length,192);assert.equal(added.reduce((n,x)=>n+x.count,0),1920);
 for(const [level,n]of Object.entries({'alfa-c':16,a1:12,a2:8,b1:12}))for(const activity of ['listen','read','match','cards'])assert.equal(added.filter(x=>x.level===level&&x.activity===activity&&x.help==='practice').length,n);
 const registry=JSON.parse(read('docs/placeholders-20261030/registry.json'));assert.equal(registry.words.length,372);assert.equal(registry.words.filter(w=>w.status==='placeholder').length,299);assert.deepEqual(registry.collections,added);
 const review=JSON.parse(read('docs/placeholders-20261030/review.json'));for(const k of ['types','lint','build','content','answers','browser','images','audioMetadata','counts','preservation','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/placeholders-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeWordImageBeta(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):readBeforeTwelveCategories(file,r.successor,read);}
