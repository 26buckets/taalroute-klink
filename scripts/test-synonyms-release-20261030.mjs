import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { assertSynonymAudio } from './check-synonyms-release-20261030.mjs';
import { allPackageWords } from '../lib/package-content.ts';
const bank = JSON.parse(execFileSync('git', ['show', 'bfef2c3d813e00d9dc5fc313c72c8f453e991a1e:data/klink-synonyms.json']));
import bindings from '../data/klink-synonym-audio.json' with { type: 'json' };
const clips = JSON.parse(readFileSync('docs/synonyms-20261030/audio.json'));
const originalBindings = Object.fromEntries(clips.map(clip => [`synonym-word:${clip.word}`, bindings[`synonym-word:${clip.word}`]]));

test('only the 68 missing synonym words are added, with checked brand metadata and the exact target voice', () => {
  assertSynonymAudio(clips, originalBindings);
  const existing = new Set(allPackageWords.filter(word => word.audio).map(word => word.word.toLocaleLowerCase('nl')));
  const missing = [...new Set(bank.entries.flatMap(entry => [entry.word, entry.synonym]))].filter(word => !existing.has(word.toLocaleLowerCase('nl')));
  assert.deepEqual(new Set(clips.map(clip => clip.word)), new Set(missing));
});

test('incomplete, mismatched, unbranded and falsely human-approved recordings are rejected', () => {
  for (const change of [
    rows => rows.pop(), rows => rows[0].voiceId = 'another-voice', rows => rows[0].role = 'instruction',
    rows => rows[0].humanReview = 'approved', rows => rows[0].metadata.publisher = 'other',
    rows => rows[0].metadata.title = 'other', rows => rows[0].audioPacketsUnchanged = false,
  ]) {
    const changed = structuredClone(clips); change(changed); assert.throws(() => assertSynonymAudio(changed, originalBindings));
  }
  const changed = structuredClone(originalBindings); changed[`synonym-word:${clips[0].word}`].transcript = 'another word';
  assert.throws(() => assertSynonymAudio(clips, changed));
});
