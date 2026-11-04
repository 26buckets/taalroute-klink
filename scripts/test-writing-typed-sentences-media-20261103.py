import hashlib, json, os, pathlib, subprocess, tempfile, urllib.request

folder = pathlib.Path('docs/writing-typed-sentences-20261103')
report = json.loads((folder / 'audio-review.json').read_text())
base = os.environ.get('KLINK_TEST_BASE', 'http://127.0.0.1:19034')
output = pathlib.Path(os.environ.get('KLINK_TEST_OUTPUT', str(folder / 'local')))
sha = lambda b: hashlib.sha256(b).hexdigest()
url = base + report['bundle']['src']
with urllib.request.urlopen(url) as response:
    packed = response.read()
assert sha(packed) == report['bundle']['sha256']
checks = []
with tempfile.TemporaryDirectory() as tmp:
    wav = pathlib.Path(tmp) / 'clip.wav'
    for item in report['selected']:
        start, length, record = item['offset'], item['length'], item['record']
        end = start + length - 1
        req = urllib.request.Request(url, headers={'Range': f'bytes={start}-{end}'})
        with urllib.request.urlopen(req) as response:
            assert response.status == 206
            assert response.headers['Content-Range'] == f'bytes {start}-{end}/{len(packed)}'
            data = response.read()
        assert len(data) == length and data == packed[start:end+1] and sha(data) == record['sha256']
        wav.write_bytes(data)
        tags = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags','-of','json',str(wav)]))['format']['tags']
        assert tags == record['metadata']
        assert all(tags[k] == 'Taalroute' for k in ('artist','album_artist','publisher'))
        pcm = subprocess.check_output(['ffmpeg','-v','error','-i',str(wav),'-f','s16le','-acodec','pcm_s16le','-'])
        assert sha(pcm) == record['pcmSha256']
        checks.append(dict(role=item['role'], sha256=sha(data), pcmSha256=sha(pcm), metadata=tags, httpRangeVerified=True))
assert len(checks) == 3
output.mkdir(parents=True, exist_ok=True)
(output / 'media.json').write_text(json.dumps(dict(base=base, checks=checks), indent=2) + '\n')
