import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fixtures } from './fixtures.mjs';
import { passwordHash } from '../../lib/inzicht/auth.ts';
const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
assert.equal(config.name, 'klink-inzicht-pr8-staging');
assert.equal(config.d1_databases.length, 1);
assert.equal(
  config.d1_databases[0].database_id,
  '95f1de18-0c61-46ca-b2af-5ee36543f67f',
);
assert.deepEqual(config.routes, []);
const args = [
  'd1',
  'execute',
  'INZICHT_DB',
  '--remote',
  '--config',
  'scripts/inzicht/online-config.json',
];
const query = (sql) =>
  JSON.parse(
    execFileSync(
      'node_modules/.bin/wrangler',
      [...args, '--command', sql, '--json'],
      { encoding: 'utf8' },
    ),
  )[0].results;
const version = query(
  "SELECT name FROM sqlite_master WHERE name='inzicht_schema'",
).length
  ? query('SELECT MAX(version) AS v FROM inzicht_schema')[0].v
  : 0;
for (const file of readdirSync('db/migrations/inzicht')
  .filter((f) => f.endsWith('.sql') && Number(f.slice(0, 4)) > version)
  .sort())
  execFileSync(
    'node_modules/.bin/wrangler',
    [...args, '--file', `db/migrations/inzicht/${file}`],
    { stdio: 'inherit' },
  );
assert.equal(
  query('SELECT COUNT(*) AS n FROM users')[0].n,
  0,
  'Existing data must not be reseeded',
);
assert(
  !existsSync('.wrangler/inzicht-online-credentials.json'),
  'Keep existing account recovery file',
);
const fixture = await fixtures();
const accounts = {};
const sql = [fixture.sql, 'DELETE FROM inzicht_sessions;'];
for (const user of Object.keys(fixture.credentials)) {
  const password = randomBytes(24).toString('base64url');
  const email = `${user}@klink-test.invalid`;
  accounts[user] = { email, password };
  sql.push(
    `INSERT INTO inzicht_credentials VALUES ('${user}','${email}','${await passwordHash(password)}','${new Date().toISOString()}');`,
  );
}
writeFileSync(
  '.wrangler/inzicht-online-credentials.json',
  JSON.stringify(accounts, null, 2),
  { mode: 0o600 },
);
writeFileSync('.wrangler/inzicht-online-seed.sql', sql.join('\n'), {
  mode: 0o600,
});
execFileSync(
  'node_modules/.bin/wrangler',
  [...args, '--file', '.wrangler/inzicht-online-seed.sql'],
  { stdio: 'inherit' },
);
assert.equal(query('SELECT COUNT(*) AS n FROM inzicht_credentials')[0].n, 6);
assert.equal(query('SELECT COUNT(*) AS n FROM inzicht_sessions')[0].n, 0);
console.log(
  'Six fictional accounts provisioned; private local credentials retained, no mail sent.',
);
