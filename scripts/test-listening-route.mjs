import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { playMedia, stopMedia } from '../lib/media-player.ts';
import { klinkContexts } from '../lib/klink-context.ts';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import instructions from '../data/klink-instructions.json' with { type: 'json' };

let audio, creations = 0, fail = false;
globalThis.Audio = class extends EventTarget {
  constructor() { super(); audio = this; creations++; }
  play() { this.paused = false; return fail ? Promise.reject(new Error('autoplay denied')) : Promise.resolve(); }
  pause() { this.paused = true; }
};
test('Playback waits for actual completion, handles denial/errors, cancels, and reuses the unlocked element', async () => {
  const pending = playMedia('/one.mp3', { waitUntilEnd: true });
  let resolved = false; void pending.then(() => { resolved = true; });
  await Promise.resolve(); assert.equal(resolved, false);
  const controller = new AbortController();
  const next = playMedia('/two.mp3', { waitUntilEnd: true, signal: controller.signal });
  assert.equal(await pending, false); assert.equal(creations, 1);
  controller.abort(); assert.equal(await next, false); assert(audio.paused);
  fail = true; await assert.rejects(playMedia('/three.mp3'), /autoplay denied/);
  fail = false;
  const lateError = playMedia('/four.mp3', { waitUntilEnd: true });
  await Promise.resolve(); audio.dispatchEvent(new Event('error'));
  await assert.rejects(lateError, /audio unavailable/);
  const completed = playMedia('/five.mp3', { waitUntilEnd: true });
  audio.dispatchEvent(new Event('ended')); assert.equal(await completed, true);
  const stopped = playMedia('/six.mp3', { waitUntilEnd: true });
  stopMedia(); assert.equal(await stopped, false); assert(audio.paused);
  assert.equal(await playMedia('/seven.mp3', { signal: controller.signal }), false);
});
test('Eight sentences and four situations reuse exact authored Taalroute text and audio without fabricated approval', () => {
  const prior = JSON.parse(readFileSync('lib/package-content.generated.json')).flatMap(pack => pack.exercises).flatMap(item => item.textBlocks ?? []);
  assert.equal(klinkContexts.filter(item => item.kind === 'sentence').length, 8);
  assert.equal(klinkContexts.filter(item => item.kind === 'situation').length, 4);
  for (const item of klinkContexts) {
    assert(prior.some(block => block.text === item.text && block.audio?.src === item.audio), item.id);
    assert(existsSync(`public${item.audio}`));
    const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', `public${item.audio}`])).format.tags;
    assert.equal(tags.artist, 'Taalroute'); assert(['Klink - Taalroute', 'Taalroute Klink'].includes(tags.album));
    assert.equal(tags.album_artist, 'Taalroute');
    assert(!/suno|openai|elevenlabs|generator/i.test(JSON.stringify(tags)));
    if (item.image) assert(existsSync(`public${item.image}`));
    assert.equal(item.independentReading, false); assert.equal(item.humanReview, 'open');
    assert(packs.some(pack => pack.exercises.some(exercise => exercise.contextId === item.id)), item.id);
  }
  for (const pack of packs) for (const lesson of pack.lessons) {
    const route = exercisesForLesson(pack, lesson);
    for (const exercise of route.filter(item => item.contextId)) {
      assert.equal(exercise.phase, 'use'); assert.equal(exercise.assessment, 'participation');
      assert.equal(exercise.requiresAudio, true); assert.equal(exercise.independentReading, false);
      const index = route.indexOf(exercise);
      assert(route.slice(0, index).some(item => item.mode === 'model' && item.wordId === exercise.wordId));
    }
  }
});
test('Every active mode has a separate-voice instruction script; absent recordings stay explicit', () => {
  assert.notEqual(instructions.voiceId, instructions.targetVoiceId);
  for (const mode of new Set(packs.flatMap(pack => pack.exercises.map(item => item.mode)))) {
    assert.equal(instructions.items.filter(item => item.modes.includes(mode)).length, 1, mode);
  }
  for (const instruction of instructions.items) {
    if (typeof instruction.src === 'string') assert(existsSync('public' + instruction.src));
    if (instruction.text.includes('Controleer')) assert(instruction.modes.every(mode => ['word-dictation', 'copy-word'].includes(mode)));
  }
});
