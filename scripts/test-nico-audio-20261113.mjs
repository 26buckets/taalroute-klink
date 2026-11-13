import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import reference from '../data/klink-sounds.json' with {type: 'json'};
import mapping from '../data/klink-nico-audio.json' with {type: 'json'};
import {soundCards, soundById, wordsForSound} from '../lib/sounds.ts';
import {allPackageWords} from '../lib/package-content.ts';
import {verifyNicoAudioRelease, nicoFolder} from './check-nico-audio-release-20261113.mjs';

await test('48 new sound recordings are reachable while every original word and recording is preserved', () => {
  const manifest = JSON.parse(readFileSync(nicoFolder + 'source-manifest.json'));
  const heard = new Set(), original = JSON.stringify(allPackageWords);
  for (const sound of soundCards) {
    assert.equal(sound.audio, mapping.sounds[sound.id]); heard.add(sound.audio);
    for (const item of sound.additionalAudio) heard.add(item.audio);
    const words = wordsForSound(sound);
    assert.equal(new Set(words.map(word => word.id)).size, words.length);
    assert.deepEqual(sound.words, reference.sounds[sound.id].words);
    for (const word of reference.sounds[sound.id].words) {
      const originalWord = allPackageWords.find(item => item.word === word && item.id.startsWith('klink-woord-')) ?? allPackageWords.find(item => item.word === word);
      assert.strictEqual(words.find(item => item.word === word), originalWord);
      assert(!words.find(item => item.word === word).audio?.includes('/nico-20261113/'));
    }
  }
  assert.equal(heard.size, 48);
  for (const row of manifest.files) {
    const path = `/klank-audio/nico-20261113/${row.stem}.mp3`;
    assert.equal(heard.has(path), row.type === 'klank', path);
    assert.equal(createHash('sha256').update(readFileSync('public' + path)).digest('hex'), row.mp3.sha256);
  }
  assert.deepEqual(soundById.get('ei').additionalAudio.map(row => row.label), ['ij']);
  assert.deepEqual(soundById.get('au').additionalAudio.map(row => row.label), ['ou']);
  assert.deepEqual(Object.keys(mapping.words.sjwa), ['de', 'lopen', 'vader']);
  assert.notEqual(mapping.words.e.pen, mapping.words.p.pen, 'Repeated words retain their source take');
  assert.equal(JSON.stringify(allPackageWords), original, 'Existing lesson content is never mutated');
});

await test('the new source-bound publication passes', () => assert(verifyNicoAudioRelease().publicationApproved));
const approvalPath = nicoFolder + 'approval.json';
for (const [field, value] of [['publicationApproved', false], ['liveSourceCommit', '0'.repeat(40)], ['liveWorkerVersion', 'unknown'], ['newMeteredServices', 1], ['humanListeningReview', 'approved']]) {
  await test('reject a changed ' + field, () => assert.throws(() => verifyNicoAudioRelease(path => path === approvalPath ? Buffer.from(JSON.stringify({...JSON.parse(readFileSync(path)), [field]: value})) : readFileSync(path))));
}
await test('reject an audio recording with changed bytes', () => assert.throws(() => verifyNicoAudioRelease(path => path === 'public' + mapping.sounds.a ? Buffer.concat([readFileSync(path), Buffer.from('changed')]) : readFileSync(path))));
await test('reject a mismatched sound or word mapping', () => assert.throws(() => verifyNicoAudioRelease(path => {
  if (path !== 'data/klink-nico-audio.json') return readFileSync(path);
  const changed = structuredClone(mapping); changed.words.a.kat = changed.words.aa.maan;
  return Buffer.from(JSON.stringify(changed));
})));
await test('reject an unrelated interface change', () => assert.throws(() => verifyNicoAudioRelease(path => path === 'components/product/sound-reference.tsx' ? Buffer.concat([readFileSync(path), Buffer.from('\n// changed')]) : readFileSync(path))));
