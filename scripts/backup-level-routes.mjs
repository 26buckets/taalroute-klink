import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

if (process.argv[2] && !['route-panel', 'route-release', 'compact-route', 'picture-guide'].includes(process.argv[2])) throw Error('Unknown backup target.');
const pictures = process.argv[2] === 'picture-guide';
const compact = pictures || process.argv[2] === 'compact-route';
const published = compact || process.argv[2] === 'route-release';
const panel = published || process.argv[2] === 'route-panel';
const out = pictures ? 'outputs/picture-guide-20261018' : compact ? 'outputs/compact-route-20261018' : published ? 'outputs/route-release-20261018' : panel ? 'outputs/route-panel-20261018' : 'outputs/level-routes-20261018';
mkdirSync(out, { recursive: true });
const archive = `${out}/${pictures ? 'Klink-docentbeelden-en-rustige-oefenlijn-20261018' : compact ? 'Klink-compacte-route-header-gepubliceerd-20261018' : published ? 'Klink-routekeuze-gepubliceerd-20261018' : panel ? 'Klink-routekeuze-en-oefenlijn-20261018' : 'Klink-niveauroutes-lokale-bouw-20261018'}.zip`;
if (existsSync(archive)) throw Error('Existing recovery archive must not be overwritten.');
const candidates = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { encoding: 'utf8' }).trim().split('\n');
const source = candidates.filter(path => !path.startsWith('outputs/') && (/\.(ts|tsx|js|mjs|cjs|json|jsonc|css|md|html|toml|yml|yaml|lock)$/.test(path) || path === 'public/.assetsignore'));
const evidence = readdirSync(out).filter(name => /\.(json|png|log)$/.test(name) && !['source-manifest.json', 'local-backup.json', 'drive-backup.json'].includes(name)).map(name => `${out}/${name}`);
for (const path of [
  'outputs/existing-player-integration/browser-check.json',
  'outputs/phase-navigation-20261017/local-checks.json',
  'outputs/lesson-extension-20261016/browser-check.json',
  'outputs/continuous-flow-20261016/browser-check.json',
  'outputs/sentence-comprehension-20261017/browser-check.json',
  'outputs/content-connection-20261017/browser-check.json',
  'outputs/ux-review-20261017/real-audio-check.json',
  'outputs/sections-20261017/browser-local.json',
  'outputs/mixed-practice-20261017/browser-check.json',
  'outputs/mixed-practice-20261017/real-audio-check.json',
  'outputs/content-audio-register-20261017/browser-check.json',
  'outputs/group-practice-review-20261017/browser-checks.json',
  'outputs/extended-practice-review-20261017/browser-checks.json',
  'outputs/practice-chapters-20261017/browser-local.json',
  'outputs/player-stability-20261018/browser-local.json',
  'outputs/practice-sheet-20261018/browser-local.json',
  'outputs/menu-review-20261018/checks.json',
  'outputs/menu-review-round2-20261018/checks.json',
  'outputs/didactic-review-round3-20261018/browser-checks.json',
  'outputs/lesson-picker-20261016/checks.json',
]) { if (!existsSync(path)) throw Error(`Missing check evidence: ${path}`); evidence.push(path); }
if (published) for (const path of ['outputs/route-panel-20261018/browser-check.json', 'outputs/level-routes-20261018/browser-check.json', 'outputs/manual-wiki-20261018/wiki-local.json']) {
  if (!existsSync(path)) throw Error(`Missing route publication evidence: ${path}`);
  evidence.push(path);
}
const files = [...new Set([...source, ...evidence])].filter(existsSync).sort((a, b) => a.localeCompare(b));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = {
  createdAt: new Date().toISOString(),
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  state: published ? 'Published implementation; source and verification records included. Consult the active publication register for the runtime commit.' : 'Uncommitted local implementation; not published. Restore files over the stated base.',
  scope: pictures ? 'Teacher-only image explanations with five concrete examples; neutral learner overview below Start, circular step numbers, smaller approved header logo. Existing learner content, players, progress and media unchanged.' : compact ? 'One compact contextual route toolbar, second-click deselection, unified help and header branding. Existing bottom navigation, content, players, progress and media unchanged.' : panel ? 'Visible route choice on Start, separate photo help, six-stage exercise navigation and honest unavailable placeholders. Includes the prior level-route implementation; media unchanged.' : 'Approved menu, separate literacy/language routes, within-route progression and optional picture support. Existing media unchanged.',
  unchangedMediaRecovery: {
    previousSourceAndEvidence: panel ? '1-08CFDcFvx_lDzRzktziVSNUKdxJduox' : '1T8HJFDd9xFUuLntKzQP1QYdzyOhNbvOT',
    fullMediaPackages: ['12_bQiJUlJEPdrl8s8rjYEJzycWmsIkXy', '1uHj2hVUO30HO9r17iW4TJ3_QBCBWptE-', '1zdlnhScWKaiwJpd5-Sqbk9acY746Bx-4', '1j6z5Yw_lF2gvDFfXqPqbO9mR1NQL-JoK', '1t-tgdn5qJQ1tnZnLVya1CMB8XOiAj_jC'],
  },
  files: files.map(path => ({ path, bytes: statSync(path).size, sha256: sha(readFileSync(path)) })),
};
writeFileSync(`${out}/source-manifest.json`, JSON.stringify(manifest, null, 2));
execFileSync('zip', ['-q', archive, '-@'], { input: [...files, `${out}/source-manifest.json`].join('\n') + '\n' });
execFileSync('unzip', ['-tq', archive]);
const result = { archive, bytes: statSync(archive).size, sha256: sha(readFileSync(archive)), files: files.length + 1 };
if (result.bytes >= 50_000_000) throw Error('Keep this source/evidence archive below the conservative transfer limit.');
writeFileSync(`${out}/local-backup.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
