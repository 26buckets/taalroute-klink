import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const user = process.argv[2];
assert(
  [
    'docent',
    'collega',
    'registrar',
    'beheerder',
    'cursist',
    'support',
  ].includes(user),
);
assert.equal(
  process.argv[3],
  '--reset',
  'Explicit reset required; re-enrollment revokes sessions and recovery codes',
);
const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
assert.equal(config.name, 'klink-inzicht-pr8-staging');
assert.deepEqual(config.routes, []);
assert.deepEqual(
  config.d1_databases.map((x) => x.database_id),
  ['95f1de18-0c61-46ca-b2af-5ee36543f67f'],
);
const args = [
  'd1',
  'execute',
  'INZICHT_DB',
  '--remote',
  '--config',
  'scripts/inzicht/online-config.json',
];
const rows = JSON.parse(
  execFileSync(
    'node_modules/.bin/wrangler',
    [
      ...args,
      '--command',
      `SELECT id FROM users WHERE id='${user}' AND auth_subject LIKE 'synthetic:%'`,
      '--json',
    ],
    { encoding: 'utf8' },
  ),
)[0].results;
assert.equal(rows.length, 1);
const sql = `UPDATE inzicht_sessions SET revoked=1 WHERE user_id='${user}'; DELETE FROM inzicht_mfa_challenges WHERE user_id='${user}'; DELETE FROM inzicht_mfa WHERE user_id='${user}'; INSERT INTO inzicht_auth_events VALUES ('${crypto.randomUUID()}','${user}','mfa_reset','${new Date().toISOString()}');`;
execFileSync('node_modules/.bin/wrangler', [...args, '--command', sql], {
  stdio: 'pipe',
});
const path = '.wrangler/inzicht-online-mfa.json';
try {
  const local = JSON.parse(readFileSync(path));
  delete local[user];
  writeFileSync(path, JSON.stringify(local, null, 2), { mode: 0o600 });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
console.log(
  'Fictional staging factor reset, sessions revoked; password login must enroll a new factor. No mail sent.',
);
