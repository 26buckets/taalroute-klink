from pathlib import Path
import hashlib, json

repo = Path(__file__).resolve().parents[2]
folder = Path(__file__).resolve().parent
sources = folder / 'sources'
connected = json.loads((repo / 'data/klink-connected-content.json').read_text())['items']
known = {b['text'].strip(): b['audio'] for item in connected for b in item['blocks']
         if b.get('audio', {}).get('src') and (repo / ('public' + b['audio']['src'])).is_file()}
old = json.loads((repo / 'docs/leesrondes-audio-20261031/voice-plan.json').read_text())['items']
bindings = {item['id']: {'src': item['src'], 'audioId': 'KLINK-READ-' + item['id']} for item in old}
clips, repeated = [], {}

def bind(identity, text, title, role):
    if identity in bindings:
        return
    if text in known:
        bindings[identity] = known[text]
        return
    if text in repeated:
        bindings[identity] = bindings[repeated[text]]
        return
    female = len(clips) % 2 == 0
    src = '/package-audio/complete-20261101/' + identity.lower() + '.mp3'
    bindings[identity] = {'src': src, 'audioId': 'KLINK-COMPLETE-' + identity}
    clips.append({'id': identity, 'text': text, 'title': title, 'role': role,
                  'gender': 'female' if female else 'male',
                  'voiceId': '7qdUFMklKPaaAVMsBTBt' if female else '0qLmDzgqulxcvv0yf3kg',
                  'voiceName': 'Roos' if female else 'Remko', 'src': src,
                  'textSha256': hashlib.sha256(text.encode()).hexdigest()})
    repeated[text] = identity

for level in ['A1', 'A2']:
    texts = json.loads((sources / f'R7-PORTABLE-IMPORTMODEL-{level}.json').read_text())['texts']
    assert len(texts) == len({t['id'] for t in texts}) == 100
    for t in texts:
        bind(t['id'], t['text'], t['title'], 'external-narrator')
speaking = json.loads((sources / 'opdrachten_500_staging.json').read_text())['items']
assert len(speaking) == len({t['id'] for t in speaking}) == 500
for task in speaking:
    bind(task['id'], task['reference'], task['reference'], 'learner-model-utterance')
assert len({c['id'] for c in clips}) == len(clips)
assert all(c['voiceId'] != 'h6uBOiAjLKklte8hdYio' for c in clips)
plan = {'application': 'Klink', 'date': '2026-11-01', 'authorization': 'owner-instruction.json',
        'model': 'eleven_multilingual_v2', 'outputFormat': 'mp3_44100_128',
        'instructionVoiceId': 'h6uBOiAjLKklte8hdYio',
        'settings': {'stability': 0.65, 'similarity_boost': 0.75, 'style': 0, 'use_speaker_boost': True, 'speed': 1},
        'roles': 'Existing character recordings and voice bindings are unchanged. New voices are external narrators or learner models, not recast characters.',
        'freeVoiceAlternation': 'female/male, continued across new clips; existing good audio reused',
        'maximumIncludedCredits': 300000, 'buyExtraCredits': False,
        'characters': sum(len(c['text']) for c in clips), 'clips': clips, 'bindings': bindings}
(folder / 'voice-plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'newClips': len(clips), 'characters': plan['characters'],
                  'female': sum(c['gender'] == 'female' for c in clips),
                  'male': sum(c['gender'] == 'male' for c in clips),
                  'bindings': len(bindings), 'newAudioStarted': False}))
