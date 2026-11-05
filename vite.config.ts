import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import { staticAssetsAdapter } from '@vinext/cloudflare/cache/static-assets-adapter';
import { compactLexiconPlugin } from './scripts/compact-lexicon-module.mjs';

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const cloudflareConfig = {
  name: 'taalroute-klink',
  main: 'vinext/server/fetch-handler',
  compatibility_date: '2026-05-15',
  compatibility_flags: ['nodejs_compat'],
  assets: { binding: 'ASSETS' },
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
    // Keep the initial shell together to leave room for prepared pages within the asset limit.
    environments: { client: { build: { rolldownOptions: { output: {
      codeSplitting: { groups: [
        // Claim the shared framework and data first; only player-only dependencies may be deferred.
        { name: 'framework', test: /(?:vite\/preload-helper\.js$|node_modules\/vinext\/(?:dist\/utils\/deployment-id\.js|dist\/shims\/(?:use-merged-ref|image-config)\.js|node_modules\/ipaddr\.js\/lib\/ipaddr\.js)$|node_modules\/(?:react\/|react-dom\/|scheduler\/))/, priority: 100, includeDependenciesRecursively: false },
        { name: 'route-settings', test: /(?:components\/product\/(?:route-settings|practice-workspace|exercise-view|exercise-listen|round-progress|sound-reference)\.tsx|components\/product\/alfa-c-docent\.css|components\/ui\/dialog\.tsx|lib\/(?:writing-answer|word-articles|learning-review)\.ts)$/, priority: 50, includeDependenciesRecursively: true },
        { name: 'learner-app', test: /components\/product\/learner-app\.tsx$/, priority: 40, includeDependenciesRecursively: true },
        { name: 'learner-rounds-player', test: /components\/product\/package-exercise-browser\.tsx$/, priority: 20, includeDependenciesRecursively: true },
        { name: 'learner-rounds', test: /components\/product\/learner-rounds\.ts$/, priority: 10, includeDependenciesRecursively: true },
        { name: 'practice-source-bank', priority: 90, test: /data\/klink-(?:imported-practice|word-use-self)\.json$/, includeDependenciesRecursively: false },
        { name: 'practice-word-bank', priority: 90, test: /(?:data\/klink-(?:lexicon-wordbuild-rest|lexicon-wordbuild-20|curriculum|media)\.json|lib\/klink-curriculum\.ts)$/, includeDependenciesRecursively: false },
        {
        name: 'shared-ui', priority: 100,
        test: /(?:components\/product\/klink-opening-loader\.css$|node_modules\/(?:lucide-react\/|@unpic\/|unpic\/)|node_modules\/vinext\/dist\/(?:shims\/(?:script|link|image|layout-segment-context)|client\/pages-router-link-navigation)\.js$|app\/page\.tsx$|components\/product\/(?:manual-legacy-link|motion-feedback|manual-navigation|classroom-boundary|word-listening|taalroute-header|entry-design|compact-image|word-placeholder|klink-opening-loader)\.tsx$|components\/product\/(?:teacher-module-recovery|load-practice-workspace)\.ts$|lib\/(?:classroom-visibility|image-word-listening|compact-images|audio-policy|audio-repairs|word-listening-text|word-listening|media-player)\.ts$|data\/klink-(?:image-word-listening|compact-images-20261031|production-instructions|word-use-audio|audio-policy|word-audio-repairs|word-listening)\.json$)/,
        includeDependenciesRecursively: false,
      }] },
    } } } } },
    json: { stringify: true, namedExports: false },
    css: { postcss: { plugins: [tailwindcss()] } },
    server: { watch: {
      ignored: ['**/outputs/**', '**/docs/**'],
      ...(isCodexSeatbeltSandbox ? { useFsEvents: false, usePolling: true } : {}),
    } },
    plugins: [
      compactLexiconPlugin(),
      vinext({ prerender: true, cache: { cdn: staticAssetsAdapter() } }),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: cloudflareConfig,
      }),
    ],
  };
});
