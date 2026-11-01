import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { canonical, hash } from '../../lib/inzicht/rules.ts';

const migrations = readdirSync('db/migrations/inzicht')
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => ({
    name: f,
    sql: readFileSync(`db/migrations/inzicht/${f}`, 'utf8'),
  }));
const transient = new Set([
  'inzicht_sessions',
  'inzicht_credentials',
  'inzicht_rate_limits',
  'inzicht_write_guards',
  'inzicht_requests',
  'school_invites',
]);
const identifier = (v) => {
  assert(/^[a-z_]+$/.test(v));
  return `"${v}"`;
};
export async function snapshot(db) {
  db.exec('BEGIN');
  try {
    assert.equal(
      db
        .prepare(
          "SELECT COUNT(*) AS n FROM users WHERE auth_subject NOT LIKE 'synthetic:%'",
        )
        .get().n,
      0,
      'This recovery tool is currently approved only for synthetic local staging',
    );
    const tables = migrations
      .flatMap((m) =>
        [...m.sql.matchAll(/CREATE TABLE ([a-z_]+)/g)].map((match) => match[1]),
      )
      .filter((n) => !transient.has(n));
    const data = {};
    for (const table of tables)
      data[table] = db
        .prepare(`SELECT * FROM ${identifier(table)}`)
        .all()
        .map((r) => ({ ...r }))
        .sort((a, b) => canonical(a).localeCompare(canonical(b)));
    db.exec('COMMIT');
    const payload = {
      format: 'klink-inzicht-sql-export',
      version: 1,
      schema_version: Math.max(...data.inzicht_schema.map((v) => v.version)),
      migrations: await Promise.all(
        migrations.map(async (m) => ({
          name: m.name,
          sha256: await hash(m.sql),
        })),
      ),
      data,
      omitted: [...transient],
      synthetic_only: true,
    };
    return { ...payload, checksum: await hash(payload) };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
export async function verify(bundle) {
  const { checksum, ...payload } = bundle;
  assert.equal(bundle.format, 'klink-inzicht-sql-export');
  assert.equal(bundle.version, 1);
  assert.equal(await hash(payload), checksum, 'Export checksum mismatch');
  assert.deepEqual(
    bundle.migrations,
    await Promise.all(
      migrations.map(async (m) => ({
        name: m.name,
        sha256: await hash(m.sql),
      })),
    ),
    'Schema differs: explicit migration required',
  );
}
export async function restore(bundle, target) {
  await verify(bundle);
  assert(!existsSync(target), 'Never overwrite an existing database');
  const db = new DatabaseSync(target);
  db.exec('PRAGMA foreign_keys=ON');
  db.exec('BEGIN');
  try {
    for (const migration of migrations) db.exec(migration.sql);
    for (const [table, records] of Object.entries(bundle.data)) {
      if (table === 'inzicht_schema') continue;
      for (const record of records) {
        const keys = Object.keys(record);
        db.prepare(
          `INSERT INTO ${identifier(table)} (${keys.map(identifier).join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
        ).run(...keys.map((k) => record[k]));
      }
    }
    assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
    db.exec('COMMIT');
    const restored = await snapshot(db);
    assert.equal(restored.checksum, bundle.checksum, 'Restored data differs');
    return db;
  } catch (error) {
    db.exec('ROLLBACK');
    db.close();
    throw error;
  }
}
export async function postgresSQL(bundle) {
  await verify(bundle);
  const value = (v) =>
    v === null
      ? 'NULL'
      : typeof v === 'number'
        ? String(v)
        : `'${String(v).replaceAll("'", "''")}'`;
  const sql = ['BEGIN;', ...migrations.map((m) => m.sql)];
  for (const [table, records] of Object.entries(bundle.data)) {
    if (table === 'inzicht_schema') continue;
    for (const record of records) {
      const keys = Object.keys(record);
      sql.push(
        `INSERT INTO ${identifier(table)} (${keys.map(identifier).join(',')}) VALUES (${keys.map((k) => value(record[k])).join(',')});`,
      );
    }
  }
  sql.push('COMMIT;');
  return sql.join('\n');
}
if (process.argv[1]?.endsWith('/portable.mjs')) {
  const [action, input, output] = process.argv.slice(2);
  assert(
    input && output,
    'Use export DB JSON, restore JSON NEW_DB, or postgres JSON SQL',
  );
  if (action === 'export') {
    const db = new DatabaseSync(input, { readOnly: true });
    const bundle = await snapshot(db);
    writeFileSync(output, JSON.stringify(bundle, null, 2), { mode: 0o600 });
    db.close();
    console.log(
      `Export checked: ${Object.keys(bundle.data).length} tables. No credentials included.`,
    );
  } else if (action === 'restore') {
    const db = await restore(JSON.parse(readFileSync(input, 'utf8')), output);
    db.close();
    console.log(
      'Restore verified, including foreign keys, row content and provenance. Sessions/invites must be reissued.',
    );
  } else if (action === 'postgres') {
    writeFileSync(
      output,
      await postgresSQL(JSON.parse(readFileSync(input, 'utf8'))),
      { mode: 0o600 },
    );
    console.log(
      'Portable PostgreSQL import written; execute in an empty isolated database and verify before use.',
    );
  } else throw new Error('Unknown action');
}
