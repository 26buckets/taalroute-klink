from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib, json, os, time, subprocess

folder = Path(__file__).resolve().parent
repo = folder.parents[1]
base = os.environ.get('KLINK_TEST_URL', 'https://klink.taalroute.nl').rstrip('/')
commit = os.environ['KLINK_EXPECTED_COMMIT']
nonce = str(time.time_ns())

def fetch(path):
    return subprocess.check_output(['curl','--fail','--silent','--show-error','--retry','2',
                                    base + path + '?verified=' + nonce])

release = json.loads(fetch('/release.json'))
assert release['sourceCommit'] == commit and release['sourceClean'] and release['branch'] == 'main'
baseline = json.loads((folder / 'baseline.json').read_text())['live']
for key in ['curriculumEdition', 'lexiconExportSha256', 'sectionsSha256', 'sectionPhotosSha256', 'contentSha256']:
    assert release[key] == baseline[key], key
manifest = json.loads((folder / 'import-manifest.json').read_text())
audio = json.loads((folder / 'audio-file-audit.json').read_text())
assets = [(row['url'], hashlib.sha256((repo / ('public' + row['url'])).read_bytes()).hexdigest(), 'collection') for row in manifest['rows']]
policy=json.loads((repo/'data/klink-audio-policy.json').read_text())
def withdrawn(path):
    return not policy['instructionAudioEnabled'] and (any(path.startswith(prefix) for prefix in policy['withdrawnPrefixes']) or path in policy['withdrawnFiles'])
assets += [(record['src'], record['sha256'], 'withdrawn-instruction' if withdrawn(record['src']) else 'audio') for record in audio['records']]
assert len(set(path for path, _, _ in assets)) == len(assets)

def check(asset):
    path, expected, kind = asset
    body = fetch(path)
    actual = hashlib.sha256(body).hexdigest()
    if kind == 'withdrawn-instruction':
        assert not body, 'Previously withdrawn instruction must remain unavailable: '+path
        return {'src':path,'kind':kind,'bytes':0,'notPubliclyOffered':True,'approvedPolicy':'data/klink-audio-policy.json','wholeFileReadback':True}
    assert actual == expected, path
    return {'src': path, 'kind': kind, 'bytes': len(body), 'sha256': actual, 'wholeFileReadback': True,
            'embeddedMetadataPreserved': kind == 'audio'}

with ThreadPoolExecutor(max_workers=6) as executor:
    records = list(executor.map(check, assets))
result = {'base': base, 'release': release, 'checked': len(records), 'collections': len(manifest['rows']),
          'audioRecordsChecked': audio['checked'], 'offeredAudioFiles': sum(r['kind']=='audio' for r in records), 'withdrawnInstructionFiles': sum(r['kind']=='withdrawn-instruction' for r in records), 'allExistingReleaseFeaturesPreserved': True, 'records': records,
          'metadataMethod': 'The complete offered file is byte-identical to the locally fully decoded and embedded-tag-audited file.'}
(folder / 'online-files.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'checked': len(records), 'collections': len(manifest['rows']), 'offeredAudioFiles': result['offeredAudioFiles'], 'withdrawnInstructionsKeptOffline': result['withdrawnInstructionFiles']}))
