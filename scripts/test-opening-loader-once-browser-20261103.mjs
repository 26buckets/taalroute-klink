import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import sharp from 'sharp';
import { chromium, webkit } from 'playwright';

const out = 'docs/opening-loader-once-20261103/local';
mkdirSync(out, { recursive: true });
const bundled = await build({
  stdin: { contents: `import React, {StrictMode, useState, useCallback} from 'react';
    import {createRoot} from 'react-dom/client';
    import {KlinkOpeningLoader} from './components/product/klink-opening-loader';
    function Test(){const [key,setKey]=useState(0),[done,setDone]=useState(0);
      const complete=useCallback(()=>setDone(n=>n+1),[]);
      return <><button onClick={()=>setKey(n=>n+1)}>Volgend laadmoment</button>
        <span id="done">{done}</span><KlinkOpeningLoader key={key} onComplete={complete}/></>}
    createRoot(document.getElementById('root')).render(<StrictMode><Test/></StrictMode>);`,
    resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, format: 'esm', jsx: 'automatic', write: false,
  outfile: '/loader-test/app.js', define: { 'process.env.NODE_ENV': '"development"' },
});
const routes = new Map(bundled.outputFiles.map(f => ['/' + f.path.split('/').at(-1), f.contents]));
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/') {
    response.setHeader('Content-Type', 'text/html');
    response.end('<html><head><link rel="stylesheet" href="/app.css"><style>body{background:#edf1ee;color:#172020}@media(prefers-color-scheme:dark){body{background:#172020;color:#edf1ee}}</style></head><body style="margin:0"><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
  } else if (routes.has(path)) {
    response.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : 'text/css');
    response.end(routes.get(path));
  } else if (['/opening-loader-quick-20261101/klink-loader.svg', '/opening-loader-v4-20261101/klink-static.svg'].includes(path)) {
    response.setHeader('Content-Type', 'image/svg+xml');
    response.end(readFileSync('public' + path));
  } else { response.statusCode = 404; response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`, checks = [], errors = [];
const pixels = buffer => sharp(buffer).ensureAlpha().raw().toBuffer();
try {
  for (const [engine, type] of Object.entries({ chromium, webkit })) {
    const browser = await type.launch();
    try {
      for (const width of [1280, 390]) for (const reducedMotion of ['no-preference', 'reduce']) for (const colorScheme of ['light', 'dark']) {
        const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion, colorScheme });
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base);
        const logo = page.locator('.klink-opening-loader img');
        await logo.evaluate(img => img.decode());
        assert((await logo.getAttribute('src')).includes('/opening-loader-quick-'));
        await page.waitForTimeout(250);
        const moving = await pixels(await logo.screenshot());
        await page.locator('#done').filter({ hasText: /^1$/ }).waitFor();
        const final = await logo.screenshot();
        assert.equal(moving.equals(await pixels(final)), reducedMotion === 'reduce', 'Animation moves once; reduced motion stays still');
        for (let remount = 0; remount < 2; remount++) {
          await page.getByRole('button', { name: 'Volgend laadmoment' }).click();
          await page.waitForFunction(() => document.querySelector('.klink-opening-loader img').getAttribute('src').includes('klink-static.svg'));
          await logo.evaluate(img => img.decode());
          const frozen = await logo.screenshot();
          assert((await pixels(final)).equals(await pixels(frozen)), 'Remounted loader must be pixel-identical to the final frame');
        }
        // Keep the later loader visible past a full animation cycle.
        await page.waitForTimeout(2200);
        assert((await pixels(final)).equals(await pixels(await logo.screenshot())), 'Final frame must remain still');
        assert.equal(await page.locator('#done').innerText(), '2', 'Cancelled timers must not complete after unmount, including StrictMode');
        await logo.screenshot({ path: `${out}/${engine}-${width}-${reducedMotion}-${colorScheme}.png` });
        checks.push({ engine, width, reducedMotion, colorScheme, remounts: 2, finalFrameIdentical: true, completionPreserved: true });
        await page.close();
      }
    } finally { await browser.close(); }
  }
  assert.deepEqual(errors, []);
  console.log(`PASS ${checks.length} real component cases: first animation, repeated mounts, final pixels, reduced motion, completion/cancellation`);
} finally {
  server.close();
  writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors, physicalDevicesTested: false }, null, 2) + '\n');
}
