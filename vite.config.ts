import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const cloudflareConfig = {
  name: 'taalroute-klink',
  main: 'vinext/server/fetch-handler',
  assets: { binding: 'ASSETS' },
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

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    // Keep tiny shared UI modules together within the existing asset limit.
    environments: { client: { build: { rolldownOptions: { output: {
      codeSplitting: { groups: [{
        name: 'shared-ui',
        test: /(?:node_modules\/lucide-react\/|components\/product\/(?:manual-legacy-link|motion-feedback)\.tsx$)/,
        includeDependenciesRecursively: false,
      }] },
    } } } } },
    css: { postcss: { plugins: [tailwindcss()] } },
    server: { watch: {
      ignored: ['**/outputs/**', '**/docs/**'],
      ...(isCodexSeatbeltSandbox ? { useFsEvents: false, usePolling: true } : {}),
    } },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: cloudflareConfig,
      }),
    ],
  };
});
