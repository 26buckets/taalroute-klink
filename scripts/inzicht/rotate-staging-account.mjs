import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { passwordHash } from '../../lib/inzicht/auth.ts';
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
  'Choose one fictional staging account',
);
const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
assert.equal(
  config.d1_databases[0].database_id,
  '95f1de18-0c61-46ca-b2af-5ee36543f67f',
);
const file = '.wrangler/inzicht-online-credentials.json';
const accounts = JSON.parse(readFileSync(file));
assert.equal(accounts[user].email, `${user}@klink-test.invalid`);
const password = randomBytes(24).toString('base64url');
// Keep pending recovery material privately before changing the server.
writeFileSync(
  '.wrangler/inzicht-pending-rotation.json',
  JSON.stringify({ user, password }),
  { mode: 0o600 },
);
const sql = `UPDATE inzicht_credentials SET password_hash='${await passwordHash(password)}',updated_at='${new Date().toISOString()}' WHERE user_id='${user}'; UPDATE inzicht_sessions SET revoked=1 WHERE user_id='${user}'; DELETE FROM inzicht_mfa_challenges WHERE user_id='${user}'; INSERT INTO inzicht_auth_events VALUES ('${crypto.randomUUID()}','${user}','password_rotated','${new Date().toISOString()}');`;
writeFileSync('.wrangler/inzicht-rotate.sql', sql, { mode: 0o600 });
execFileSync(
  'node_modules/.bin/wrangler',
  [
    'd1',
    'execute',
    'INZICHT_DB',
    '--remote',
    '--config',
    'scripts/inzicht/online-config.json',
    '--file',
    '.wrangler/inzicht-rotate.sql',
  ],
  { stdio: 'pipe' },
);
accounts[user].password = password;
writeFileSync(file, JSON.stringify(accounts, null, 2), { mode: 0o600 });
console.log(
  'Fictional staging credential rotated; previous sessions revoked. No mail sent.',
);
