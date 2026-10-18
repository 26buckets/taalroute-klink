import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const out = 'outputs/didactic-review-round3-20261018';
const archive = `${out}/Klink-didactische-review-ronde3-20261018.zip`;
if (existsSync(archive)) throw Error('Do not overwrite an existing recovery archive.');
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n');
const source = tracked.filter(path => /\.(ts|tsx|js|mjs|cjs|json|jsonc|css|md|html|toml|yml|yaml|lock)$/.test(path) || path === 'public/.assetsignore');
function evidence(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? evidence(path) : /\.(json|png|pdf|log)$/.test(path) ? [path] : [];
  });
}
const files = [...new Set([...source, ...evidence(out)])].sort((a, b) => a.localeCompare(b));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = { createdAt: new Date().toISOString(), sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  scope: 'Round 3 source, local/live checks, original observation framework and didactic rationale. No new images, audio or media connections.',
  unchangedMediaRecovery: { previousSourceAndEvidence: '1TIJSrQJHpPkHVZDEDCcgYRbDhi8gr99h', fullMediaPackages: ['12_bQiJUlJEPdrl8s8rjYEJzycWmsIkXy', '1uHj2hVUO30HO9r17iW4TJ3_QBCBWptE-', '1zdlnhScWKaiwJpd5-Sqbk9acY746Bx-4', '1j6z5Yw_lF2gvDFfXqPqbO9mR1NQL-JoK', '1t-tgdn5qJQ1tnZnLVya1CMB8XOiAj_jC'] },
  files: files.map(path => ({ path, bytes: statSync(path).size, sha256: sha(readFileSync(path)) })) };
writeFileSync(`${out}/source-manifest.json`, JSON.stringify(manifest, null, 2));
execFileSync('zip', ['-q', archive, '-@'], { input: [...files, `${out}/source-manifest.json`].join('\n') + '\n' });
const result = { archive, bytes: statSync(archive).size, sha256: sha(readFileSync(archive)), files: files.length + 1 };
writeFileSync(`${out}/local-backup.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
