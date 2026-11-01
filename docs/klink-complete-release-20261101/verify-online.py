from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib, json, os, time, urllib.request

folder = Path(__file__).resolve().parent
repo = folder.parents[1]
base = os.environ.get('KLINK_TEST_URL', 'https://klink.taalroute.nl').rstrip('/')
commit = os.environ['KLINK_EXPECTED_COMMIT']
nonce = str(time.time_ns())

def fetch(path):
    request = urllib.request.Request(base + path + '?verified=' + nonce, headers={'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=60) as response:
        assert response.status == 200
        return response.read()

release = json.loads(fetch('/release.json'))
assert release['sourceCommit'] == commit and release['sourceClean'] and release['branch'] == 'main'
baseline = json.loads((folder / 'baseline.json').read_text())['live']
for key in ['curriculumEdition', 'lexiconExportSha256', 'sectionsSha256', 'sectionPhotosSha256', 'contentSha256']:
    assert release[key] == baseline[key], key
manifest = json.loads((folder / 'import-manifest.json').read_text())
audio = json.loads((folder / 'audio-file-audit.json').read_text())
assets = [(row['url'], hashlib.sha256((repo / ('public' + row['url'])).read_bytes()).hexdigest(), 'collection') for row in manifest['rows']]
assets += [(record['src'], record['sha256'], 'audio') for record in audio['records']]
assert len(set(path for path, _, _ in assets)) == len(assets)

def check(asset):
    path, expected, kind = asset
    body = fetch(path)
    actual = hashlib.sha256(body).hexdigest()
    assert actual == expected, path
    return {'src': path, 'kind': kind, 'bytes': len(body), 'sha256': actual, 'wholeFileReadback': True,
            'embeddedMetadataPreserved': kind == 'audio'}

with ThreadPoolExecutor(max_workers=6) as executor:
    records = list(executor.map(check, assets))
result = {'base': base, 'release': release, 'checked': len(records), 'collections': len(manifest['rows']),
          'audioFiles': audio['checked'], 'allExistingReleaseFeaturesPreserved': True, 'records': records,
          'metadataMethod': 'The complete offered file is byte-identical to the locally fully decoded and embedded-tag-audited file.'}
(folder / 'online-files.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'checked': len(records), 'collections': len(manifest['rows']), 'audioFiles': audio['checked']}))
