// Read-only download of the deployed version; module names retain their directories.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';

const [account, authFile, output = 'work/live-proof'] = process.argv.slice(2);
if (!account || !authFile) throw Error('Pass the Cloudflare account and existing Wrangler auth-file path.');
const readiness = JSON.parse(readFileSync('data/klink-release-readiness.json'));
const version = readiness.baseline.liveWorkerVersion;
const token = process.env.CLOUDFLARE_API_TOKEN || readFileSync(authFile, 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
if (!token) throw Error('Existing Cloudflare authentication is unavailable.');
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/taalroute-klink`;
const get = async path => {
  const response = await fetch(endpoint + path, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw Error(`Read-only Cloudflare request failed: ${response.status}`);
  return response;
};
const deployments = await (await get('/deployments')).json();
const active = deployments.result?.deployments?.[0];
if (!active?.versions?.some(item => item.version_id === version && item.percentage === 100)) {
  throw Error('Live version has changed; inspect it before proceeding.');
}
const metadata = await (await get(`/versions/${version}`)).json();
const response = await get(`/content/v2?version=${version}`);
if (!response.headers.get('content-type')?.startsWith('multipart/form-data')) throw Error('Expected named Worker modules.');
const form = await response.formData();
const root = resolve(output);
mkdirSync(root, { recursive: true });
const modules = [];
for (const [name, file] of form.entries()) {
  if (typeof file === 'string') throw Error('Unexpected text-only module.');
  if (isAbsolute(name) || name.split('/').includes('..') || name.includes('\\')) throw Error('Unsafe module path.');
  const bytes = Buffer.from(await file.arrayBuffer());
  const target = resolve(root, name);
  if (!target.startsWith(root + '/')) throw Error('Module escapes proof directory.');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  modules.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
writeFileSync(resolve(root, 'download-manifest.json'), JSON.stringify({ date: new Date().toISOString(), version, entrypoint: response.headers.get('cf-entrypoint'), activeDeployment: active, metadata: metadata.result, modules }, null, 2));
console.log(JSON.stringify({ version, modules: modules.length, hasSsrEntrypoint: modules.some(item => item.name === 'ssr/index.js') }));
