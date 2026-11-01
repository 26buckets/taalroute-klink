from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib, json, subprocess
import numpy as np

repo = Path(__file__).resolve().parents[2]
folder = Path(__file__).resolve().parent
plans = [json.loads((folder / f).read_text()) for f in ['voice-plan.json', 'voice-plan-b1.json', 'voice-plan-existing-sentences.json']]
clips = [c for p in plans for c in p['clips']]
prior = json.loads((folder/'audio-file-audit.json').read_text()) if (folder/'audio-file-audit.json').exists() else {'records':[]}
cached = {r['id']:r for r in prior['records']}

def inspect(c):
    path = repo / ('public' + c['src'])
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if cached.get(c['id'],{}).get('sha256') == digest:
        return cached[c['id']]
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_format', '-of', 'json', str(path)]))
    tags = {k.lower():v for k,v in probe['format'].get('tags', {}).items()}
    issues = []
    for key in ['artist', 'album_artist', 'publisher']:
        if tags.get(key) != 'Taalroute':
            issues.append('metadata:' + key)
    if 'Taalroute' not in tags.get('album', ''):
        issues.append('metadata:album')
    if any(word in json.dumps(tags).lower() for word in ['elevenlabs', 'suno', 'openai', 'generator', 'multilingual', 'turbo']):
        issues.append('generator-metadata')
    pcm = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:a:0', '-ac', '1', '-ar', '22050', '-f', 'f32le', '-'])
    samples = np.frombuffer(pcm, dtype='<f4')
    peak = float(np.max(np.abs(samples)))
    rms = float(np.sqrt(np.mean(samples * samples)))
    clipped = int(np.sum(np.abs(samples) >= 0.99999))
    active = np.flatnonzero(np.abs(samples) > 0.002)
    if not len(active):
        issues.append('silent')
    leading = float(active[0] / 22050) if len(active) else None
    trailing = float((len(samples)-active[-1]-1) / 22050) if len(active) else None
    if leading is not None and leading > 2:
        issues.append('long-leading-silence')
    if trailing is not None and trailing > 3:
        issues.append('long-trailing-silence')
    if rms < 0.008:
        issues.append('low-level')
    if clipped > max(10, len(samples) * 0.001):
        issues.append('clipping')
    return {'id':c['id'], 'src':c['src'], 'sha256':digest,
            'metadata':tags, 'fullDecodeVerified':True, 'duration':float(probe['format']['duration']),
            'peak':peak, 'rms':rms, 'clippedSamples':clipped, 'leadingSeconds':leading,
            'trailingSeconds':trailing, 'issues':issues}

with ThreadPoolExecutor(max_workers=4) as executor:
    records = list(executor.map(inspect, clips))
result = {'checked':len(records), 'records':records, 'issues':[r for r in records if r['issues']],
          'humanListeningReview':False}
(folder / 'audio-file-audit.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'checked':len(records), 'issues':[{k:r[k] for k in ['id','issues']} for r in result['issues']]}))
