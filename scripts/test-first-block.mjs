import assert from 'node:assert/strict';
import { advance, firstBlock, freshCheckpoint, parseCheckpoint } from '../lib/first-block.ts';
import { BlockAudio } from '../lib/first-block-audio.ts';

assert.equal(parseCheckpoint('bad-json'), null);
assert.equal(parseCheckpoint('{"version":1,"step":"choose","trial":99,"events":[]}'), null);
assert.deepEqual(parseCheckpoint(JSON.stringify(freshCheckpoint())), freshCheckpoint());
assert.deepEqual(parseCheckpoint(JSON.stringify({ ...freshCheckpoint(), events: [null, { kind: 'unknown' }] })).events, []);
let p = freshCheckpoint();
const visited = [p.step];
for (let i = 0; i < 6; i++) { p = advance(p); visited.push(`${p.step}:${p.trial}`); }
assert.deepEqual(visited, ['tas', 'mat:0', 'model:0', 'choose:0', 'choose:1', 'choose:2', 'done:2']);
assert.equal(advance(p), p);
for (const trial of firstBlock.trials) {
  assert.equal(trial.options.filter(id => id === trial.target).length, 1);
  assert.equal(trial.options.length, 2);
}

const made = [];
class FakeAudio {
  constructor(src) { this.src = src; made.push(this); }
  async play() {}
  pause() { this.paused = true; }
}
globalThis.Audio = FakeAudio;
const player = new BlockAudio();
const tick = () => new Promise(resolve => setImmediate(resolve));
const playback = player.play(['one', 'two']);
assert.equal(made.length, 1);
await tick();
assert.equal(made.length, 1, 'play resolution must not advance a sequence');
made[0].onended(); await tick();
assert.equal(made[1].src, 'two');
made[1].onended(); assert.equal(await playback, true);
const cancelled = player.play(['three', 'never']);
player.stop(); assert.equal(await cancelled, false);
assert.equal(made.length, 3);
const first = player.play(['old']);
const second = player.play(['new']);
assert.equal(await first, false);
made.at(-1).onended(); assert.equal(await second, true);
const failed = player.play(['missing']);
made.at(-1).onerror(); await assert.rejects(failed, /Geluid/);
player.stop();
console.log('PASS: checkpoints, bounded events, content, full progression, audio ended/cancel/replay/error.');
