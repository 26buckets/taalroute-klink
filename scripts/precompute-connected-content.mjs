import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Ship the existing reviewed result, without sending its duplicate input/review tables too.
export function connectedContentModule(data) {
  const names = ['connectedContent', 'contentLevelReviews', 'contentPlacements', 'dialogueImages', 'contentRouting', 'sentenceLevelReviews'];
  assert.deepEqual(Object.keys(data).sort(), [...names].sort());
  return names.map(name => {
    const value = data[name], map = value instanceof Map;
    const json = JSON.stringify(map ? [...value] : value);
    assert(json !== undefined, `Missing connected-content export: ${name}`);
    const parsed = `/* @__PURE__ */ JSON.parse(${JSON.stringify(json)})`;
    return `export const ${name} = ${map ? `/* @__PURE__ */ new Map(${parsed})` : parsed};`;
  }).join('\n');
}

/** @returns {import('vite').Plugin} */
export function precomputeConnectedContentPlugin() {
  return {
    name: 'klink-precompute-connected-content', apply: 'build', enforce: 'pre',
    async load(id) {
      if (!id.endsWith('/lib/connected-content-data.ts')) return;
      return connectedContentModule(await import(pathToFileURL(id).href));
    },
  };
}
