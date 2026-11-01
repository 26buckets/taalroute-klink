import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { snapshot, restore, postgresSQL, verify } from './portable.mjs';
import { fixtures } from './fixtures.mjs';
import { canonical } from '../../lib/inzicht/rules.ts';
mkdirSync('work/restore-tests', { recursive: true });
const dir = mkdtempSync(`${process.cwd()}/work/restore-tests/run-`),
  port = 18844;
const source = new DatabaseSync(`${dir}/source.sqlite`);
source.exec('PRAGMA foreign_keys=ON');
for (const f of readdirSync('db/migrations/inzicht').sort())
  source.exec(readFileSync(`db/migrations/inzicht/${f}`, 'utf8'));
source.exec((await fixtures()).sql);
const bundle = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], 'utf8'))
  : await snapshot(source);
await verify(bundle);
assert(!bundle.data.inzicht_sessions);
assert(!bundle.data.school_invites);
const broken = structuredClone(bundle);
broken.data.groups[0].name = 'tampered';
await assert.rejects(() => verify(broken));
const restored = await restore(bundle, `${dir}/restored.sqlite`);
assert.deepEqual((await snapshot(restored)).data, bundle.data);
await assert.rejects(() => restore(bundle, `${dir}/restored.sqlite`));
writeFileSync(`${dir}/postgres.sql`, await postgresSQL(bundle));
const run = (cmd, args) =>
  execFileSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
run('initdb', [
  '-D',
  `${dir}/pg`,
  '--auth=trust',
  '--no-locale',
  '--encoding=UTF8',
]);
let started = false;
try {
  run('pg_ctl', [
    '-D',
    `${dir}/pg`,
    '-l',
    `${dir}/postgres.log`,
    '-o',
    `-p ${port} -h 127.0.0.1 -k ''`,
    '-w',
    'start',
  ]);
  started = true;
  const args = [
    '-h',
    '127.0.0.1',
    '-p',
    String(port),
    '-d',
    'postgres',
    '-v',
    'ON_ERROR_STOP=1',
  ];
  run('psql', [...args, '-f', `${dir}/postgres.sql`]);
  for (const [table, rows] of Object.entries(bundle.data)) {
    assert(/^[a-z_]+$/.test(table));
    const data = JSON.parse(
      run('psql', [
        ...args,
        '-At',
        '-c',
        `SELECT COALESCE(json_agg(t),'[]'::json) FROM "${table}" t`,
      ]),
    );
    assert.deepEqual(
      data.map(canonical).sort(),
      rows.map(canonical).sort(),
      table,
    );
  }
  writeFileSync(
    `docs/inzicht-20261101/evidence/${process.argv[2] ? 'online-' : ''}portable-test-results.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        schema: bundle.schema_version,
        tables: Object.keys(bundle.data).length,
        sqliteRestore: 'all rows equal',
        postgresRestore: 'all rows equal',
        corruption: 'rejected',
        overwrite: 'rejected',
        credentials: 'omitted',
        productionRestore: 'not approved; synthetic only',
      },
      null,
      2,
    ),
  );
  console.log(
    'SQLite and real local PostgreSQL: all table rows equal; corrupt exports and overwrite rejected; credentials omitted.',
  );
} finally {
  if (started) run('pg_ctl', ['-D', `${dir}/pg`, '-m', 'fast', '-w', 'stop']);
  source.close();
  restored.close();
}
