import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const rows = [], dir = mkdtempSync(join(tmpdir(), 'klink-diagnostic-'));
try {
  for (let repeat = 0; repeat < 6; repeat++) for (const path of repeat % 2 ? ['/', '/__staging-ping'] : ['/__staging-ping', '/']) {
    const id = `diag-candidate-${repeat}-${path === '/' ? 'page' : 'ping'}`, startedAt = Date.now();
    const command = spawnSync('curl', ['-sS', '--max-time', '30', '-D', dir + '/headers', '-o', '/dev/null', '-H', 'x-klink-perf:pr12-staging-20261104', '-H', 'x-klink-measure-id:' + id, '-w', '%{json}', 'https://klink-pr12-candidate.nico-554.workers.dev' + path], { encoding: 'utf8' });
    const result = JSON.parse(command.stdout || '{}');
    const headers = Object.fromEntries(readFileSync(dir + '/headers', 'utf8').split(/\r?\n/).filter(line => /^(?:x-vinext-cache|cf-ray|server-timing|cache-control):/i.test(line)).map(line => { const i = line.indexOf(':'); return [line.slice(0, i).toLowerCase(), line.slice(i + 1).trim()]; }));
    rows.push({ id, path, repeat, startedAt, endedAt: Date.now(), exitCode: command.status, status: result.http_code, ttfbMs: result.time_starttransfer * 1000, tlsMs: result.time_appconnect * 1000, headers });
    writeFileSync('docs/staging-document-wait-20261104/diagnostic-requests.json', JSON.stringify(rows, null, 2) + '\n');
    assert.equal(command.status, 0); assert.equal(result.http_code, 200);
    console.log(id, Math.round(rows.at(-1).ttfbMs), headers['server-timing']);
  }
} finally { rmSync(dir, { recursive: true, force: true }); }
