import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { allPackageWords } from '../lib/package-content.ts';
import { isWithdrawnAudio } from '../lib/audio-policy.ts';
import { singleSpokenWord } from '../lib/word-listening-text.ts';
import { repairedAudioSource } from '../lib/audio-repairs.ts';

export function buildWordListening({includeNew = true} = {}) {
  const entries = new Map();
  function add(text, source) {
    const key = singleSpokenWord(text);
    if (!key || !source) return;
    const src = typeof source === 'string' ? repairedAudioSource(source) : source;
    const path = typeof src === 'string' ? src : src.src;
    if (isWithdrawnAudio(path)) return;
    assert(!path.includes('..') && /^\/(?!\/)[a-zA-Z0-9_./-]+\.(wav|mp3|ogg|m4a|bin)$/.test(path), path);
    if (typeof src !== 'string') assert(Number.isSafeInteger(src.offset) && src.offset >= 0 && Number.isSafeInteger(src.length) && src.length >= 10 && src.length <= 262144);
    const sources = entries.get(key) ?? [];
    if (!sources.some(item => JSON.stringify(item) === JSON.stringify(src))) sources.push(src);
    entries.set(key, sources);
  }
  for (const word of allPackageWords) if (word.audioStatus !== 'rejected') add(word.word, word.audio);
  for (const file of ['klink-audio-bindings', 'klink-synonym-audio', 'klink-word-use-audio']) {
    for (const row of Object.values(JSON.parse(readFileSync(`data/${file}.json`)))) {
      if (row.role === 'target' && row.review === 'approved' && row.metadataApproved && row.voiceId) add(row.transcript, row.src);
    }
  }
  const publication = JSON.parse(readFileSync('data/klink-word-audio-publication-20261101.json'));
  assert(publication.approvedBy === 'Nico' && publication.publicationApproved);
  const published = new Set(publication.bindings.map(row => `${singleSpokenWord(row.word)}\0${row.src}`));
  for (const row of JSON.parse(readFileSync('data/klink-inline-word-audio.json'))) {
    if (row.role === 'target' && row.metadataApproved && row.voiceId && row.humanReview !== 'rejected' && published.has(`${singleSpokenWord(row.word)}\0${row.src}`)) add(row.word,row.src);
  }
  const reviewed = JSON.parse(readFileSync('data/klink-word-audio-twenty-reviewed-20261101.json'));
  assert(reviewed.approvedBy === 'Nico' && reviewed.publicationApproved);
  for (const row of reviewed.clips) if (row.role === 'target' && row.humanReview === 'approved' && row.metadataApproved && row.voiceId) add(row.word, row.src);
  for (const row of includeNew ? Object.values(JSON.parse(readFileSync('data/klink-word-listening-audio.json'))) : []) {
    if (row.role === 'target' && row.technicalApproved && row.metadataApproved && row.voiceId) add(row.transcript, row.source);
  }
  const sounds = JSON.parse(readFileSync('data/klink-sounds.json')).sounds;
  for (const [spelling, sound] of Object.entries(sounds)) if (sound.audio) add(spelling, sound.audio);
  add('ij', sounds.ei.audio); add('ou', sounds.au.audio);
  // These are the explicit syllable divisions in klink-learning-rules.json.
  for (const [spelling, word] of [['bus-sen', 'bussen'], ['bo-men', 'bomen']]) {
    assert(entries.has(word), `Missing syllable model: ${word}`);
    entries.set(spelling, [...entries.get(word)]);
  }
  return Object.fromEntries([...entries].sort(([a], [b]) => a.localeCompare(b, 'nl')));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const file = 'data/klink-word-listening.json', expected = JSON.stringify(buildWordListening(), null, 2) + '\n';
  if (process.argv.includes('--check')) assert.equal(readFileSync(file, 'utf8'), expected, 'Rebuild the word-listening index after changing word recordings.');
  else writeFileSync(file, expected);
  console.log(`Word-listening index: ${Object.keys(JSON.parse(expected)).length} exact words.`);
}
