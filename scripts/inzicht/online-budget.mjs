import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

export function assertBenchmarkBudget(databases) {
  assert(
    databases.length > 0,
    'D1-gebruik is niet vastgesteld; schaalproef gestopt.',
  );
  assert(
    databases.every(
      (d) => Number.isFinite(d.rows_written_24h) && d.rows_written_24h >= 0,
    ),
    'Onvolledige D1-gebruikscijfers; schaalproef gestopt.',
  );
  const used = databases.reduce((sum, d) => sum + d.rows_written_24h, 0);
  // Reserve half the free account allowance for index writes, cleanup and other apps.
  assert(
    used < 50000,
    `D1-schrijfreserve te klein (${used} rijen in 24 uur). Voer zware controles lokaal uit en wacht op voldoende gedeelde ruimte.`,
  );
  return used;
}

export function checkOnlineBudget() {
  const run = (args) =>
    JSON.parse(
      execFileSync('node_modules/.bin/wrangler', args, {
        encoding: 'utf8',
        stdio: 'pipe',
      }),
    );
  const config = ['--config', 'scripts/inzicht/online-config.json', '--json'];
  const databases = run(['d1', 'list', ...config]);
  return assertBenchmarkBudget(
    databases.map((d) => run(['d1', 'info', d.name, ...config])),
  );
}
