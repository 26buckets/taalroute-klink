import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2];
assert(input?.endsWith('/visits.json'));
const data = JSON.parse(readFileSync(input, 'utf8'));
assert.deepEqual(data.errors, []);
assert([32, 64].includes(data.rows.length));
const median = values => {
  assert(values.length && values.every(Number.isFinite));
  const sorted = values.toSorted((a, b) => a - b);
  return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2;
};
const rows = data.rows.filter(row => row.visit === 'first' && row.portal === 'learner');
const results = {};
for (const version of ['before', 'after']) {
  const selected = rows.filter(row => row.version === version);
  const samples = selected.map(row => {
    const scripts = row.resources.filter(resource => resource.path.endsWith('.js') && resource.endMs <= row.paintReadyMs);
    assert(scripts.length && scripts.every(script => script.encodedBodySize > 0), 'Fresh first visits must record real encoded script sizes');
    assert(!scripts.some(script => /klink-word-library-index-/.test(script.path)), 'Word library stays deferred');
    if (version === 'after') for (const bank of ['practice-source-bank', 'practice-word-bank']) assert(scripts.some(script => script.path.includes('/' + bank + '-')), 'Split banks must already be ready before the first usable screen');
    const largest = scripts.toSorted((a, b) => b.encodedBodySize - a.encodedBodySize)[0];
    return { engine: row.engine, width: row.width, repeat: row.repeat, largestScript: largest.path, largestEncodedBytes: largest.encodedBodySize, allScriptEncodedBytes: scripts.reduce((sum, script) => sum + script.encodedBodySize, 0), allScriptDecodedBytes: scripts.reduce((sum, script) => sum + script.decodedBodySize, 0), allScriptTransferBytes: scripts.reduce((sum, script) => sum + script.transferSize, 0), paintReadyMs: row.paintReadyMs };
  });
  results[version] = { n: samples.length, largestEncodedMedianBytes: median(samples.map(row => row.largestEncodedBytes)), allScriptEncodedMedianBytes: median(samples.map(row => row.allScriptEncodedBytes)), allScriptDecodedMedianBytes: median(samples.map(row => row.allScriptDecodedBytes)), paintReadyMedianMs: median(samples.map(row => row.paintReadyMs)), paintReadyMaxMs: Math.max(...samples.map(row => row.paintReadyMs)), samples };
}
writeFileSync(input.replace('/visits.json', '/download-summary.json'), JSON.stringify({ conditions: data.conditions, results }, null, 2) + '\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([version, { samples: _samples, ...summary }]) => [version, summary]))));
