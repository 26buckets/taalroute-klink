import concurrent.futures, hashlib, json, pathlib, subprocess, urllib.request, time

root = pathlib.Path('/private/tmp/klink-alfa-c-release-g5faxwol')
out = pathlib.Path(__file__).parent / 'live-files'
out.mkdir(exist_ok=True)
base = 'https://klink.taalroute.nl'
expected_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
def fetch(url):
    for attempt in range(3):
        try:
            return subprocess.check_output(['curl','-fsSL','--max-time','35',url])
        except Exception:
            if attempt == 2: raise
            time.sleep(1)
release = json.loads(fetch(base + '/release.json'))
assert release['sourceCommit'] == expected_commit and release['sourceClean'] and release['branch'] == 'main', release
items = []
for name, category in [('klink-alfa-c-dagelijks-audio.json', 'new'), ('klink-alfa-c-functioneel-audio.json', 'preserved'), ('klink-alfa-c-audio.json', 'preserved')]:
    clips = json.loads((root / 'data' / name).read_text())['clips']
    for c in (clips.values() if isinstance(clips, dict) else clips):
        items.append((c['src'], category))
assert len(items) == 804 and len(set(x[0] for x in items)) == 804
def check(item):
    src, category = item
    data = fetch(base + src)
    digest = hashlib.sha256(data).hexdigest()
    assert digest == hashlib.sha256((root / 'public' / src.lstrip('/')).read_bytes()).hexdigest(), src
    p = out / pathlib.Path(src).name
    p.write_bytes(data)
    probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:format_tags','-of','json',str(p)]))['format']
    tags = {k.lower():v for k,v in probe['tags'].items()}
    assert all(tags.get(k) == 'Taalroute' for k in ['artist', 'album_artist', 'publisher']), (src, tags)
    assert not any(term in ' '.join(tags.values()).lower() for term in ['elevenlabs','suno','openai','multilingual','eleven_v4']), src
    return {'src':src,'category':category,'sha256':digest,'duration':probe['duration'],'metadata':tags}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    audio = list(pool.map(check, items))
bundles = {}
tested = json.loads((root/'docs/klink-alfa-c-dagelijks-20261028/tested-client-bundle.json').read_text())
public_scripts = [root/'dist/client'/key for key in tested if not key.startswith('_next/static/')]
for p in list((root/'dist/client/_next/static').rglob('*')) + public_scripts:
    if p.is_file() and p.suffix in ['.js','.css']:
        relative = p.relative_to(root/'dist/client').as_posix()
        actual = hashlib.sha256(fetch(base+'/'+relative)).hexdigest()
        assert actual == hashlib.sha256(p.read_bytes()).hexdigest(), relative
        bundles[relative] = actual
report = {'release':release,'audio':audio,'clientBundle':bundles,'newAudio':375,'preservedAlfaCAudio':429,'allByteIdentical':True,'allBrandMetadata':True}
(out.parent/'live-files-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['audio','clientBundle']},ensure_ascii=False))
