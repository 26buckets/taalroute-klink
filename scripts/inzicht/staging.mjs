import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fixtures } from './fixtures.mjs';

mkdirSync('.wrangler', { recursive: true });
const marker = '.wrangler/inzicht-initialized';
if (existsSync(marker))
  throw new Error(
    'Staging bestaat al; bewaarde gegevens blijven staan. Gebruik de bestaande testtoegang of provision nieuwe sessies.',
  );
const config = {
  name: 'klink-inzicht-synthetic-local',
  compatibility_date: '2026-05-15',
  d1_databases: [
    {
      binding: 'INZICHT_DB',
      database_name: 'klink-inzicht-synthetic-local',
      database_id: '00000000-0000-4000-8000-000000000001',
    },
  ],
};
writeFileSync('.wrangler/inzicht-local.json', JSON.stringify(config));
const args = [
  'd1',
  'execute',
  'INZICHT_DB',
  '--local',
  '--config',
  '.wrangler/inzicht-local.json',
  '--persist-to',
  '.wrangler/state',
];
const query = (sql) =>
  JSON.parse(
    execFileSync(
      'node_modules/.bin/wrangler',
      [...args, '--command', sql, '--json'],
      { encoding: 'utf8' },
    ),
  )[0].results;
const hasSchema =
  query("SELECT name FROM sqlite_master WHERE name='inzicht_schema'").length >
  0;
const version = hasSchema
  ? query('SELECT MAX(version) AS version FROM inzicht_schema')[0].version
  : 0;
for (const file of readdirSync('db/migrations/inzicht')
  .filter((f) => f.endsWith('.sql') && Number(f.slice(0, 4)) > version)
  .sort())
  execFileSync(
    'node_modules/.bin/wrangler',
    [...args, '--file', `db/migrations/inzicht/${file}`],
    { stdio: 'inherit' },
  );
if (query('SELECT COUNT(*) AS n FROM users')[0].n)
  throw new Error(
    'Bestaande synthetische data gevonden; geen gegevens overschreven.',
  );
const data = await fixtures();
writeFileSync('.wrangler/inzicht-seed.sql', data.sql, { mode: 0o600 });
execFileSync(
  'node_modules/.bin/wrangler',
  [
    'd1',
    'execute',
    'INZICHT_DB',
    '--local',
    '--config',
    '.wrangler/inzicht-local.json',
    '--persist-to',
    '.wrangler/state',
    '--file',
    '.wrangler/inzicht-seed.sql',
  ],
  { stdio: 'inherit' },
);
writeFileSync(
  '.wrangler/inzicht-credentials.json',
  JSON.stringify(data.credentials, null, 2),
  { mode: 0o600 },
);
writeFileSync(marker, new Date().toISOString());
console.log(
  'Synthetische staging voorbereid. Toegang staat uitsluitend in .wrangler/inzicht-credentials.json. Start met KLINK_INZICHT_LOCAL=1 npm run dev -- --port 18841.',
);
