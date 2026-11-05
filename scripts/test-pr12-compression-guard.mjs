import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const temp = mkdtempSync(join(tmpdir(), 'klink-compression-guard-'));
try {
  mkdirSync(temp + '/server');
  const config = JSON.parse(readFileSync('dist/server/pr12-staging.wrangler.json'));
  for (const [name, variant] of [['taalroute-klink', 'candidate'], ['taalroute-klink', 'baseline'], ['klink-pr12-candidate', 'baseline'], ['klink-pr12-baseline', 'candidate'], ['klink-pr12-candidate', 'production']]) {
    writeFileSync(temp + '/server/pr12-staging.wrangler.json', JSON.stringify({ ...config, name }));
    const result = spawnSync(process.execPath, ['scripts/prepare-pr12-compression.mjs', temp, temp + '/evidence.json', variant], { encoding: 'utf8' });
    assert.notEqual(result.status, 0, `${name}/${variant} must be rejected`);
    assert.match(result.stderr, /AssertionError/);
    assert.deepEqual(readdirSync(temp + '/server'), ['pr12-staging.wrangler.json'], 'Reject before writing build files');
  }
  console.log('PASS five production/wrong-host preparation guards; no files generated');
} finally { rmSync(temp, { recursive: true, force: true }); }
