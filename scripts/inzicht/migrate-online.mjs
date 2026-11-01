import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
export function migrateOnline() {
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
    ? query('SELECT MAX(version) v FROM inzicht_schema')[0].v
    : 0;
  const files = readdirSync('db/migrations/inzicht')
    .filter((f) => /^\d{4}_[\w]+\.sql$/.test(f))
    .sort();
  assert.deepEqual(
    files.map((f) => Number(f.slice(0, 4))),
    files.map((_, i) => i + 1),
  );
  assert(version <= files.length, 'Database schema is ahead of this branch');
  for (const file of files.filter((f) => Number(f.slice(0, 4)) > version)) {
    execFileSync(
      'node_modules/.bin/wrangler',
      [...args, '--file', `db/migrations/inzicht/${file}`],
      { stdio: 'pipe' },
    );
    console.log(`Applied ${file} to the isolated synthetic staging.`);
  }
  assert.equal(
    query('SELECT MAX(version) v FROM inzicht_schema')[0].v,
    files.length,
  );
}
if (process.argv[1]?.endsWith('/migrate-online.mjs')) migrateOnline();
