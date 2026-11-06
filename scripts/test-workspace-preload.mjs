import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { workspacePreloads, preloadScript } from './build-workspace-preload.mjs';

const manifest = {
  learner: { name: 'learner-app', file: '_next/static/chunks/learner.js', imports: ['shared'], dynamicImports: ['player'] },
  teacher: { name: 'staff-apps', file: '_next/static/chunks/teacher.js', imports: ['shared'] },
  shared: { file: '_next/static/chunks/shared.js', imports: ['learner'] },
  player: { file: '_next/static/chunks/player.js' },
};
test('static graph is complete, deduplicated and excludes dynamic imports', () => {
  const paths = workspacePreloads(manifest);
  assert.deepEqual(paths.learner, ['/_next/static/chunks/learner.js', '/_next/static/chunks/shared.js']);
  assert.equal(paths.teacher, undefined);
  assert(!JSON.stringify(paths).includes('player.js'));
  assert.throws(() => workspacePreloads({ ...manifest, shared: { file: 'https://elsewhere/file.js' } }));
  assert.throws(() => workspacePreloads({ ...manifest, shared: undefined }));
});
test('only an explicit workspace at the app root starts downloads; repeated execution is harmless', () => {
  const paths = { learner: ['/_next/static/chunks/learner.js'], teacher: ['/_next/static/chunks/teacher.js'] };
  for (const [pathname, hash, count] of [['/', '', 0], ['/inzicht', '#learner', 0], ['/', '#learner/chapters/words', 1], ['/', '#teacher/plus', 0]]) {
    const links = [];
    const context = { location: { pathname, hash }, document: { head: { appendChild: link => links.push(link) }, createElement: () => ({}), querySelector: selector => links.find(link => selector.includes(link.href)) } };
    runInNewContext(preloadScript(paths), context);
    runInNewContext(preloadScript(paths), context);
    assert.equal(links.length, count);
    if (count) assert.equal(links[0].href, paths[hash.startsWith('#teacher') ? 'teacher' : 'learner'][0]);
  }
});
