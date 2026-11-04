import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const round = Number(process.argv[2]);
assert(Number.isInteger(round) && round >= 1 && round <= 3);
const out = `docs/staging-document-wait-20261104/final-requests-round-${round}.json`;
const rows = [], temp = mkdtempSync(join(tmpdir(), 'klink-staging-timing-'));
try {
  for (let repeat = 0; repeat < 8; repeat++) {
    const versions = (repeat + round) % 2 ? ['baseline', 'candidate'] : ['candidate', 'baseline'];
    for (const version of versions) for (const path of ['/', '/release.json']) {
      const id = `final-r${round}-${version}-${repeat}-${path === '/' ? 'page' : 'asset'}`;
      const url = `https://klink-pr12-${version}.nico-554.workers.dev${path}`;
      const startedAt = Date.now();
      const command = spawnSync('curl', ['--silent', '--show-error', '--max-time', '30', '--dump-header', temp + '/headers', '--output', '/dev/null', '--header', 'x-klink-perf:pr12-staging-20261104', '--header', `x-klink-measure-id:${id}`, '--write-out', '%{json}', url], { encoding: 'utf8' });
      const result = JSON.parse(command.stdout || '{}');
      const endedAt = Date.now();
      const headers = Object.fromEntries(readFileSync(temp + '/headers', 'utf8').split(/\r?\n/).filter(line => /^(?:cache-control|x-vinext-cache|cf-ray|cf-cache-status|server-timing|content-type|x-vinext-build-id):/i.test(line)).map(line => { const colon = line.indexOf(':'); return [line.slice(0, colon).toLowerCase(), line.slice(colon + 1).trim()]; }));
      rows.push({ exitCode: command.status, error: command.stderr.trim() || null, id, round, repeat, version, path, startedAt, endedAt, status: result.http_code, protocol: result.http_version, dnsMs: result.time_namelookup * 1000, connectedMs: result.time_connect * 1000, tlsMs: result.time_appconnect * 1000, pretransferMs: result.time_pretransfer * 1000, firstByteMs: result.time_starttransfer * 1000, totalMs: result.time_total * 1000, headers });
      writeFileSync(out, JSON.stringify({ conditions: 'Fresh curl process/TLS connection per request; alternating paired versions; same machine/network; anonymous public HTML plus static-file control; no retry or warmup; round identifies a newly deployed environment version.', rows }, null, 2) + '\n');
      assert.equal(command.status, 0, id);
      assert.equal(result.http_code, 200, id);
      if (version === 'candidate' && path === '/') assert.equal(headers['x-vinext-cache'], 'HIT', id);
      console.log(id, Math.round(result.time_starttransfer * 1000), headers['x-vinext-cache'] || headers['cf-cache-status']);
    }
  }
} finally { rmSync(temp, { recursive: true, force: true }); }
