import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

export function workspacePreloads(manifest) {
  const roots = name => Object.entries(manifest).filter(([, entry]) => entry.name === name).map(([key]) => key);
  const collect = name => {
    const entries = roots(name), seen = new Set(), files = new Set();
    assert.equal(entries.length, 1, `One ${name} entry required`);
    function visit(key) {
      if (seen.has(key)) return;
      seen.add(key);
      const entry = manifest[key];
      assert(entry, `Missing dependency ${key}`);
      assert.match(entry.file, /^_next\/static\/chunks\/[\w-]+\.js$/);
      files.add('/' + entry.file);
      for (const dependency of entry.imports ?? []) visit(dependency);
    }
    visit(entries[0]);
    return [...files];
  };
  return { learner: collect('learner-app'), teacher: collect('staff-apps') };
}

export function preloadScript(paths) {
  // Fetch only the chosen workspace's existing static dependencies; do not execute them early.
  return `(()=>{if(location.pathname!=='/')return;const p=location.hash.startsWith('#learner')?'learner':location.hash.startsWith('#teacher')?'teacher':null;if(!p)return;const paths=${JSON.stringify(paths)};for(const href of paths[p]){if(document.querySelector('link[rel="modulepreload"][href="'+href+'"]'))continue;const link=document.createElement('link');link.rel='modulepreload';link.crossOrigin='';link.href=href;document.head.appendChild(link)}})();\n`;
}

if (process.argv[1]?.endsWith('/build-workspace-preload.mjs')) {
  const root = process.argv[2] ?? 'dist/client';
  const paths = workspacePreloads(JSON.parse(readFileSync(`${root}/.vite/manifest.json`)));
  writeFileSync(`${root}/workspace-preload.js`, preloadScript(paths));
  console.log('Workspace preload: existing static dependencies only; no dynamic players or API requests added.');
}
