import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { canonical, hash } from '../../lib/inzicht/rules.ts';
const phase = process.argv[2];
assert(['before', 'after'].includes(phase));
const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
assert.equal(config.name, 'klink-inzicht-pr8-staging');
assert.deepEqual(
  config.d1_databases.map((x) => x.database_id),
  ['95f1de18-0c61-46ca-b2af-5ee36543f67f'],
);
const dir = '.wrangler/mfa-upgrade';
mkdirSync(dir, { recursive: true, mode: 0o700 });
const path = `${dir}/${phase}.sql`;
assert(!existsSync(path), 'Keep the previous verified upgrade checkpoint');
writeFileSync(path, '', { mode: 0o600, flag: 'wx' });
execFileSync(
  'node_modules/.bin/wrangler',
  [
    'd1',
    'export',
    'INZICHT_DB',
    '--remote',
    '--config',
    'scripts/inzicht/online-config.json',
    '--output',
    path,
  ],
  { stdio: 'pipe' },
);
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path, 'utf8'));
assert.equal(
  db
    .prepare(
      "SELECT COUNT(*) n FROM users WHERE auth_subject NOT LIKE 'synthetic:%'",
    )
    .get().n,
  0,
);
assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
const excluded = new Set([
  'inzicht_sessions',
  'inzicht_credentials',
  'inzicht_schema',
  'inzicht_rate_limits',
  'inzicht_write_guards',
  'inzicht_requests',
  'inzicht_mfa',
  'inzicht_mfa_sessions',
  'inzicht_mfa_challenges',
  'inzicht_mfa_recovery',
  'inzicht_auth_events',
  'inzicht_outbox_retries',
]);
const data = {};
for (const { name } of db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()) {
  if (excluded.has(name) || name.startsWith('_') || name.startsWith('sqlite_'))
    continue;
  assert(/^[a-z_]+$/.test(name));
  data[name] = db
    .prepare(`SELECT * FROM "${name}"`)
    .all()
    .map((x) => ({ ...x }))
    .sort((a, b) => canonical(a).localeCompare(canonical(b)));
}
const result = {
  at: new Date().toISOString(),
  schema: db.prepare('SELECT MAX(version) v FROM inzicht_schema').get().v,
  education_hash: await hash(data),
  tables: Object.fromEntries(
    Object.entries(data).map(([t, v]) => [t, v.length]),
  ),
  synthetic_only: true,
  foreign_keys_valid: true,
};
if (phase === 'after') {
  const old = JSON.parse(readFileSync(`${dir}/before.json`));
  assert.equal(result.education_hash, old.education_hash);
  assert.deepEqual(result.tables, old.tables);
  assert.equal(
    db.prepare('SELECT COUNT(*) n FROM inzicht_sessions').get().n,
    0,
  );
  result.legacy_sessions_revoked = true;
  result.education_unchanged = true;
  result.before_schema = old.schema;
  writeFileSync(
    'docs/inzicht-20261101/evidence/mfa-upgrade.json',
    JSON.stringify(result, null, 2),
  );
}
writeFileSync(`${dir}/${phase}.json`, JSON.stringify(result, null, 2), {
  mode: 0o600,
});
db.close();
console.log(
  `${phase}: isolated staging checkpoint verified; ${Object.keys(data).length} education tables, no real identities.`,
);
