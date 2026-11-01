import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const path = '.wrangler/inzicht-mfa-key';
const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
assert.equal(config.name, 'klink-inzicht-pr8-staging');
assert.deepEqual(config.routes, []);
assert.equal(
  config.d1_databases[0].database_id,
  '95f1de18-0c61-46ca-b2af-5ee36543f67f',
);
const args = ['--config', 'scripts/inzicht/online-config.json'];
const secrets = JSON.parse(
  execFileSync('node_modules/.bin/wrangler', ['secret', 'list', ...args], {
    encoding: 'utf8',
  }),
);
const present = secrets.some((x) => x.name === 'INZICHT_MFA_KEY');
assert(
  !present || existsSync(path),
  'Never replace an existing key whose private recovery file is missing',
);
if (!existsSync(path))
  writeFileSync(path, randomBytes(32).toString('hex'), {
    mode: 0o600,
    flag: 'wx',
  });
chmodSync(path, 0o600);
const key = readFileSync(path, 'utf8');
assert(/^[a-f0-9]{64}$/.test(key));
if (!present)
  execFileSync(
    'node_modules/.bin/wrangler',
    ['secret', 'put', 'INZICHT_MFA_KEY', ...args],
    { input: key + '\n', stdio: ['pipe', 'pipe', 'pipe'] },
  );
console.log(
  present
    ? 'Existing MFA encryption secret preserved.'
    : 'MFA encryption secret installed only on the staging Worker; private local recovery file retained.',
);
