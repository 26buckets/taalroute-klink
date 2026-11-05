import base64
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

root = Path('docs/reading-comprehension-20261105')
out = Path(os.environ.get('EVIDENCE_DIR', str(root / 'local')))
out.mkdir(parents=True, exist_ok=True)
base = os.environ.get('BASE_URL', 'https://klink.taalroute.nl')
words = json.loads((root / 'local/word-coverage.json').read_text())
sources = sorted({x['source'] if isinstance(x['source'], str) else x['source']['src'] for x in words})
assets = json.loads(Path('data/klink-grammar-aa-assets.json').read_text())

def offered(src):
    body = subprocess.check_output(['curl', '-fsS', '--retry', '2', '--max-time', '45', base + src])
    local = base64.b64decode(assets[src.rsplit('/', 1)[1]]['body']) if src.startswith('/api/grammar-aa-assets/') else Path('public' + src).read_bytes()
    assert body == local, src
    return src, body

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    offered_bytes = dict(pool.map(offered, sources))

def check(row):
    r = row['source']
    src = r if isinstance(r, str) else r['src']
    body = offered_bytes[src]
    if isinstance(r, dict):
        body = body[r['offset']:r['offset'] + r['length']]
        assert len(body) == r['length']
    with tempfile.NamedTemporaryFile(suffix='.audio') as f:
        f.write(body)
        f.flush()
        metadata = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_format', '-of', 'json', f.name]))['format']
        tags = {k.lower(): v for k, v in metadata.get('tags', {}).items()}
        assert tags.get('artist') == 'Taalroute', (row['word'], tags)
        assert tags.get('album_artist') == 'Taalroute', (row['word'], tags)
        assert tags.get('publisher') == 'Taalroute', (row['word'], tags)
        assert tags.get('album'), (row['word'], tags)
        assert float(metadata['duration']) > 0
        subprocess.run(['ffmpeg', '-v', 'error', '-i', f.name, '-f', 'null', '-'], check=True, capture_output=True)
    return dict(word=row['word'], source=r, bytes=len(body), sha256=hashlib.sha256(body).hexdigest(), metadata=tags, exactBytes=True, metadataPassed=True, fullDecode=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(check, words))
(out / 'media.json').write_text(json.dumps(dict(base=base, recordings=results, uniqueOfferedFiles=len(sources), newMedia=0, humanListeningPerformed=False), ensure_ascii=False, indent=2) + '\n')
print(f'PASS {len(results)} existing word recordings, exact offered bytes, embedded Taalroute metadata and full decode.')
