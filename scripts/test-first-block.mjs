import assert from 'node:assert/strict';
import fs from 'node:fs';
import { advance, firstBlock, freshCheckpoint, parseCheckpoint, wordMatch, freshWordMatch, parseWordMatch } from '../lib/first-block.ts';
import { BlockAudio } from '../lib/first-block-audio.ts';

const renderer = fs.readFileSync(new URL('../components/product/first-block.tsx', import.meta.url), 'utf8');
assert(!renderer.includes("'tas', 't'"), 'Teacher-rejected t must not re-enter the listening sequence');
assert(!fs.existsSync(new URL('../public/start-tas/t.wav', import.meta.url)), 'Rejected t is quarantined, not delivered');

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
assert.notEqual(wordMatch.id, firstBlock.id, 'The new block must not overwrite the listening checkpoint');
assert.equal(wordMatch.trials.length, firstBlock.trials.length, 'Both rounds share the progression contract');
assert.equal(parseWordMatch(JSON.stringify(freshCheckpoint())), null);
assert.deepEqual(parseWordMatch(JSON.stringify(freshWordMatch())), freshWordMatch());
let match = freshWordMatch();
const matchingTargets = ['tas'];
for (let i = 0; i < wordMatch.trials.length; i++) {
  match = advance(match);
  matchingTargets.push(wordMatch.trials[match.trial].target);
}
assert.deepEqual(matchingTargets, ['tas', 'mat', 'tas', 'mat']);
assert.equal(advance(match).step, 'done');
for (const trial of wordMatch.trials) assert.deepEqual([...trial.options].sort(), ['mat', 'tas']);
assert.deepEqual(wordMatch.trials.map(t => t.options.indexOf(t.target)), [1, 1, 0]);

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
