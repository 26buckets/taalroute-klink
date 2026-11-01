import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import assert from 'node:assert/strict';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const traverse = traverseModule.default, generate = generateModule.default;
// Build ordering changes minifier aliases. Rename actual scoped bindings, never text.
function normalizedPage(file, imports) {
  const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module' });
  const bindings = new Set();
  traverse(ast, { Scope(path) { Object.values(path.scope.bindings).filter(binding => binding.kind !== 'module').forEach(binding => bindings.add(binding)); } });
  [...bindings].sort((a, b) => a.identifier.start - b.identifier.start).forEach((binding, i) => binding.scope.rename(binding.identifier.name, `__binding_${i}`));
  traverse(ast, { Program(path) {
    for (const [from, to] of Object.entries(imports)) path.scope.rename(from, to);
    path.node.body = path.node.body.filter(node => node.type !== 'ImportDeclaration');
  } });
  return generate(ast, { compact: true, comments: false }).code;
}
const live = normalizedPage('work/live-page.js', { o: '_ip', a: '_asset', s: '_match' });
const baseline = normalizedPage('work/live-baseline/dist/client/_next/static/chunks/page-DgaDhDRv.js', { a: '_ip', o: '_asset', s: '_match' });
assert.equal(hash(live), hash(baseline), 'Live application page differs from the candidate baseline');
const base = 'work/live-baseline/dist/server';
const hashes = new Map(readdirSync(base, { recursive: true, encoding: 'utf8' }).filter(path => path.endsWith('.js')).map(path => [hash(readFileSync(`${base}/${path}`)), path]));
const matches = [], unmatched = [];
for (const file of readdirSync('work/live-worker')) {
  const sha256 = hash(readFileSync(`work/live-worker/${file}`));
  const counterpart = hashes.get(sha256);
  if (counterpart) matches.push({ file, counterpart, sha256 });
  else unmatched.push(file);
}
assert(matches.some(item => item.file === 'page-BpudT-XI.js'), 'The SSR application page must match exactly');
assert(matches.some(item => item.file === 'route-CYFw3Xt7.js') && matches.some(item => item.file === 'route-D2Vxntf3.js'), 'Both API route bundles must match exactly');
const evidence = {
  date: new Date().toISOString(),
  candidateSourceCommit: 'c221eb104fe64a17de9e51a59ddc5667ea805518',
  liveWorkerVersion: 'efddd274-4f66-4d5b-9bfb-c21e87acc89d',
  clientPageScopedAstEqual: true,
  normalizedClientPageSha256: hash(live),
  exactModuleMatches: matches,
  remainingRuntimeOrManifestModules: unmatched,
  fullWorkerSourceProven: false,
  limitation: 'Client application, SSR application and both API route bundles match. Runtime/chunk manifests still differ; no deployment commit annotation exists. This is not full worker provenance.',
};
mkdirSync('outputs/media-connection', { recursive: true });
writeFileSync('outputs/media-connection/baseline-evidence.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ clientPageEqual: true, exactModuleMatches: matches.length, remainingModules: unmatched.length, fullWorkerSourceProven: false }));
