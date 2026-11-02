import hashlib
import itertools
import json
import subprocess
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent / 'work/klink10-20261102'
OUT = ROOT / 'staging/grammar'
OUT.mkdir(parents=True, exist_ok=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
save = lambda p, d: p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
items = json.loads((ROOT / 'staging/grammatica.json').read_text())
instruction_voice = 'h6uBOiAjLKklte8hdYio'
target_voice = '0qLmDzgqulxcvv0yf3kg'
catalog = {}
tracked = set(subprocess.check_output(['git','ls-files','public'],cwd=REPO,text=True).splitlines())
word_audio = json.loads((REPO / 'data/klink-word-listening.json').read_text())
policy = json.loads((REPO / 'data/klink-audio-policy.json').read_text())
paths = list((REPO / 'docs').glob('**/recordings/*.json')) + [REPO / 'data/klink-production-instructions.json']
for path in paths:
    try:
        data = json.loads(path.read_text())
        for clip in data if isinstance(data, list) else [data]:
            if not all(isinstance(clip.get(k), str) for k in ['text','src','voiceId','sha256']):
                continue
            file = REPO / ('public' + clip['src'])
            if str(file.relative_to(REPO)) in tracked and file.is_file() and sha(file.read_bytes()) == clip['sha256']:
                catalog.setdefault((clip['text'], clip['voiceId']), {**clip, 'evidence': str(path.relative_to(REPO))})
    except (ValueError, OSError, TypeError):
        continue
clips = {}
reused = {}
def audio(text, role='model'):
    voice = instruction_voice if role == 'question' else target_voice
    key = (text, voice)
    id = 'k10-' + sha((voice + '\0' + text).encode())[:16]
    if role == 'model' and ' ' not in text:
        for src in word_audio.get(text.lower(), []):
            if not isinstance(src, str) or src in policy['withdrawnFiles'] or any(src.startswith(p) for p in policy['withdrawnPrefixes']):
                continue
            file = REPO / ('public' + src)
            if file.is_file():
                reused[id] = {'id':id, 'text':text, 'src':src, 'sha256':sha(file.read_bytes()), 'evidence':'data/klink-word-listening.json', 'role':'existing-word-model'}
                return {'audioId':id, 'src':src}
    if key in catalog:
        c = catalog[key]
        reused[id] = {'id':id, 'text':text, 'voiceId':voice, 'src':c['src'], 'sha256':c['sha256'], 'evidence':c['evidence']}
        return {'audioId':id, 'src':c['src']}
    clip = {'id':id, 'text':text, 'title':text, 'role':role, 'voiceId':voice, 'src':'/package-audio/klink10-grammar-20261102/' + id + '.mp3', 'textSha256':sha(text.encode())}
    clips[id] = clip
    return {'audioId':id, 'src':clip['src']}

groups = defaultdict(list)
alternatives = {
    'KGR-AC-MDZ-001':['Ik heb geen tijd vandaag'],
    'KGR-AC-MDZ-002':['De bus komt niet vandaag'],
    'KGR-AC-MDZ-004':['Wij gaan boodschappen doen straks'],
    'KGR-AC-MDZ-005':['Er staat voor het huis een fiets'],
    'KGR-AC-MDZ-006':['De les begint om negen uur morgen'],
    'KGR-AC-MDZ-007':['Zij kan niet komen vandaag'],
    'KGR-AC-MDZ-008':['Mijn collega helpt met de taak mij'],
    'KGR-AC-MDZ-009':['Mijn zoon moet naar de dokter morgen'],
}
activity = {'IDENTIFY_SUBJECT':'grammar-path','ORDER_CARDS':'sentence-build','VERB_CHOICE':'verb-choice','SENTENCE_CHOICE':'content-grammatica'}
source_by_id = {i['id']:i for i in items}
for item in items:
    if item['level'] == 'Alfa A':
        continue
    id = item['id']
    level = item['level'].lower().replace(' ','-')
    act = activity[item['type']]
    e = {'exerciseId':id, 'componentId':'KLINK-EXTENDED', 'contractVersion':'1.0', 'mode':act, 'groupActivity':act, 'contentLevel':level, 'vocabularyLevels':[level], 'title':item['instruction'], 'sourceStatus':'reviewed-source-adaptation-20261102', 'sourceDoc':item['sourceDoc'], 'sourceRecordId':id, 'assessment':'answer', 'access':'self-practice', 'requiresAudio':level.startswith('alfa-'), 'feedback':item['incorrectFeedback'] or 'Kijk naar de zin en probeer het nog eens.'}
    source_text = item['context']
    e.update(manualAdvance=True,requiresExplicitCompletion=True,independentReading=False,reviewEligible=False,sourceDocumentId=item['sourceDoc'].split('/d/')[1].split('/')[0])
    if item['type'] == 'IDENTIFY_SUBJECT':
        model_id = id.replace('-ZMZ-', '-ZOE-')
        source_text = source_by_id[model_id]['answer']
        e['sourceModelId'] = model_id
    source_audio = audio(source_text)
    e['prompt'] = {'audio':source_audio}
    e['sourceBlocks'] = [{'id':id+'-source', 'text':source_text, 'audio':source_audio}]
    e['sourceText'] = source_text
    if item['type'] == 'ORDER_CARDS':
        cards = item['cards']
        orders = [p for p in itertools.permutations(range(len(cards))) if ' '.join(cards[n] for n in p).rstrip('.') == item['answer'].rstrip('.')]
        assert len(orders) == 1, (id, orders)
        e.update(componentId='ALF-CMP-013', items=[{'itemId':id+'-card-'+str(n), 'text':card} for n,card in enumerate(cards)], targetOrderIds=[id+'-card-'+str(n) for n in orders[0]], helpWord=item['answer'], correctFeedback=item['correctFeedback'])
        e['acceptedOrderIds'] = []
        for sentence in alternatives.get(id,[]):
            matches = [p for p in itertools.permutations(range(len(cards))) if ' '.join(cards[n] for n in p) == sentence]
            assert len(matches)==1 and cards[matches[0][0]]==item['startCard'], id
            e['acceptedOrderIds'].append([id+'-card-'+str(n) for n in matches[0]])
        # The established sequence player presents its instruction in the heading.
        e['title'] = item['instruction'].replace('Begin bij de vaste startkaart.', 'Begin met ‘' + (item['startCard'] or '') + '’.')
        e['prompt'] = {'audio':audio('. '.join(cards).replace('..','.'))}
    else:
        e['question'] = item['question'] or item['instruction']
        e['options'] = [{'id':id+'-'+c['position'], 'label':c['text']} for c in item['choices']]
        e['answer'] = {'correctOptionIds':[id+'-'+c['position'] for c in item['choices'] if c['correct']]}
        e['optionFeedback'] = {id+'-'+c['position']:c['feedback'] for c in item['choices']}
        if item['type'] == 'VERB_CHOICE':
            e.update(rule=next(c['feedback'] for c in item['choices'] if c['correct']), sourceModel=item['question'].replace('___',item['answer']))
        if level.startswith('alfa-'):
            # Spoken question and each answer remain independently replayable.
            e['questionAudio'] = audio(e['question'].replace('___','puntje puntje puntje'), 'question')
            for option in e['options']:
                option['audio'] = audio(option['label'])
    groups[(level,act)].append(e)

rounds = []
for (level,act), exercises in groups.items():
    assert len(exercises) == 10
    id = 'klink10-grammar-' + level + '-' + act
    payload = {'id':id, 'exercises':exercises}
    save(OUT / (id+'.json'), payload)
    rounds.append({'id':id,'level':level,'activity':act,'help':'practice','image':None,'count':10,'title':'Ronde 1 · Nieuwe zinnen','stagedFile':id+'.json'})
save(OUT/'rounds.json',rounds)
save(OUT/'audio-reused.json',list(reused.values()))
save(OUT/'voice-plan.json',{'application':'Klink','authorization':'Nico, 2 november 2026: tien chats volledig afronden inclusief audio en publiceren','instructionVoiceId':instruction_voice,'targetVoiceId':target_voice,'model':'eleven_multilingual_v2','outputFormat':'mp3_44100_128','settings':{'stability':0.65,'similarity_boost':0.75,'style':0,'use_speaker_boost':True,'speed':1},'maximumIncludedCredits':50000,'buyExtraCredits':False,'characters':sum(len(c['text']) for c in clips.values()),'clips':list(clips.values())})
save(OUT/'blocked.json',[{'id':i['id'],'reason':'Verplichte passende afbeelding ontbreekt; beeldgeneratie blijft gestopt.'} for i in items if i['level']=='Alfa A'])
print(json.dumps({'rounds':len(rounds),'tasks':sum(r['count']for r in rounds),'newAudio':len(clips),'characters':sum(len(c['text']) for c in clips.values()),'reusedAudio':len(reused),'blocked':40}))
