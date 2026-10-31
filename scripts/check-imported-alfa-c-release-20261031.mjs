import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));const sha=b=>createHash('sha256').update(b).digest('hex');
export function verifyImportedAlfaCRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-imported-alfa-c-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Ja, volg je advies bij die drie twijfelgevallen. Pas de gekoppelde opdrachten en antwoorden aan, controleer de audio en zet de herstelversie daarna live. Geef mij weer een directe link naar het resultaat.');
 assert.equal(r.baselineSourceCommit,'02f16c1fdcb540550de91510c1a11c7ca29c4bbd');assert.equal(r.liveSourceCommit,'ac7d278f37ad8532cdd685e858a23f7cb42c1603');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual([...changed].sort((a,b)=>a < b ? -1 : a > b ? 1 : 0), ["AGENTS.md", "app/learner-ui.css", "components/product/package-exercise-browser.tsx", "components/product/practice-chapters.tsx", "data/klink-alfa-c-docent.json", "data/klink-alfa-c-functioneel-audio.json", "data/klink-alfa-c-functioneel.json", "data/klink-alfa-c-readalong.json", "data/klink-b1-reading-support.json", "data/klink-imported-practice.json", "docs/KLINK-DOCENTHANDLEIDING.md", "lib/practice-chapters.ts", "lib/production-practice.ts", "public/package-audio/leesherstel-20261031/guide-1fbd568d406b.mp3", "public/package-audio/leesherstel-20261031/guide-947ccbc2020e.mp3", "public/package-audio/leesherstel-20261031/target-27fdc7709f21.mp3", "public/package-audio/leesherstel-20261031/target-edfdce6ae549.mp3", "public/package-audio/leesherstel-20261031/target-f1343a083cd2.mp3", "scripts/build-audio-register.mjs", "scripts/check-imported-alfa-c-release-20261031.mjs", "scripts/check-word-round-continuity-release.mjs", "scripts/test-alfa-c-functioneel-browser.mjs", "scripts/test-alfa-c-functioneel.mjs", "scripts/test-alfa-c-preview.mjs", "scripts/test-alfa-c-texts.mjs", "scripts/test-audio-register.mjs", "scripts/test-imported-alfa-c-recovery-20261031.mjs", "scripts/test-imported-alfa-c-recovery-browser-20261031.mjs"]);
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 for(const[f,h]of Object.entries(r.evidence))assert.equal(sha(read(f)),h,f);
 assert.deepEqual(lines(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public')),[]);
 const clips=JSON.parse(read('docs/imported-alfa-c-release-20261031/audio.json'));assert.equal(clips.length,5);
 for(const c of clips){assert.equal(sha(read('public'+c.src)),c.sha256);assert(c.metadataVerified&&c.audioPacketsUnchanged);assert.equal(c.humanListeningReview,'open');assert.equal(c.voiceId,c.role==='guide'?'h6uBOiAjLKklte8hdYio':'0qLmDzgqulxcvv0yf3kg');const tags=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json','public'+c.src])).format.tags;for(const k of ['artist','album_artist','publisher'])assert.equal(tags[k],'Taalroute');assert(!/elevenlabs|suno|openai|generator/i.test(JSON.stringify(tags)));}
 const checks=JSON.parse(read('docs/imported-alfa-c-release-20261031/verification.json'));
 for(const k of ['types','lint','build','unit','browser','nativePlayback','audioMetadata','preservation','localOnly'])assert.equal(checks[k],true,k);
 const backup=JSON.parse(read('docs/imported-alfa-c-release-20261031/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeImportedAlfaC(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):read(file);}
