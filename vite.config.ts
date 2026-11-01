import stagingConfig from './scripts/inzicht/online-config.json';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const cloudflareConfig = {
  name: 'taalroute-klink',
  main: 'vinext/server/fetch-handler',
  compatibility_date: '2026-05-15',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: [
    {
      binding: 'DB',
      database_name: 'taalroute-klink',
      database_id: '0e67ae90-83e1-4506-af60-287a40bf08ef',
    },
  ],
  routes: [{ pattern: 'klink.taalroute.nl', custom_domain: true }],
};

export default defineConfig(async ({ command }) => {
  const inzichtLocal = process.env.KLINK_INZICHT_LOCAL === '1';
  const inzichtOnline = process.env.KLINK_INZICHT_STAGING === '1';
  if (inzichtOnline && inzichtLocal) throw new Error('Kies één testomgeving.');
  if (inzichtLocal && command !== 'serve')
    throw new Error(
      'Inzicht synthetische staging mag uitsluitend lokaal draaien.',
    );
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    ...(inzichtOnline ? { publicDir: '.wrangler/inzicht-assets' } : {}),
    build: inzichtOnline
      ? {
          modulePreload: {
            // WebKit retains failed modulepreloads; native import recovers on reload.
            resolveDependencies: (
              filename: string,
              deps: string[],
              { hostType }: { hostType: 'html' | 'js' },
            ) =>
              hostType === 'js' &&
              filename.includes('package-exercise-browser-')
                ? deps.filter((dep) => dep.endsWith('.css'))
                : deps,
          },
        }
      : undefined,
    css: {
      postcss: {
        plugins: [
          tailwindcss(
            inzichtOnline ? { base: `${process.cwd()}/components` } : {},
          ),
        ],
      },
    },
    server: {
      ...(inzichtLocal ? { host: '127.0.0.1' } : {}),
      watch: {
        ignored: ['**/outputs/**', '**/docs/**'],
        ...(isCodexSeatbeltSandbox
          ? { useFsEvents: false, usePolling: true }
          : {}),
      },
    },
    plugins: [
      vinext(inzichtOnline ? { appDir: 'scripts/inzicht/staging-app' } : {}),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: inzichtOnline
          ? {
              ...stagingConfig,
              main: 'lib/inzicht/worker.ts',
              assets: {
                run_worker_first: ['/', '/inzicht', '/inzicht/*', '/api/*'],
                binding: 'ASSETS',
              },
            }
          : inzichtLocal
            ? {
                ...cloudflareConfig,
                name: 'taalroute-klink-inzicht-local',
                routes: [],
                vars: { INZICHT_MODE: 'synthetic-local' },
                d1_databases: [
                  ...cloudflareConfig.d1_databases,
                  {
                    binding: 'INZICHT_DB',
                    database_name: 'klink-inzicht-synthetic-local',
                    database_id: '00000000-0000-4000-8000-000000000001',
                  },
                ],
              }
            : cloudflareConfig,
      }),
    ],
  };
});
