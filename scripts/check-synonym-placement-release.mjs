import {verifyDriveImagesRelease,readBeforeDriveImages} from './check-drive-images-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
const sha=b=>createHash('sha256').update(b).digest('hex');
export function verifySynonymPlacementRelease(read=readFileSync){
 const successor=verifyDriveImagesRelease(read),currentRead=read;read=file=>readBeforeDriveImages(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-synonym-placement-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'synoniemen moeten niet terugkomen op de woorden bekijken pagina. alleen maar onder A1, A2 en B1 zoals die nu al staat, dus hij hoeft niet op een andere pagina terug te komen.');
 assert.equal(r.baselineSourceCommit,'02f16c1fdcb540550de91510c1a11c7ca29c4bbd');
 git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)).sort((a,b)=>a.localeCompare(b));
 const expected=['components/product/learner-app.tsx','scripts/check-word-round-continuity-release.mjs','scripts/check-synonym-placement-release.mjs','scripts/test-synonyms.mjs','scripts/test-synonyms-browser.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,expected);assert.deepEqual([...r.changedFiles].sort((a,b)=>a.localeCompare(b)),expected);
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.deepEqual(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','data','lib','public')),[]);
 const before=git('show',`${r.baselineSourceCommit}:components/product/learner-app.tsx`).toString();
 const duplicate='      <a className="secondary-button" href={chapterHash({ chapter: \'words\', activity: \'synonyms\', level: \'all\', help: \'practice\' })}>Synoniemen<ArrowRight aria-hidden="true" /></a>\n';
 assert(before.includes(duplicate));assert.equal(read('components/product/learner-app.tsx').toString(),before.replace(duplicate,''));
 const review=JSON.parse(read('docs/synonym-placement-20261031/review.json'));
 for(const k of ['library','levels','words','audio','progress','navigation','mobile','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/synonym-placement-20261031/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeSynonymPlacement(file,release,read=readFileSync){return release.changedFiles.includes(file)?git('show',`${release.baselineSourceCommit}:${file}`):readBeforeDriveImages(file,release.successor,read);}
