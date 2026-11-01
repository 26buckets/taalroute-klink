import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
export function checkStaging(config) {
  assert.equal(config.name, 'klink-inzicht-pr8-staging');
  assert.equal(config.vars.INZICHT_MODE, 'synthetic-online');
  assert.equal(
    config.vars.INZICHT_ORIGIN,
    'https://klink-inzicht-pr8-staging.nico-554.workers.dev',
  );
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.routes, []);
  assert.deepEqual(config.services ?? [], []);
  assert.deepEqual(
    config.d1_databases.map(({ binding, database_id }) => ({
      binding,
      database_id,
    })),
    [
      {
        binding: 'INZICHT_DB',
        database_id: '95f1de18-0c61-46ca-b2af-5ee36543f67f',
      },
    ],
  );
  assert.equal(config.assets.binding, 'ASSETS');
  assert.equal(config.assets.run_worker_first, true);
}
if (process.argv[1]?.endsWith('/deploy-staging.mjs')) {
  const config = JSON.parse(readFileSync('dist/server/wrangler.json'));
  checkStaging(config);
  assert.equal(
    process.argv[2],
    '--deploy',
    'Explicit --deploy required; only the isolated staging is allowed',
  );
  execFileSync(
    'node_modules/.bin/wrangler',
    ['deploy', '--config', 'dist/server/wrangler.json'],
    { stdio: 'inherit' },
  );
}
