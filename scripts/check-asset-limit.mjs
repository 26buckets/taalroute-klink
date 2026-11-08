import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ignore from 'ignore';

export const ASSET_LIMIT = 20000;
export const ASSET_WARNING = 18000;
export function assetLevel(count) {
  return count > ASSET_LIMIT ? 'error' : count >= ASSET_WARNING ? 'warning' : 'ok';
}
export function assetPaths(root) {
  // Match Wrangler's default exclusions and the generated deployment ignore file.
  const matcher = ignore().add(['/.assetsignore', '/_redirects', '/_headers', ...readFileSync(root + '/.assetsignore', 'utf8').split('\n')]);
  const files = readdirSync(root, {recursive: true, withFileTypes: true});
  assert(!files.some(file => file.isSymbolicLink()), 'Asset directories must not contain symbolic links');
  return files.filter(file => file.isFile()).map(file => resolve(file.parentPath, file.name).slice(resolve(root).length + 1)).filter(path => !matcher.ignores(path)).sort();
}
export const countAssets = root => assetPaths(root).length;
export function publicationCounts(paths) {
  const audio = paths.filter(path => path.startsWith('package-audio/')).length;
  return {app: paths.length - audio, audio};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  for (const [part, count] of Object.entries(publicationCounts(assetPaths(process.argv[2] || 'dist/client')))) {
    const level = assetLevel(count), text = `Klink ${part}: ${count}/${ASSET_LIMIT} publicatiebestanden; ${ASSET_LIMIT - count} plaatsen over.`;
    if (level === 'error') { console.error('STOP: bestandslimiet overschreden. ' + text); process.exitCode = 1; }
    else if (level === 'warning') console.warn('WAARSCHUWING: dicht bij de bestandslimiet. ' + text);
    else console.log(text);
  }
}
