import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, existsSync, rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {prepareStaticAudio} from './prepare-static-audio-local.mjs';

export const audioRoute = {pattern: 'klink.taalroute.nl/package-audio/*', zone_name: 'taalroute.nl'};
export function prepareAudioPublication(source = 'dist', output = 'outputs/static-audio-publication') {
  source = resolve(source); output = resolve(output);
  assert(output !== source && !source.startsWith(output + '/') && !output.startsWith(source + '/'));
  const config = JSON.parse(readFileSync(source + '/server/wrangler.json'));
  assert.equal(config.name, 'taalroute-klink');
  assert.deepEqual(config.routes, [{pattern: 'klink.taalroute.nl', custom_domain: true}]);
  const release = JSON.parse(readFileSync(source + '/client/release.json'));
  assert(release.sourceClean && release.branch === 'main' && /^[a-f0-9]{40}$/.test(release.sourceCommit), 'Clean canonical build required');
  if (existsSync(output)) {
    assert(existsSync(output + '/PREPARED-AUDIO-PUBLICATION'), 'Refuse to replace unrelated output');
    rmSync(output, {recursive: true});
  }
  const result = prepareStaticAudio(source, output);
  writeFileSync(output + '/app/server/wrangler.json', JSON.stringify(config, null, 2) + '\n');
  const audio = {name: 'taalroute-klink-audio', compatibility_date: config.compatibility_date,
    workers_dev: false, preview_urls: false, routes: [audioRoute],
    assets: {directory: './client', html_handling: 'none', not_found_handling: 'none'}};
  writeFileSync(output + '/audio/wrangler.json', JSON.stringify(audio, null, 2) + '\n');
  const headers = output + '/audio/client/_headers';
  writeFileSync(headers, (existsSync(headers) ? readFileSync(headers, 'utf8') : '') + '\n/package-audio/*\n  X-Klink-Audio-Release: ' + release.sourceCommit + '\n');
  rmSync(output + '/LOCAL-ONLY');
  writeFileSync(output + '/PREPARED-AUDIO-PUBLICATION', 'Publish only through npm run deploy. Audio is verified before main loses its audio copies.\n');
  result.localOnly = false;
  writeFileSync(output + '/manifest.json', JSON.stringify(result, null, 2) + '\n');
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.equal(process.argv.length, 2);
  const {assets, free} = prepareAudioPublication();
  console.log(JSON.stringify({assets, free, newMeteredServices: 0}));
}
