import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:64*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.toSorted();
const evidence='docs/klink-alfa-c-audio-20261027';
export const alfaCAudioCodeFiles=[
 'components/product/alfa-c-practice.tsx','lib/alfa-c-practice.ts','data/klink-alfa-c-audio.json','data/klink-teacher-manual.json',
 'scripts/check-alfa-c-texts-release.mjs','scripts/check-alfa-c-audio-release.mjs',
 'scripts/test-alfa-c-audio.mjs','scripts/test-alfa-c-audio-browser.mjs','scripts/test-alfa-c-audio-release.mjs',
 'scripts/test-alfa-c-texts-browser.mjs','scripts/test-publication-proof.mjs',
];
export const alfaCAudioEvidence=['owner-request','live-baseline','production-plan','metadata','transcripts','review'];
export function verifyAlfaCAudioRelease(readFile=readFileSync,release=JSON.parse(readFileSync('docs/klink-owner-release-alfa-c-audio-20261027.json'))){
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
 assert.equal(release.userRequest,'Maak nu ook de audio voor de herziene instructies en hulpteksten en zet die bij de juiste Alfa C-opdrachten. Gebruik een aparte instructiestem en behoud de bestaande goede audio.');
 assert.equal(release.baselineSourceCommit,'195a5673fc654ef3dbdd75b3c107bbdcff36a1fb');
 assert.equal(release.newAudio,36);assert.equal(release.newTargetAudio,0);assert.equal(release.humanListeningReview,false);
 assert.equal(release.voiceId,'h6uBOiAjLKklte8hdYio');assert.notEqual(release.voiceId,release.targetVoiceId);
 git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 const audio=JSON.parse(readFile('data/klink-alfa-c-audio.json'));assert.equal(audio.voiceId,release.voiceId);assert.equal(audio.targetVoiceId,release.targetVoiceId);assert.equal(audio.playbackRate,1);assert.equal(Object.keys(audio.clips).length,36);
 assert.equal(sha(readFile('data/klink-alfa-c-texts.json')),audio.textSourceSha256);assert.equal(sha(readFile('data/klink-alfa-c-texts.json')),sha(git('show',release.baselineSourceCommit+':data/klink-alfa-c-texts.json')));
 const media=Object.values(audio.clips).map(c=>'public'+c.src);
 for(const c of Object.values(audio.clips)){assert(c.src.startsWith('/package-audio/alfa-c-uitleg-20261027/'));assert.equal(c.voiceId,release.voiceId);assert.equal(sha(readFile('public'+c.src)),c.sha256);}
 const roots=['app','components','hooks','data','lib','public','scripts'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=git('ls-files','--others','--exclude-standard','--',...roots).toString().trim().split('\n').filter(Boolean);
 assert.deepEqual(sort([...new Set([...changed,...untracked])]),sort([...alfaCAudioCodeFiles,...media]));
 const files=[...alfaCAudioCodeFiles,...media,'AGENTS.md','docs/KLINK-DOCENTHANDLEIDING.md',...alfaCAudioEvidence.map(n=>`${evidence}/${n}.json`)];
 const required=[...files,`${evidence}/source-manifest.json`,`${evidence}/source-drive-verification.json`];assert.deepEqual(sort(Object.keys(release.files)),sort(required));
 for(const [file,hash]of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
 assert.equal(JSON.parse(readFile(`${evidence}/owner-request.json`)).userRequest,release.userRequest);
 const live=JSON.parse(readFile(`${evidence}/live-baseline.json`));assert.equal(live.sourceCommit,release.baselineSourceCommit);assert.equal(live.sourceClean,true);
 const plan=JSON.parse(readFile(`${evidence}/production-plan.json`));assert.equal(plan.voiceId,release.voiceId);assert.equal(plan.targetVoiceId,release.targetVoiceId);assert.equal(plan.clips.length,36);
 const metadata=JSON.parse(readFile(`${evidence}/metadata.json`));assert.equal(metadata.length,36);
 for(const row of metadata){assert.equal(row.voiceId,release.voiceId);assert.equal(row.sha256,audio.clips[row.id].sha256);assert.equal(row.audioReencoded,false);assert(row.audioPacketHash&&row.originalSha256);for(const k of ['artist','album_artist','publisher'])assert.equal(row.metadata[k],'Taalroute');assert.equal(row.metadata.album,'Klink - Alfa C - Uitleg en hulp');assert(!/suno|elevenlabs|openai|generator/i.test(JSON.stringify(row.metadata)));}
 const transcripts=JSON.parse(readFile(`${evidence}/transcripts.json`));assert.equal(transcripts.checks.length,36);assert(transcripts.checks.every(c=>c.exactNormalized&&c.wordErrors===0));
 const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');for(const k of ['correctBindings','bothBrowsers','all36Narrow','native36','targetRequired','audioErrorRetry','progressPreserved','existingMediaPreserved','metadataPassed','transcriptsPassed','typesPassed','lintPassed','buildPassed'])assert.equal(review[k],true,k);
 assert.equal(JSON.parse(readFile('data/klink-audio-policy.json')).instructionAudioEnabled,false);
 for(const row of JSON.parse(readFile('docs/klink-alfa-c-release-20261026/media.json')).media)assert.equal(sha(readFile('public'+row.src)),row.sha256,'Existing media '+row.src);
 const previous='docs/klink-owner-release-alfa-c-texts-20261027.json';assert.equal(sha(readFile(previous)),sha(git('show',release.baselineSourceCommit+':'+previous)));
 const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));assert.deepEqual(manifest.map(r=>r.path),files);for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);assert.equal(backup.originalsVerified,36);assert.equal(backup.provenanceRecordsVerified,36);
 return release;
}
export function readBeforeAlfaCAudio(file,release,reader=readFileSync){return release.files[file]?git('show',release.baselineSourceCommit+':'+file):reader(file);}
