import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
const sha=b=>createHash('sha256').update(b).digest('hex');
export function verifyLongContentRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-long-content-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Ja, volg je advies: maak van het kookverhaal en het gesprek één situatie met Sara en Ali en houd de twee teksten op begeleid A2. Controleer de gekoppelde oefeningen en audio en zet de herstelversie daarna live.');
 assert.equal(r.baselineSourceCommit,'f9de289c6324b1ec71bed77ef1061b5fe2845f0d');
 assert.equal(r.liveSourceCommit,'fcffb481512bccb393439aac67eac39b9d56d5b5');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const allowed=["data/klink-connected-content.json", "data/klink-content-routing.json", "data/klink-dialogue-repair.json", "data/klink-functional-writing.json", "data/klink-long-content-levels.json", "lib/connected-content.ts", "lib/content-levels.ts", "lib/extended-practice.ts", "lib/learner-route.ts", "lib/practice-chapters.ts", "public/content-register/active.json", "public/package-audio/kookherstel-20261030/d128-2.mp3", "public/package-audio/kookherstel-20261030/d128-4.mp3", "public/package-audio/tekstherstel-20261030/d119.mp3", "public/package-audio/tekstherstel-20261030/t020.mp3", "public/package-audio/tekstherstel-20261030/t042.mp3", "public/package-audio/tekstherstel-20261030/t121.mp3", "public/package-audio/tekstherstel-20261030/t164.mp3", "scripts/check-long-content-release-20261030.mjs", "scripts/check-long-review.mjs", "scripts/check-sentence-revision.mjs", "scripts/check-small-word-rounds-release.mjs", "scripts/test-cooking-release-20261030.mjs", "scripts/test-dialogue-repair.mjs", "scripts/test-long-content-browser-20261030.mjs", "scripts/test-long-content-review-20261030.mjs", "scripts/test-practice-chapters.mjs", "scripts/test-sentence-levels-20261030.mjs", "scripts/test-sentence-second-review-20261030.mjs"];
 assert.deepEqual(changed,allowed.sort((a,b)=>a.localeCompare(b)));
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 for(const [f,h]of Object.entries(r.evidence))assert.equal(sha(read(f)),h,f);
 assert.deepEqual(lines(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public')),['public/content-register/active.json']);
 const levels=JSON.parse(read('data/klink-long-content-levels.json')).items;
 assert.equal(levels.length,320);assert(levels.every(x=>x.status==='reviewed'&&!x.ownerReview));
 for(const ref of ['T153','T179']){const x=levels.find(x=>x.ref===ref);assert.equal(x.level,'A2');assert(x.preparation.includes('Bespreek vooraf'));}
 const bank=JSON.parse(read('data/klink-connected-content.json')).items;
 for(const row of levels){const x=bank.find(x=>x.id===row.contentId);assert.equal(x.text,row.text);assert.deepEqual(x.discussion??null,row.discussion);assert.equal(x.independentReading,false);}
 const clips=[...JSON.parse(read('docs/long-content-review-20261030/audio.json')),...JSON.parse(read('docs/cooking-release-20261030/audio.json'))];assert.equal(clips.length,7);
 for(const c of clips){assert.equal(sha(read('public'+c.src)),c.sha256);assert(c.metadataVerified&&c.audioPacketsUnchanged);assert.equal(c.humanListeningReview,'open');assert.notEqual(c.voiceId,'h6uBOiAjLKklte8hdYio');const tags=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json','public'+c.src])).format.tags;for(const k of ['artist','album_artist','publisher'])assert.equal(tags[k],'Taalroute');assert(!/elevenlabs|suno|openai|generator/i.test(JSON.stringify(tags)));}
 const checks=JSON.parse(read('docs/cooking-release-20261030/verification.json'));
 for(const k of ['types','lint','build','unit','browser','nativePlayback','audioMetadata','preservation','localOnly'])assert.equal(checks[k],true,k);
 const backup=JSON.parse(read('docs/cooking-release-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeLongContent(file,release,read=readFileSync){return release.changedFiles.includes(file)?git('show',`${release.baselineSourceCommit}:${file}`):read(file);}
