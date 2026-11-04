"""Keep only timing evidence for our anonymous, explicitly tagged A/B requests."""
import json
import pathlib
import re

root = pathlib.Path('docs/staging-document-wait-20261104')
rows = []
decoder = json.JSONDecoder()
for version in ['baseline', 'candidate']:
    text = pathlib.Path('/tmp/klink-pr12-' + version + '-tail.jsonl').read_text()
    pos = 0
    while True:
        start = text.find('{', pos)
        if start < 0:
            break
        try:
            event, length = decoder.raw_decode(text[start:])
        except json.JSONDecodeError:
            pos = start + 1
            continue
        pos = start + length
        request = (event.get('event') or {}).get('request') or {}
        headers = {key.lower(): value for key, value in request.get('headers', {}).items()}
        marker = headers.get('x-klink-measure-id', '')
        if headers.get('x-klink-perf') != 'pr12-staging-20261104' or not re.fullmatch(r'(?:final-)?r[123]-' + version + r'-[0-7]-(page|asset)', marker):
            continue
        assert event.get('scriptName') == 'klink-pr12-' + version
        rows.append({'id': marker, 'version': version, 'eventTimestamp': event.get('eventTimestamp'), 'wallMs': event.get('wallTime'), 'cpuMs': event.get('cpuTime'), 'outcome': event.get('outcome'), 'workerVersion': (event.get('scriptVersion') or {}).get('id')})
assert len({row['id'] for row in rows}) == len(rows), 'Duplicate request IDs: inspect before combining'
(root / 'worker-timings.json').write_text(json.dumps(rows, indent=2) + '\n')
print('Kept', len(rows), 'own request timing records; no raw headers or IP addresses')
