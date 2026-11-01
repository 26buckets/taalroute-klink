import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { canonical, hash } from '../../lib/inzicht/rules.ts';
import { migrateOnline } from './migrate-online.mjs';
import { snapshot, restore } from './portable.mjs';

// Raw backups contain authentication material and must stay in the ignored private directory.
const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
assert.equal(config.name, 'klink-inzicht-pr8-staging');
assert.deepEqual(config.routes, []);
assert.equal(
  config.d1_databases[0].database_id,
  '95f1de18-0c61-46ca-b2af-5ee36543f67f',
);
const run = (args) =>
  execFileSync('node_modules/.bin/wrangler', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const info = JSON.parse(run(['d1', 'info', config.name, '--json']));
assert.equal(info.jurisdiction, 'eu');
mkdirSync('.wrangler/observations-upgrade', { recursive: true, mode: 0o700 });
const dir = mkdtempSync('.wrangler/observations-upgrade/run-');
function exported(name) {
  const file = `${dir}/${name}.sql`;
  writeFileSync(file, '', { mode: 0o600 });
  run([
    'd1',
    'export',
    'INZICHT_DB',
    '--remote',
    '--config',
    'scripts/inzicht/online-config.json',
    '--output',
    file,
  ]);
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(file, 'utf8'));
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) n FROM users WHERE auth_subject NOT LIKE 'synthetic:%'",
      )
      .get().n,
    0,
  );
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  return db;
}
const before = exported('before');
const version = before
  .prepare('SELECT MAX(version) v FROM inzicht_schema')
  .get().v;
assert.equal(
  version,
  5,
  'This check is specifically the additive schema 5 → 7 migration.',
);
const tables = before
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name!='inzicht_schema'",
  )
  .all()
  .map((x) => x.name);
const rows = (db, t) =>
  db
    .prepare(`SELECT * FROM "${t}"`)
    .all()
    .map((r) => ({ ...r }))
    .sort((a, b) => canonical(a).localeCompare(canonical(b)));
const original = Object.fromEntries(tables.map((t) => [t, rows(before, t)]));
for (const file of [
  '0006_original_observations.sql',
  '0007_learning_hours.sql',
])
  before.exec(readFileSync(`db/migrations/inzicht/${file}`, 'utf8'));
for (const table of tables)
  assert.deepEqual(
    rows(before, table),
    original[table],
    `Local upgrade changed ${table}`,
  );
const bundle = await snapshot(before);
const restored = await restore(bundle, `${dir}/restored.sqlite`);
restored.close();
let remoteApplied = false,
  preserved = [];
if (process.argv.includes('--apply')) {
  migrateOnline();
  const after = exported('after');
  assert.equal(
    after.prepare('SELECT MAX(version) v FROM inzicht_schema').get().v,
    7,
  );
  // The cron worker may advance processing metadata; educational source records must remain identical.
  preserved = tables.filter(
    (t) =>
      !t.startsWith('inzicht_') &&
      ![
        'outbox_events',
        'mastery_snapshots',
        'audit_events',
        'school_invites',
      ].includes(t),
  );
  for (const table of preserved)
    assert.deepEqual(
      rows(after, table),
      original[table],
      `Remote upgrade changed ${table}`,
    );
  const remoteBundle = await snapshot(after);
  const remoteRestored = await restore(
    remoteBundle,
    `${dir}/remote-restored.sqlite`,
  );
  remoteRestored.close();
  writeFileSync(`${dir}/education.json`, JSON.stringify(remoteBundle), {
    mode: 0o600,
  });
  remoteApplied = true;
  after.close();
}
before.close();
mkdirSync('docs/inzicht-20261101/evidence/visual', { recursive: true });
const evidence = {
  checked_at: new Date().toISOString(),
  database: config.name,
  jurisdiction: info.jurisdiction,
  from: 5,
  to: 7,
  local_all_existing_tables_unchanged: tables.length,
  local_restore: true,
  remote_applied: remoteApplied,
  remote_restore: remoteApplied,
  preserved: await Promise.all(
    preserved.map(async (table) => ({
      table,
      rows: original[table].length,
      sha256: await hash(original[table]),
    })),
  ),
  private_backup: dir,
};
writeFileSync(
  'docs/inzicht-20261101/evidence/visual/migration.json',
  JSON.stringify(evidence, null, 2),
);
console.log({
  local_upgrade_and_restore: true,
  remote_applied: remoteApplied,
  preserved_tables: preserved.length,
});
