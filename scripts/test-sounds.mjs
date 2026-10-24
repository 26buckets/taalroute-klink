import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import reference from '../data/klink-sounds.json' with { type: 'json' };
import { soundCards, soundById, soundsForWord, wordsForSound, lessonForSoundWord, klankstudioUrl, soundHash } from '../lib/sounds.ts';
import { allPackageWords, lessonPackages } from '../lib/package-content.ts';
import { isWithdrawnAudio } from '../lib/audio-policy.ts';

test('All 46 canonical poster cards have one group, their own spelling and valid source links', () => {
  assert.equal(soundCards.length, 46);
  const grouped = reference.groups.flatMap(group => group.items);
  assert.equal(new Set(grouped).size, soundCards.length);
  assert.deepEqual([...grouped].sort(), soundCards.map(sound => sound.id).sort());
  assert.equal(soundById.get('a').example, 'kat');
  assert.equal(soundById.get('aa').example, 'maan');
  assert.equal(soundById.get('ei').label, 'ei / ij');
  assert.equal(soundById.get('au').label, 'au / ou');
  assert.equal(soundById.get('sjwa').label, 'e');
  assert.notEqual(soundById.get('sjwa').group.id, soundById.get('e').group.id);
  for (const sound of soundCards) {
    assert.equal(new URL(klankstudioUrl(sound.id)).searchParams.get('sound'), sound.id);
    assert.equal(soundHash(sound.id), `#learner/sounds/${sound.id}`);
    assert(sound.group.posterColor && sound.group.line && sound.group.soft);
  }
});

test('Sound references use source reading units in word order; no substring guesses or spelling-value substitutions', () => {
  assert.deepEqual(soundsForWord('klink-woord-mat').map(sound => sound.id), ['m', 'a', 't']);
  assert.deepEqual(soundsForWord('klink-woord-tas').map(sound => sound.id), ['t', 'a', 's']);
  assert.deepEqual(soundsForWord('klink-woord-maan').map(sound => sound.id), ['m', 'aa', 'n']);
  assert.deepEqual(soundsForWord('klink-woord-bed'), []);
  assert.deepEqual(soundsForWord('klink-woord-bomen'), []);
  assert.deepEqual(soundsForWord('unknown'), []);
});

test('Word links open the existing lesson with intact registered audio and no new media bindings', () => {
  const original = JSON.stringify(allPackageWords);
  assert(wordsForSound(soundById.get('a')).some(word => word.word === 'mat'));
  assert(!wordsForSound(soundById.get('a')).some(word => word.word === 'maan'));
  for (const sound of soundCards) {
    const words = wordsForSound(sound);
    assert.equal(words.length, sound.words.length, sound.id);
    for (const word of words) {
      if (word.audio) { assert(existsSync(`public${word.audio}`)); assert(!isWithdrawnAudio(word.audio)); }
      const position = lessonForSoundWord(word.id);
      if (position) {
        const pack = lessonPackages.find(pack => pack.id === position.packageId);
        const lesson = pack.lessons.find(lesson => lesson.id === position.lessonId);
        assert(lesson.newWords.includes(word.id));
        assert.equal(lesson.guidedExerciseIds[0], position.exerciseId);
      }
    }
  }
  assert.equal(JSON.stringify(allPackageWords), original);
});
