// Local measurement only: gzip static files before browser timing starts.
import { createServer } from 'node:http';
import { globSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

for (const [port, upstream, root] of [
  [19132, 19122, process.env.KLINK_NETWORK_BASELINE_BUILD],
  [19130, 19120, 'dist'],
]) {
  if (!root) throw new Error('Set KLINK_NETWORK_BASELINE_BUILD to the preserved baseline build');
  const assets = new Map(globSync('_next/static/**/*.{js,css}', { cwd: root + '/client' }).map(path => [
    '/' + path, { body: gzipSync(readFileSync(`${root}/client/${path}`)), type: path.endsWith('.js') ? 'text/javascript' : 'text/css' },
  ]));
  createServer(async (request, response) => {
    try {
      const asset = assets.get(request.url);
      if (asset) {
        response.writeHead(200, { 'Content-Type': asset.type, 'Content-Encoding': 'gzip', 'Content-Length': asset.body.length, 'Cache-Control': 'public, max-age=31536000, immutable' });
        response.end(asset.body); return;
      }
      const result = await fetch(`http://127.0.0.1:${upstream}${request.url}`);
      const headers = Object.fromEntries(result.headers);
      delete headers['content-encoding']; delete headers['content-length']; delete headers['transfer-encoding'];
      response.writeHead(result.status, headers);
      response.end(Buffer.from(await result.arrayBuffer()));
    } catch { response.writeHead(502); response.end('Local benchmark upstream unavailable'); }
  }).listen(port, '127.0.0.1', () => console.log(`Local gzip benchmark: ${port}`));
}
