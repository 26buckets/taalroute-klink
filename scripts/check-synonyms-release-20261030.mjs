import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
export const synonymsBaseline = '8b2978dec51ee1ecb3a045144a82fcaa93308ac8';
export const synonymScopeFiles = [
  'app/learner-ui.css', 'components/product/extended-practice-surface.tsx', 'components/product/learner-app.tsx',
  'components/product/package-exercise-browser.tsx', 'components/product/package-group-practice.tsx', 'components/product/practice-chapters.tsx',
  'data/klink-synonyms.json', 'data/klink-synonym-audio.json', 'lib/group-practice.ts', 'lib/practice-chapters.ts', 'lib/production-practice.ts', 'lib/synonyms.ts',
  'scripts/check-hidden-b2-release.mjs', 'scripts/check-synonyms-release-20261030.mjs', 'scripts/test-synonyms-release-20261030.mjs',
  'scripts/test-practice-chapters.mjs', 'scripts/test-synonyms.mjs', 'scripts/test-synonyms-browser.mjs', 'scripts/test-synonym-modes-browser.mjs',
  'scripts/test-synonym-audio-browser.mjs',
  'scripts/test-publication-proof.mjs',
];

export function assertSynonymAudio(clips, bindings) {
  assert.equal(clips.length, 68);
  assert.equal(new Set(clips.map(clip => clip.word)).size, 68);
  assert.deepEqual(Object.keys(bindings).sort(), clips.map(clip => `synonym-word:${clip.word}`).sort());
  for (const clip of clips) {
    const binding = bindings[`synonym-word:${clip.word}`];
    assert.equal(clip.voiceId, '0qLmDzgqulxcvv0yf3kg');
    assert.equal(clip.role, 'target'); assert.equal(clip.humanReview, 'open');
    assert.equal(clip.src, `/package-audio/synoniemen-20261030/${clip.id}.mp3`);
    assert(/^SW\d{3}$/.test(clip.id));
    assert(clip.metadataVerified && clip.audioPacketsUnchanged);
    assert(clip.duration >= .25 && clip.duration < 4 && clip.peak >= 500 && clip.rms >= 100);
    for (const key of ['artist', 'album_artist', 'publisher']) assert.equal(clip.metadata[key], 'Taalroute');
    assert.equal(clip.metadata.title, clip.word); assert.equal(clip.metadata.album, 'Klink - Synoniemen');
    assert(!/elevenlabs|suno|openai|generator/i.test(JSON.stringify(clip.metadata)));
    assert.equal(binding.transcript, clip.word); assert.equal(binding.src, clip.src); assert.equal(binding.role, 'target');
    assert.equal(binding.voiceId, clip.voiceId); assert.equal(binding.review, 'approved'); assert.equal(binding.metadataApproved, true);
  }
}

export function verifySynonymsRelease(read = readFileSync) {
  const release = JSON.parse(read('docs/klink-owner-release-synonyms-20261030.json'));
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.userRequest, 'Ja, maak ook de ontbrekende audio en zet Synoniemen daarna online in Klink.');
  assert.equal(release.baselineSourceCommit, synonymsBaseline);
  assert.equal(release.liveSourceCommit, 'b96c60d46bbb7609de7f1612e5d9ecfa391ea776');
  assert.equal(release.newInstructionAudio, false); assert.equal(release.newImages, 0); assert.equal(release.newAudio, 68);
  git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  const roots = ['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
  const changed = [...new Set([...lines(git('diff','--name-only',release.baselineSourceCommit,'--',...roots)), ...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b) => a.localeCompare(b));
  assert.deepEqual(changed, [...release.changedFiles].sort((a,b) => a.localeCompare(b)));
  assert(changed.every(file => synonymScopeFiles.includes(file) || /^public\/package-audio\/synoniemen-20261030\/SW\d{3}\.mp3$/.test(file)));
  for (const file of changed) assert.equal(sha(read(file)), release.files[file], file);
  assert.equal(git('diff','--name-only','--diff-filter=MD',release.baselineSourceCommit,'--','public').length, 0, 'Existing public files remain byte-identical');
  const clips = JSON.parse(read('docs/synonyms-20261030/audio.json'));
  assertSynonymAudio(clips, JSON.parse(read('data/klink-synonym-audio.json')));
  for (const clip of clips) {
    assert.equal(sha(read('public' + clip.src)), clip.sha256);
    const probe = JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json','public' + clip.src]));
    for (const key of ['artist','album_artist','publisher','album','title']) assert.equal(probe.format.tags[key], clip.metadata[key]);
  }
  const review = JSON.parse(read('docs/synonyms-20261030/publication-review.json'));
  for (const key of ['types','lint','build','unit','browser','nativePlayback','audioMetadata','preservation','localOnly']) assert.equal(review[key], true, key);
  assert.equal(review.choicePairs, 210); assert.equal(review.forwardAudio, 210); assert.equal(review.reverseAudio, 210);
  const backup = JSON.parse(read('docs/synonyms-20261030/backup.json'));
  assert.equal(backup.verified, true); assert(backup.driveId && backup.sha256);
  for (const file of changed) assert.equal(backup.files[file], release.files[file], file);
  return release;
}

export function readBeforeSynonyms(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show', `${release.baselineSourceCommit}:${file}`) : read(file);
}
