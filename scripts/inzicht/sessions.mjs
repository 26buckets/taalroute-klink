import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { hash } from '../../lib/inzicht/rules.ts';
assert(
  existsSync('.wrangler/inzicht-initialized'),
  'Initialize local staging first',
);
const args = [
  'd1',
  'execute',
  'INZICHT_DB',
  '--local',
  '--config',
  '.wrangler/inzicht-local.json',
  '--persist-to',
  '.wrangler/state',
];
const records = JSON.parse(
  execFileSync(
    'node_modules/.bin/wrangler',
    [...args, '--command', 'SELECT id,auth_subject FROM users', '--json'],
    { encoding: 'utf8' },
  ),
)[0].results;
assert(
  records.length > 0 &&
    records.every((r) => r.auth_subject === `synthetic:${r.id}`),
  'Only synthetic fixture identities allowed',
);
const tokens = {},
  sql = ['DELETE FROM inzicht_sessions;'];
for (const r of records) {
  assert(/^[a-z]+$/.test(r.id));
  tokens[r.id] = randomBytes(32).toString('hex');
  sql.push(
    `INSERT INTO inzicht_sessions VALUES ('${await hash(tokens[r.id])}','${r.id}','${new Date(Date.now() + 8 * 3600000).toISOString()}',0);`,
  );
}
writeFileSync('.wrangler/inzicht-renew.sql', sql.join('\n'), { mode: 0o600 });
execFileSync(
  'node_modules/.bin/wrangler',
  [...args, '--file', '.wrangler/inzicht-renew.sql'],
  { stdio: 'pipe' },
);
writeFileSync(
  '.wrangler/inzicht-credentials.json',
  JSON.stringify(tokens, null, 2),
  { mode: 0o600 },
);
console.log(
  'Local test sessions renewed for 8 hours; educational data unchanged. Tokens remain in the ignored credentials file.',
);
