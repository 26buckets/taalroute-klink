import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
export function checkStaging(config) {
  assert.equal(config.name, 'klink-inzicht-pr8-staging');
  assert.equal(config.vars.INZICHT_MODE, 'synthetic-online');
  assert(
    !('INZICHT_MFA_KEY' in config.vars),
    'Encryption key must be a Worker secret, never plaintext configuration',
  );
  assert.equal(
    config.vars.INZICHT_ORIGIN,
    'https://klink-inzicht-pr8-staging.nico-554.workers.dev',
  );
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  if (config.vars.INZICHT_STAGING_ORIGIN !== undefined) {
    assert.equal(
      config.vars.INZICHT_STAGING_ORIGIN,
      'https://inzicht-staging.taalroute.nl',
    );
    assert.deepEqual(config.routes, [
      { pattern: 'inzicht-staging.taalroute.nl', custom_domain: true },
    ]);
  } else assert.deepEqual(config.routes, []);
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
  assert.deepEqual(config.assets.run_worker_first, [
    '/',
    '/inzicht',
    '/inzicht/*',
    '/api/*',
  ]);
}
if (process.argv[1]?.endsWith('/deploy-staging.mjs')) {
  const config = JSON.parse(readFileSync('dist/server/wrangler.json'));
  checkStaging(config);
  const headers = readFileSync('dist/client/_headers', 'utf8');
  assert(headers.includes('X-Robots-Tag: noindex, nofollow, noarchive'));
  assert(headers.includes("frame-ancestors 'none'"));
  assert.equal(
    process.argv[2],
    '--deploy',
    'Explicit --deploy required; only the isolated staging is allowed',
  );
  const secrets = JSON.parse(
    execFileSync(
      'node_modules/.bin/wrangler',
      ['secret', 'list', '--config', 'scripts/inzicht/online-config.json'],
      { encoding: 'utf8' },
    ),
  );
  assert(
    secrets.some((s) => s.name === 'INZICHT_MFA_KEY'),
    'Configure the MFA encryption secret before deploying',
  );
  const version = JSON.parse(
    execFileSync(
      'node_modules/.bin/wrangler',
      [
        'd1',
        'execute',
        'INZICHT_DB',
        '--remote',
        '--config',
        'scripts/inzicht/online-config.json',
        '--command',
        'SELECT MAX(version) v FROM inzicht_schema',
        '--json',
      ],
      { encoding: 'utf8' },
    ),
  )[0].results[0].v;
  assert.equal(
    version,
    readdirSync('db/migrations/inzicht').filter((f) => f.endsWith('.sql'))
      .length,
    'Apply reviewed staging migrations before deploying',
  );
  execFileSync(
    'node_modules/.bin/wrangler',
    ['deploy', '--config', 'dist/server/wrangler.json'],
    { stdio: 'inherit' },
  );
}
