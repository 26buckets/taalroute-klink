import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'docs/staging-document-wait-20261104';
const rows = [1, 2, 3].flatMap(round => JSON.parse(readFileSync(`${root}/final-requests-round-${round}.json`)).rows);
assert.equal(rows.length, 96);
assert(rows.every(row => row.status === 200 && row.exitCode === 0));
const median = values => { values.sort((a, b) => a - b); return (values[(values.length - 1) >> 1] + values[values.length >> 1]) / 2; };
const summarize = subset => ({ n: subset.length, medianMs: median(subset.map(row => row.firstByteMs)), maxMs: Math.max(...subset.map(row => row.firstByteMs)), over500Ms: subset.filter(row => row.firstByteMs > 500).length, over1000Ms: subset.filter(row => row.firstByteMs > 1000).length });
const result = {};
for (const version of ['baseline', 'candidate']) {
  const page = rows.filter(row => row.version === version && row.path === '/');
  result[version] = { page: summarize(page), firstPerVersion: summarize(page.filter(row => row.repeat === 0)), staticControl: summarize(rows.filter(row => row.version === version && row.path === '/release.json')), hit: page.filter(row => row.headers['x-vinext-cache'] === 'HIT').length, miss: page.filter(row => row.headers['x-vinext-cache'] === 'MISS').length, byRound: [1, 2, 3].map(round => ({ round, ...summarize(page.filter(row => row.round === round)) })) };
}
assert.equal(result.candidate.hit, 24, 'Prepared pages must not depend on warm per-instance caches');
writeFileSync(root + '/final-summary.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
