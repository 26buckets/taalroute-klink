import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDefaultAudioRate, DEFAULT_AUDIO_RATE, playMedia, stopMedia } from '../lib/media-player.ts';
import { isWithdrawnAudio } from '../lib/audio-policy.ts';

void test('Withdrawn explanation is blocked; task questions and words remain available', async () => {
  for (const source of ['/package-audio/instructions/extra-begrip.wav', '/audio/pb/instructie1.m4a', '/package-audio/comprehension/hulp-biet.wav']) {
    assert(isWithdrawnAudio(source));
    assert(isWithdrawnAudio(`https://klink.taalroute.nl${source}?v=2`));
    assert.equal(await playMedia(source), false);
  }
  assert.equal(isWithdrawnAudio('/package-audio/comprehension/vraag-biet.wav'), false);
  assert.equal(isWithdrawnAudio('/audio/pb/biet.m4a'), false);
});

void test('Default playback uses 0.85; isolated models retain their natural rate without changing other audio', async () => {
  assert.equal(DEFAULT_AUDIO_RATE, 0.85);
  assert.doesNotThrow(() => applyDefaultAudioRate(null));
  const ownRecording = { playbackRate: 1, defaultPlaybackRate: 1, preservesPitch: false };
  applyDefaultAudioRate(ownRecording);
  assert.deepEqual(ownRecording, { playbackRate: .85, defaultPlaybackRate: .85, preservesPitch: true });
  const originalAudio = globalThis.Audio;
  const played = [];
  let audio;
  globalThis.Audio = class extends EventTarget {
    constructor() { super(); this.dataset = {}; audio = this; }
    play() { played.push({ src: this.src, rate: this.playbackRate, defaultRate: this.defaultPlaybackRate, pitch: this.preservesPitch }); return Promise.resolve(); }
    pause() { this.paused = true; }
  };
  try {
    assert.equal(await playMedia('/word.wav'), true);
    audio.playbackRate = 1;
    const sentence = playMedia('/sentence.wav', { waitUntilEnd: true });
    audio.dispatchEvent(new Event('ended'));
    assert.equal(await sentence, true);
    const controller = new AbortController();
    const instruction = playMedia('/instruction.wav', { waitUntilEnd: true, signal: controller.signal });
    controller.abort(); assert.equal(await instruction, false);
    for (const event of played) { assert.equal(event.rate, .85); assert.equal(event.defaultRate, .85); assert.equal(event.pitch, true); }
    const sound = playMedia('/klank-audio/a.mp3', { playbackRate: 1, waitUntilEnd: true });
    assert.deepEqual(played.at(-1), { src: '/klank-audio/a.mp3', rate: 1, defaultRate: 1, pitch: true });
    stopMedia(); assert.equal(await sound, false);
    await playMedia('/word-again.wav');
    assert.equal(played.at(-1).rate, .85);
  } finally { stopMedia(); globalThis.Audio = originalAudio; }
});
