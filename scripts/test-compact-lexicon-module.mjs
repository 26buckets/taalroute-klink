import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { compactLexiconModule, compactLexiconPlugin } from './compact-lexicon-module.mjs';

const source = readFileSync('data/klink-lexicon-wordbuild-rest.json', 'utf8');
const original = JSON.parse(source);
function roundTrip(bank) {
  const code = compactLexiconModule(JSON.stringify(bank));
  const restored = runInNewContext(code.replace('export default ', 'globalThis.bank = ') + '\nbank;', {}, { timeout: 10000 });
  assert.equal(JSON.stringify(restored), JSON.stringify(bank), 'Every field, answer, source, order and character must survive');
  return { code, restored };
}
const { code, restored } = roundTrip(original);
assert(gzipSync(code).length < gzipSync(JSON.stringify(original)).length * 0.6);
const a = restored.packs[0].exercises[0], b = restored.packs[0].exercises[1];
const savedB = JSON.stringify(b), savedWord = JSON.stringify(restored.packs[0].words[0]);
a.prompt.text = 'test mutation'; a.tiles[0].token = 'changed'; a.vocabularyLevels.push('test');
assert.equal(JSON.stringify(b), savedB, 'Tasks must not share mutable template objects');
assert.equal(JSON.stringify(restored.packs[0].words[0]), savedWord);

const sample = () => ({ packs: [{ exercises: structuredClone(original.packs[0].exercises.slice(0, 2)) }] });
const variants = [
  task => { task.feedback = 'A different future instruction'; task.extraSource = { id: 'new', values: [null, false, 0] }; },
  task => { task.tiles[0].id = 'different-prefix:tile-0'; },
  task => { task.tiles[0].id = `${task.wordId}:tile-01`; },
  task => { task.tiles[0].extra = 'preserve'; },
  task => { task.slots.reverse(); task.answer.targetTileIds.reverse(); },
  task => { task.exampleWord = 'één 👩🏽‍🏫 \\ " </script>'; },
  task => { task.vocabularyLevels = null; },
  task => { delete task.tiles; },
  task => { task.mode = 'a-future-mode'; },
];
for (const change of variants) { const bank = sample(); change(bank.packs[0].exercises[1]); roundTrip(bank); }
roundTrip({ packs: [] }); roundTrip({ packs: [{ exercises: [] }] });
const plugin = compactLexiconPlugin();
assert.equal(plugin.apply, 'build');
assert.equal(plugin.transform('', '/data/another.json'), undefined);
assert.equal(plugin.transform('', '/data/klink-lexicon-wordbuild-rest.json?raw'), undefined);
const hash = value => createHash('sha256').update(value).digest('hex');
const result = { sourceSha256: hash(source), dataSha256: hash(JSON.stringify(original)), tasks: original.packs.reduce((n, pack) => n + pack.exercises.length, 0), compactTasks: (code.match(/exercise\(/g) ?? []).length - 1, originalBytes: Buffer.byteLength(JSON.stringify(original)), compactBytes: Buffer.byteLength(code), originalGzipBytes: gzipSync(JSON.stringify(original)).length, compactGzipBytes: gzipSync(code).length, exceptionalVariants: variants.length, exactRoundTrip: true, mutationIsolation: true };
writeFileSync('docs/first-download-20261105/lexicon-roundtrip.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
