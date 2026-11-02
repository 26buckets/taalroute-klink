import test from 'node:test';
import assert from 'node:assert/strict';
import { playMedia, stopMedia } from '../lib/media-player.ts';
void test('Read-along follows media time and releases its animation callback on cancellation and completion', async () => {
  const originals = { Audio: globalThis.Audio, requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame };
  const frames = new Map(); let serial = 0, audio;
  globalThis.requestAnimationFrame = callback => { frames.set(++serial, callback); return serial; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  globalThis.Audio = class extends EventTarget {
    currentTime = 0;
    constructor() { super(); this.dataset = {}; audio = this; }
    play() { return Promise.resolve(); }
    pause() {}
  };
  try {
    const seen = [], controller = new AbortController();
    const playing = playMedia('/instruction.mp3', { waitUntilEnd: true, signal: controller.signal, onProgress: time => seen.push(time) });
    await Promise.resolve(); assert.deepEqual(seen, [0]);
    audio.currentTime = 1.25;
    const [id, frame] = frames.entries().next().value; frames.delete(id); frame();
    assert.deepEqual(seen, [0, 1.25]);
    controller.abort(); assert.equal(await playing, false); assert.equal(frames.size, 0);
    const next = playMedia('/next.mp3', { waitUntilEnd: true, onProgress: time => seen.push(time) });
    await Promise.resolve(); audio.dispatchEvent(new Event('ended'));
    assert.equal(await next, true); assert.equal(frames.size, 0);
  } finally { stopMedia(); Object.assign(globalThis, originals); }
});
