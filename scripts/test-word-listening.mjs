import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { buildWordListening } from './build-word-listening.mjs';
import { normalizeSpokenWord, singleSpokenWord, spokenWords } from '../lib/word-listening-text.ts';
import { recordingForWord, fetchWordRecording, wordRecordingKey } from '../lib/word-listening.ts';
import { repairedAudioSource } from '../lib/audio-repairs.ts';
import { allPackageWords } from '../lib/package-content.ts';
import { isWithdrawnAudio } from '../lib/audio-policy.ts';
import { imageListeningWords, imageWordRectangle } from '../lib/image-word-listening.ts';
import { createHash } from 'node:crypto';

test('Dutch word boundaries preserve accents, contractions and compounds', () => {
  const text = "‘Kijk’, zei René: ’s-morgens e‑mail, café en 5.127 woorden.";
  const words = spokenWords(text);
  assert.deepEqual(words.map(word => word.key), ['kijk', 'zei', 'rené', "'s-morgens", 'e-mail', 'café', 'en', '5.127', 'woorden']);
  for (const word of words) assert.equal(text.slice(word.start, word.end), word.text);
  assert.equal(normalizeSpokenWord('CAFE\u0301'), 'café');
  assert.deepEqual(spokenWords('2e, 3de en 14B').map(word=>word.key),['2e','3de','en','14b']);
  assert.deepEqual(spokenWords('Ditismijnleesboek.').map(word => [word.text, word.start, word.end]), [['Dit',0,3],['is',3,5],['mijn',5,9],['leesboek',9,17]]);
});

test('A phrase recording is never presented as the sound of an individual word', () => {
  assert.equal(singleSpokenWord('het boek'), undefined);
  assert.equal(singleSpokenWord('boek (lezen)'), undefined);
  assert.equal(singleSpokenWord('Boek.'), 'boek');
});

test('All twenty newly published reviewed word forms keep their native recording', () => {
  const index = buildWordListening();
  const reviewed = JSON.parse(readFileSync('data/klink-word-audio-twenty-reviewed-20261101.json'));
  const pool = JSON.parse(readFileSync('data/klink-word-listening-audio.json'));
  for (const clip of reviewed.clips) {
    assert.equal(index[clip.word][0], clip.src, clip.word);
    assert.equal(pool[clip.word], undefined, 'Do not publish a duplicate model: ' + clip.word);
  }
});

test('Image words retain their exact source and account for contained image margins', () => {
  const images = JSON.parse(readFileSync('data/klink-image-word-listening.json'));
  for (const [source, image] of Object.entries(images)) {
    assert.equal(createHash('sha256').update(readFileSync('public' + image.original)).digest('hex'), image.sha256);
    assert.deepEqual(imageListeningWords(source), image.words);
    for (const word of image.words) assert(word.box.length === 4 && word.box.every(n => n >= 0 && n <= 1) && word.box[0] < word.box[2] && word.box[1] < word.box[3]);
  }
  assert.deepEqual(imageWordRectangle({left: 10, top: 20, width: 440, height: 360}, 1254, 1254, 'contain', [0,0,1,1]), {left:50,right:410,top:20,bottom:380});
  assert.deepEqual(imageListeningWords('/an-unknown-picture.png'), []);
});

test('All existing single-word recordings remain available without stemming or guessed spellings', () => {
  for (const word of allPackageWords) {
    if (!singleSpokenWord(word.word) || word.audioStatus === 'rejected' || isWithdrawnAudio(word.audio)) continue;
    const source = repairedAudioSource(word.audio);
    assert.equal(recordingForWord(word.word, source), source, word.id);
  }
  assert(recordingForWord('KOK'));
  assert.notEqual(recordingForWord('kok'), recordingForWord('keuken'));
  assert.equal(recordingForWord('onbestaandcontrolewoord'), undefined);
  assert.equal(recordingForWord('constructor'), undefined);
  assert.equal(recordingForWord('__proto__'), undefined);
});

test('The index is reproducible and contains only existing allowed recording paths', () => {
  const index = JSON.parse(readFileSync('data/klink-word-listening.json'));
  assert.deepEqual(index, buildWordListening());
  assert(Object.keys(index).length >= 5126);
  for (const [word, sources] of Object.entries(index)) {
    assert.equal(normalizeSpokenWord(word), word);
    assert.equal(new Set(sources.map(wordRecordingKey)).size, sources.length);
    assert(sources.every(source => {
      const path = typeof source === 'string' ? source : source.src;
      return !isWithdrawnAudio(path) && path.startsWith('/') && !path.includes('..');
    }));
  }
});

test('Packed recordings require the exact byte range and retain a full-response fallback', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  const bytes = Buffer.from('ID3complete-word-recording');
  const source = {src:'/package-audio/word-listening-20261101/words-0123456789abcdef.bin',offset:12,length:bytes.length};
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, source.src);
    assert.equal(options.headers.Range, `bytes=12-${11+bytes.length}`);
    assert.equal(options.signal, controller.signal);
    return new Response(bytes, {status:206,headers:{'Content-Range':`bytes 12-${11+bytes.length}/${12+bytes.length}`}});
  };
  assert.deepEqual(Buffer.from(await (await fetchWordRecording(source, controller.signal)).arrayBuffer()), bytes);
  globalThis.fetch = async () => new Response(Buffer.concat([Buffer.alloc(12),bytes]));
  assert.deepEqual(Buffer.from(await (await fetchWordRecording(source, controller.signal)).arrayBuffer()), bytes);
  for (const response of [new Response(bytes,{status:206}),new Response(bytes,{status:206,headers:{'Content-Range':'bytes 0-3/4'}}),new Response('ID3short'),new Response(bytes,{status:404}),new Response(Buffer.alloc(bytes.length),{status:206,headers:{'Content-Range':`bytes 12-${11+bytes.length}/${12+bytes.length}`}})]) {
    globalThis.fetch = async () => response;
    await assert.rejects(fetchWordRecording(source, controller.signal));
  }
  let fetched = false;
  globalThis.fetch = async () => { fetched = true; throw new Error('unexpected fetch'); };
  for (const invalid of [{...source,src:'https://another.example/a.bin'},{...source,offset:-1},{...source,offset:1.5},{...source,length:262145}]) await assert.rejects(fetchWordRecording(invalid,controller.signal));
  assert.equal(fetched,false);
});
