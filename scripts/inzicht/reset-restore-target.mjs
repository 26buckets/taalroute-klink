// Reuse only this chat's unbound, verified synthetic restore target; never touch the source DB.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { canonical, hash } from '../../lib/inzicht/rules.ts';
assert.equal(process.argv[2], '--reset-verified-synthetic-target');
const config = JSON.parse(readFileSync('scripts/inzicht/restore-config.json'));
assert.equal(config.name, 'klink-inzicht-pr8-restore');
assert.deepEqual(config.routes, []);
assert.deepEqual(
  config.d1_databases.map((x) => x.database_id),
  ['6bbdaabc-8098-4a75-91e5-96984382e7ee'],
);
const old = JSON.parse(readFileSync('.wrangler/online-recovery/snapshot.json'));
const { checksum, ...payload } = old;
assert.equal(
  checksum,
  '17f83f8039befcff96a237789e7abc7348a37e319e63e4bd768f004fb7e8e8d3',
);
assert.equal(await hash(payload), checksum);
assert(old.synthetic_only);
const args = [
  'd1',
  'execute',
  'RESTORE_DB',
  '--remote',
  '--config',
  'scripts/inzicht/restore-config.json',
];
const run = (args) =>
  execFileSync('node_modules/.bin/wrangler', args, {
    encoding: 'utf8',
    stdio: 'pipe',
  });
const query = (sql) => JSON.parse(run([...args, '--command', sql, '--json']));
const tables = [];
for (const m of old.migrations) {
  const sql = readFileSync(`db/migrations/inzicht/${m.name}`, 'utf8');
  assert.equal(await hash(sql), m.sha256);
  tables.push(...[...sql.matchAll(/CREATE TABLE ([a-z_]+)/g)].map((m) => m[1]));
}
const names = query("SELECT name FROM sqlite_master WHERE type='table'")[0]
  .results.map((r) => r.name)
  .filter((n) => !n.startsWith('_') && !n.startsWith('sqlite_'));
assert.deepEqual(
  names.sort((a, b) => a.localeCompare(b)),
  [...tables].sort((a, b) => a.localeCompare(b)),
);
assert.equal(
  query("SELECT COUNT(*) n FROM sqlite_master WHERE type='trigger'")[0]
    .results[0].n,
  0,
);
const known = Object.keys(old.data),
  actual = query(known.map((n) => `SELECT * FROM "${n}";`).join('\n'));
for (let i = 0; i < known.length; i++)
  assert.deepEqual(
    actual[i].results.map(canonical).sort(),
    old.data[known[i]].map(canonical).sort(),
    known[i],
  );
for (const table of old.omitted) {
  assert(/^[a-z_]+$/.test(table));
  if (tables.includes(table))
    assert.equal(query(`SELECT COUNT(*) n FROM "${table}"`)[0].results[0].n, 0);
}
const dir = '.wrangler/mfa-recovery';
mkdirSync(dir, { recursive: true, mode: 0o700 });
const backup = `${dir}/previous-restore.sql`;
assert(!existsSync(backup), 'Preserve prior recovery copy');
writeFileSync(backup, '', { mode: 0o600, flag: 'wx' });
run([
  'd1',
  'export',
  'RESTORE_DB',
  '--remote',
  '--config',
  'scripts/inzicht/restore-config.json',
  '--output',
  backup,
]);
const sql = [...tables]
  .reverse()
  .map((n) => `DROP TABLE "${n}";`)
  .join('\n');
writeFileSync(`${dir}/reset-verified-target.sql`, sql, { mode: 0o600 });
run([...args, '--file', `${dir}/reset-verified-target.sql`]);
assert.equal(
  query("SELECT COUNT(*) n FROM sqlite_master WHERE name='users'")[0].results[0]
    .n,
  0,
);
writeFileSync(
  'docs/inzicht-20261101/evidence/mfa-restore-target-reset.json',
  JSON.stringify(
    {
      at: new Date().toISOString(),
      target_id: config.d1_databases[0].database_id,
      verified_previous_snapshot: checksum,
      all_previous_education_fields_equal: true,
      all_omitted_auth_tables_empty: true,
      previous_export_sha256: await hash(readFileSync(backup, 'utf8')),
      source_database_untouched: true,
      reason:
        'Existing account D1 database limit; reuse only the known synthetic restore database, no billing change',
    },
    null,
    2,
  ),
);
console.log(
  'Previous restore target matched the exact tested synthetic snapshot; checkpoint retained and only this unbound test target reset.',
);
