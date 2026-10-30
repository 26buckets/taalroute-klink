import {verifyTeacherPhonemesRelease,readBeforeTeacherPhonemes} from './check-teacher-phonemes-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyRemainingImageLinks(read=readFileSync){
 const successor=verifyTeacherPhonemesRelease(read),currentRead=read;read=file=>readBeforeTeacherPhonemes(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-remaining-images-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Maak de overige koppelingen ook af en zet ze online. Laat het Nederlandse ambulancebeeld in een aparte beeldchat maken, zodat die Fotobingo-opdracht ook helemaal af kan.');
 assert.equal(r.baselineSourceCommit,'12a22748b38c1b1e437f02677bf88721847d0145');assert.equal(r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['docs/KLINK-DOCENTHANDLEIDING.md','app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)).sort((a,b)=>a.localeCompare(b));assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const allowed=['components/product/taalroute-header.tsx','data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','scripts/build-practice-overview.mjs','scripts/check-twelve-categories-release.mjs','scripts/check-remaining-image-links-20261030.mjs','scripts/test-remaining-image-links-release-20261030.mjs','scripts/test-remaining-image-links-20261030.mjs','scripts/test-remaining-images-browser-20261030.mjs','scripts/test-production-content.mjs','scripts/test-production-answers.mjs','scripts/test-word-image-beta.mjs','public/klink-oefenoverzicht-beelden-20261030.html'];
 assert(changed.every(f=>allowed.includes(f)||/^public\/package-media\/klink-koppelingen-20261030\/[a-z0-9_]+\.webp$/.test(f)||/^public\/practice-content\/klink-20261029\/[a-zA-Z0-9_-]+\.json$/.test(f)));
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,successor.baselineSourceCommit,'--','public').length,0,'Published public files remain immutable');
 const header='components/product/taalroute-header.tsx';assert.equal(read(header).toString(),git('show',`${r.baselineSourceCommit}:${header}`).toString().replace('/klink-oefenoverzicht-20261030.html','/klink-oefenoverzicht-beelden-20261030.html'));
 for(const f of r.historicalFiles)assert.equal(sha(read(f)),r.documentFiles[f],f);
 const media=JSON.parse(read('docs/remaining-links-20261030/media.json'));assert.equal(sha(read('docs/remaining-links-20261030/media.json')),r.mediaSha256);assert.equal(media.assets.length,56);assert.equal(media.newScenes.length,21);assert.equal(media.summary.exercisePlacements,58956);
 for(const a of media.assets){assert(a.bytes<140000);assert.equal(sha(read('public'+a.url)),a.sha256);}
 const review=JSON.parse(read('docs/remaining-links-20261030/review.json'));for(const k of ['images','hands','sourceLinks','types','lint','build','content','answers','browser','menu','progressPreserved','audioMetadata','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/remaining-links-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeRemainingImageLinks(file,r,read=readFileSync){return r.changedFiles.includes(file)||r.historicalFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):readBeforeTeacherPhonemes(file,r.successor,read);}
