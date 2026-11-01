import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import { snapshot, restore, postgresSQL, verify } from './portable.mjs';
import { canonical } from '../../lib/inzicht/rules.ts';
const target = JSON.parse(readFileSync('scripts/inzicht/restore-config.json'));
assert.equal(
  target.d1_databases[0].database_id,
  '6bbdaabc-8098-4a75-91e5-96984382e7ee',
);
assert.equal(
  JSON.parse(readFileSync('scripts/inzicht/online-config.json')).d1_databases[0]
    .database_id,
  '95f1de18-0c61-46ca-b2af-5ee36543f67f',
);
const run = (args) =>
  execFileSync('node_modules/.bin/wrangler', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const targetArgs = [
  'd1',
  'execute',
  'RESTORE_DB',
  '--remote',
  '--config',
  'scripts/inzicht/restore-config.json',
];
const query = (sql) =>
  JSON.parse(run([...targetArgs, '--command', sql, '--json']));
const mfa = process.argv.includes('--mfa');
const dir = mfa ? '.wrangler/mfa-recovery' : '.wrangler/online-recovery';
mkdirSync(dir, { recursive: true, mode: 0o700 });
let bundle;
if (process.argv.includes('--verify-existing'))
  bundle = JSON.parse(readFileSync(`${dir}/snapshot.json`));
else {
  assert.equal(
    query(
      "SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='users'",
    )[0].results[0].n,
    0,
    'Restore target must be empty; never overwrite any current database',
  );
  assert(
    !existsSync(`${dir}/source.sqlite`),
    'Keep previous recovery evidence',
  );
  writeFileSync(`${dir}/source.sql`, '', { mode: 0o600 });
  run([
    'd1',
    'export',
    'INZICHT_DB',
    '--remote',
    '--config',
    'scripts/inzicht/online-config.json',
    '--output',
    `${dir}/source.sql`,
  ]);
  const source = new DatabaseSync(`${dir}/source.sqlite`);
  source.exec(readFileSync(`${dir}/source.sql`, 'utf8'));
  bundle = await snapshot(source);
  source.close();
  assert(!bundle.data.inzicht_credentials);
  assert(!bundle.data.inzicht_sessions);
  for (const table of [
    'inzicht_mfa',
    'inzicht_mfa_sessions',
    'inzicht_mfa_challenges',
    'inzicht_mfa_recovery',
    'inzicht_auth_events',
  ])
    assert(!bundle.data[table]);
  writeFileSync(`${dir}/snapshot.json`, JSON.stringify(bundle, null, 2), {
    mode: 0o600,
  });
  const restored = await restore(bundle, `${dir}/restored.sqlite`);
  restored.close();
  const sql = await postgresSQL(bundle);
  writeFileSync(`${dir}/postgres.sql`, sql, { mode: 0o600 });
  writeFileSync(
    `${dir}/remote-restore.sql`,
    sql.replace(/^BEGIN;\n/, '').replace(/\nCOMMIT;$/, ''),
    { mode: 0o600 },
  );
  run([...targetArgs, '--file', `${dir}/remote-restore.sql`]);
}
await verify(bundle);
const names = Object.keys(bundle.data);
const checks = names.map((t) => `SELECT * FROM "${t}";`).join('\n');
writeFileSync(`${dir}/check.sql`, checks, { mode: 0o600 });
const compare = () => {
  const actual = JSON.parse(
    run([...targetArgs, '--command', checks, '--json']),
  );
  assert.equal(actual.length, names.length);
  names.forEach((t, i) =>
    assert.deepEqual(
      actual[i].results.map(canonical).sort(),
      bundle.data[t].map(canonical).sort(),
      t,
    ),
  );
  assert.equal(query('PRAGMA foreign_key_check')[0].results.length, 0);
  assert.equal(
    query('SELECT COUNT(*) n FROM inzicht_sessions')[0].results[0].n,
    0,
  );
  assert.equal(
    query('SELECT COUNT(*) n FROM inzicht_credentials')[0].results[0].n,
    0,
  );
};
compare();
const bookmark = JSON.parse(
  run([
    'd1',
    'time-travel',
    'info',
    'RESTORE_DB',
    '--config',
    'scripts/inzicht/restore-config.json',
    '--json',
  ]),
).bookmark;
query("UPDATE groups SET name='Fictieve hersteltest gewijzigde naam'");
run([
  'd1',
  'time-travel',
  'restore',
  'RESTORE_DB',
  '--config',
  'scripts/inzicht/restore-config.json',
  '--bookmark',
  bookmark,
  '--json',
]);
compare();
writeFileSync(
  `docs/inzicht-20261101/evidence/${mfa ? 'mfa-' : ''}online-recovery.json`,
  JSON.stringify(
    {
      at: new Date().toISOString(),
      source: 'klink-inzicht-pr8-staging',
      target: 'klink-inzicht-pr8-restore',
      tables: names.length,
      schema_version: bundle.schema_version,
      checksum: bundle.checksum,
      sqlite: 'all rows equal',
      d1: 'all rows equal',
      time_travel: 'intentional change reverted; all rows equal',
      credentials: 'omitted and not restored',
      foreign_keys: 'valid',
      production: 'untouched',
    },
    null,
    2,
  ),
);
console.log(
  'Remote D1 export -> SQLite -> separate remote D1: every field equal. Time Travel mutation/restore passed; no credentials restored.',
);
