import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDefaultAudioRate, DEFAULT_AUDIO_RATE, playMedia, stopMedia } from '../lib/media-player.ts';
import { isWithdrawnAudio } from '../lib/audio-policy.ts';

test('Withdrawn explanation is blocked; task questions and words remain available', async () => {
  for (const source of ['/package-audio/instructions/extra-begrip.wav', '/audio/pb/instructie1.m4a', '/package-audio/comprehension/hulp-biet.wav']) {
    assert(isWithdrawnAudio(source));
    assert(isWithdrawnAudio(`https://klink.taalroute.nl${source}?v=2`));
    assert.equal(await playMedia(source), false);
  }
  assert.equal(isWithdrawnAudio('/package-audio/comprehension/vraag-biet.wav'), false);
  assert.equal(isWithdrawnAudio('/audio/pb/biet.m4a'), false);
});

test('Every playback uses 0.85, retains pitch and can still finish or be cancelled', async () => {
  assert.equal(DEFAULT_AUDIO_RATE, 0.85);
  assert.doesNotThrow(() => applyDefaultAudioRate(null));
  const ownRecording = { playbackRate: 1, defaultPlaybackRate: 1, preservesPitch: false };
  applyDefaultAudioRate(ownRecording);
  assert.deepEqual(ownRecording, { playbackRate: .85, defaultPlaybackRate: .85, preservesPitch: true });
  const originalAudio = globalThis.Audio;
  const played = [];
  let audio;
  globalThis.Audio = class extends EventTarget {
    constructor() { super(); audio = this; }
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
  } finally { stopMedia(); globalThis.Audio = originalAudio; }
});
