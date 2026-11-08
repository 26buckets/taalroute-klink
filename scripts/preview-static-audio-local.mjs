import assert from 'node:assert/strict';
import {createServer, request as proxyRequest} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {audioPath} from './prepare-static-audio-local.mjs';

const root = resolve('outputs/static-audio-local');
const previewPort = Number(process.env.KLINK_PREVIEW_PORT || 19135);
assert(Number.isInteger(previewPort) && previewPort >= 1024 && previewPort <= 65532, 'Invalid local preview port');
const appPort = previewPort + 2, audioPort = previewPort + 3;
assert(readFileSync(root + '/LOCAL-ONLY', 'utf8').startsWith('Local preview only.'));
process.env.WRANGLER_SEND_METRICS = 'false';
process.env.CHOKIDAR_USEPOLLING = 'true';
process.env.CHOKIDAR_INTERVAL = '1000';
const {unstable_startWorker} = await import('wrangler');
const workers = [];
let stopping = false;
const server = createServer((incoming, outgoing) => {
  const port = audioPath(incoming.url.split('?')[0]) ? audioPort : appPort;
  const upstream = proxyRequest({hostname: '127.0.0.1', port, path: incoming.url, method: incoming.method, headers: incoming.headers}, response => {
    outgoing.writeHead(response.statusCode, response.headers); response.pipe(outgoing);
  });
  upstream.on('error', () => { if (!outgoing.headersSent) outgoing.writeHead(502); outgoing.end(); });
  incoming.on('aborted', () => upstream.destroy());
  outgoing.on('close', () => { if (!outgoing.writableEnded) upstream.destroy(); });
  incoming.pipe(upstream);
});
async function stop(code = 0) {
  if (stopping) return; stopping = true;
  server.closeAllConnections(); server.close();
  await Promise.all(workers.map(worker => worker.dispose()));
  process.exitCode = code;
}
process.on('SIGINT', () => void stop()); process.on('SIGTERM', () => void stop());
try {
  for (const [port, file] of [[appPort, 'app/server/wrangler.json'], [audioPort, 'audio/wrangler.json']]) {
    const config = JSON.parse(readFileSync(root + '/' + file));
    assert(!config.routes?.length && config.workers_dev === false, 'Only the generated local configuration is allowed');
    // Polling prevents macOS watcher exhaustion; no inspector means no buffered debug responses.
    const worker = await unstable_startWorker({config: root + '/' + file, dev: {
      remote: false, watch: false, inspector: false, liveReload: false,
      server: {hostname: '127.0.0.1', port}, persist: root + '/state', logLevel: 'warn',
    }});
    workers.push(worker); await worker.ready;
    const response = await fetch(`http://127.0.0.1:${port}/release.json`, {method: 'HEAD', signal: AbortSignal.timeout(60000)});
    assert.equal(response.status, port === appPort ? 200 : 404, 'Preview readiness failed');
  }
  server.listen(previewPort, '127.0.0.1', () => console.log(`LOCAL ONLY: http://127.0.0.1:${previewPort} — /package-audio/* uses the static audio server; all other paths use the main app.`));
  server.on('error', error => { console.error(error.message); void stop(1); });
} catch (error) { console.error(error.message); await stop(1); }
