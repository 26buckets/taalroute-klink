import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {prepareAudioPublication} from './prepare-static-audio-publication.mjs';

// Verify audio first; restore existing versions rather than deleting a live publication.
export async function publishInOrder(actions) {
  try { await actions.audio(); await actions.verifyAudio(); }
  catch (error) { await actions.restoreAudio(); throw error; }
  try { await actions.app(); await actions.verifyApp(); }
  catch (error) { await actions.restoreApp(); await actions.restoreAudio(); throw error; }
}
// Route changes can reach the edge after Wrangler reports success; require two stable probes.
export async function waitForDeployment(check, pause = () => new Promise(resolve => setTimeout(resolve, 1000))) {
  let ready = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    ready = await check() ? ready + 1 : 0;
    if (ready === 2) return;
    await pause();
  }
  throw Error('Deployment did not become stable within the bounded readiness check');
}
export async function verifyPublishedAssets(manifest, base, sourceCommit, output) {
  assert(['https://klink.taalroute.nl', 'http://127.0.0.1:19135'].includes(base));
  let next = 0, verified = 0; const errors = [];
  await Promise.all(Array.from({length: 6}, async () => {
    while (next < manifest.length) {
      const item = manifest[next++];
      try {
        const response = await fetch(base + item.path, {headers: {'Accept-Encoding': 'identity'}, signal: AbortSignal.timeout(30000)});
        assert.equal(response.status, 200, item.path);
        if (item.part === 'audio') assert.equal(response.headers.get('x-klink-audio-release'), sourceCommit, 'Native audio route: ' + item.path);
        const bytes = Buffer.from(await response.arrayBuffer());
        assert.equal(bytes.length, item.bytes, item.path);
        assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256, item.path);
        verified++;
        if (verified % 3000 === 0) console.log('Exact published files:', verified);
      } catch (error) { errors.push({path: item.path, message: error.message}); }
    }
  }));
  const result = {expected: manifest.length, verified, errors};
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  assert.deepEqual(errors, []); assert.equal(verified, manifest.length);
  return result;
}
async function deploy() {
  assert.equal(process.argv.length, 2);
  assert.equal(process.env.npm_lifecycle_event, 'deploy', 'Use npm run deploy, including its publication gate and build');
  const git = (...args) => execFileSync('git', args, {encoding: 'utf8'}).trim();
  assert.equal(git('branch', '--show-current'), 'main'); assert.equal(git('status', '--porcelain'), '');
  const approval = JSON.parse(readFileSync('docs/header-inline-20261110/approval.json'));
  const head = git('rev-parse', 'HEAD');
  assert.equal(git('ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0], head, 'Canonical remote must match checked source');
  assert.equal(approval.audioWorkerPreviouslyExists, true);
  const out = 'outputs/static-audio-publication';
  const prepared = prepareAudioPublication();
  assert.equal(prepared.sourceRelease.sourceCommit, head);
  const live = async () => {
    const response = await fetch('https://klink.taalroute.nl/release.json?publication-check=' + Date.now(), {cache: 'no-store', signal: AbortSignal.timeout(30000)});
    assert.equal(response.status, 200); return response.json();
  };
  const before = await live();
  assert.equal(before.sourceCommit, approval.liveSourceCommit, 'Live changed: stop and rebase');
  assert(before.sourceClean && before.branch === 'main');
  writeFileSync(out + '/live-before.json', JSON.stringify(before, null, 2));
  const authPaths = [resolve(homedir(), 'Library/Preferences/.wrangler/config/default.toml'), resolve(homedir(), '.config/.wrangler/config/default.toml'), resolve(homedir(), '.wrangler/config/default.toml')];
  const authFile = authPaths.find(existsSync);
  const token = process.env.CLOUDFLARE_API_TOKEN || (authFile && readFileSync(authFile, 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)?.[1]);
  assert(token, 'Existing Cloudflare authentication required');
  const account = '5548b64f545259bf01dbaac8d8defd1b', zone = '831e1233f2438efdd095516735914404';
  const api = async path => {
    const response = await fetch('https://api.cloudflare.com/client/v4' + path, {headers: {Authorization: 'Bearer ' + token}, signal: AbortSignal.timeout(30000)});
    return {status: response.status, data: await response.json()};
  };
  const audioBefore = await api(`/accounts/${account}/workers/scripts/taalroute-klink-audio/settings`);
  assert.equal(audioBefore.status, 200, 'Existing static audio publication must be readable');
  assert.deepEqual(audioBefore.data.result.bindings, [], 'Audio remains asset-only');
  const audioDeployments = await api(`/accounts/${account}/workers/scripts/taalroute-klink-audio/deployments`);
  assert.equal(audioDeployments.status, 200);
  assert.deepEqual(audioDeployments.data.result.deployments[0].versions, [{version_id: approval.liveAudioWorkerVersion, percentage: 100}]);
  const deployments = await api(`/accounts/${account}/workers/scripts/taalroute-klink/deployments`);
  assert.equal(deployments.status, 200);
  assert.deepEqual(deployments.data.result.deployments[0].versions, [{version_id: approval.liveWorkerVersion, percentage: 100}]);
  const routes = await api(`/zones/${zone}/workers/routes`);
  assert.equal(routes.status, 200);
  assert.deepEqual(routes.data.result.filter(r => r.pattern.includes('klink.taalroute.nl')).map(({pattern, script}) => ({pattern, script})).sort((a, b) => a.pattern.localeCompare(b.pattern)), approval.liveRoutes, 'Existing audio and legacy routes must be unchanged');
  writeFileSync(out + '/cloud-before.json', JSON.stringify({audioBefore, audioActive: audioDeployments.data.result.deployments[0], active: deployments.data.result.deployments[0], klinkRoutes: routes.data.result.filter(r => r.pattern.includes('klink.taalroute.nl'))}, null, 2));
  const wrangler = (...args) => execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], {stdio: 'inherit', env: {...process.env, WRANGLER_SEND_METRICS: 'false'}});
  mkdirSync(out + '/checks', {recursive: true});
  await publishInOrder({
    audio: () => wrangler('deploy', '--config', out + '/audio/wrangler.json'),
    verifyAudio: async () => {
      const sample = prepared.manifest.find(x => x.part === 'audio');
      await waitForDeployment(async () => {
        const response = await fetch('https://klink.taalroute.nl' + sample.path, {method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(15000)});
        return response.status === 200 && response.headers.get('x-klink-audio-release') === head;
      });
      await verifyPublishedAssets(prepared.manifest.filter(x => x.part === 'audio'), 'https://klink.taalroute.nl', head, out + '/checks/audio.json');
      assert.equal((await live()).sourceCommit, before.sourceCommit, 'Main changed during audio verification');
    },
    restoreAudio: async () => {
      wrangler('rollback', approval.liveAudioWorkerVersion, '--yes', '--config', out + '/audio/wrangler.json');
      const sample = prepared.manifest.find(x => x.part === 'audio');
      await waitForDeployment(async () => {
        const response = await fetch('https://klink.taalroute.nl' + sample.path, {method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(15000)});
        return response.status === 200 && response.headers.get('x-klink-audio-release') === before.sourceCommit;
      });
    },
    app: () => wrangler('deploy', '--config', out + '/app/server/wrangler.json'),
    verifyApp: async () => {
      await waitForDeployment(async () => {
        const current = await live();
        assert([before.sourceCommit, head].includes(current.sourceCommit), 'Unexpected concurrent publication');
        return current.sourceCommit === head;
      });
      await verifyPublishedAssets(prepared.manifest.filter(x => x.part === 'app'), 'https://klink.taalroute.nl', head, out + '/checks/app.json');
    },
    restoreApp: async () => {
      wrangler('rollback', approval.liveWorkerVersion, '--yes', '--config', 'dist/server/wrangler.json');
      await waitForDeployment(async () => (await live()).sourceCommit === before.sourceCommit);
    },
  });
  writeFileSync(out + '/checks/published.json', JSON.stringify({sourceCommit: head, assets: prepared.assets, free: prepared.free, newMeteredServices: 0, publishedAt: new Date().toISOString()}, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await deploy();
