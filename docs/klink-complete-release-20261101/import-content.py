from pathlib import Path
import copy, hashlib, json

repo = Path(__file__).resolve().parents[2]
folder = Path(__file__).resolve().parent
read = lambda p: json.loads((repo / p).read_text())
save = lambda p, value: (repo / p).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
baseline = read('docs/klink-complete-release-20261101/baseline.json')
index = read('data/klink-production-index.json')
aliases = read('data/klink-progress-image-aliases-20261030.json')
voices = read('docs/klink-complete-release-20261101/voice-plan.json')['bindings']
destination = repo / 'public/practice-content/complete-20261101'
destination.mkdir(parents=True, exist_ok=True)
rows, runtime_files = [], []

def collection(identity, title, level, activity, exercises, old=None):
    assert exercises and len({e['exerciseId'] for e in exercises}) == len(exercises)
    value = {'id': identity, 'exercises': exercises}
    data = (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
    name = identity.replace(':', '-').replace('/', '-') + '-' + hashlib.sha256(data).hexdigest()[:16] + '.json'
    url = '/practice-content/complete-20261101/' + name
    path = repo / ('public' + url)
    if path.exists():
        assert path.read_bytes() == data
    else:
        path.write_bytes(data)
    if old and old['url'] != url:
        aliases[url] = aliases.get(old['url'], old['url'])
    row = {**(old or {}), 'id': identity, 'title': title, 'level': level,
           'activity': activity, 'help': 'practice', 'image': None, 'url': url, 'count': len(exercises)}
    rows.append(row)
    runtime_files.append('public' + url)

def question(identity, level, activity, text_id, text, title, question, options, correct, feedback, blocks, evidence=None):
    return {'exerciseId': identity, 'componentId': 'KLINK-EXTENDED', 'contractVersion': '1.0',
            'mode': 'text-question', 'groupActivity': activity, 'contentLevel': level,
            'vocabularyLevels': [level], 'sourceContentIds': [text_id],
            'sourceStatus': 'source-bound-editorial-review-20261101',
            'title': 'Lees de tekst. Kies het goede antwoord.' if activity == 'text-question' else 'Luister en lees de zin. Kies één antwoord.',
            'contentTitle': title, 'sourceText': text, 'sourceBlocks': blocks,
            'question': question, 'options': options, 'answer': {'correctOptionIds': [correct]},
            'optionFeedback': feedback, 'correctFeedback': feedback[correct],
            'feedback': 'Lees of luister nog eens. Kijk naar de uitleg bij je antwoord.',
            'assessment': 'answer', 'requiresAudio': False, 'independentReading': False,
            'reviewEligible': False, 'access': 'independent-practice', 'manualAdvance': True,
            'objective': identity, 'sourceEvidenceSegments': evidence or []}

for level in ['a1', 'a2']:
    source = read('docs/klink-complete-release-20261101/sources/R7-PORTABLE-IMPORTMODEL-' + level.upper() + '.json')
    texts = source['texts']
    assert len(texts) == 100 and sum(len(t['questions']) for t in texts) == 400
    old_row = next(r for r in baseline['originalRows'] if r['id'] == f'klink-teksten-zelf-{level}-r01-v1')
    old_exercises = read('public' + old_row['url'])['exercises']
    legacy = []
    for original in old_exercises:
        exercise = copy.deepcopy(original)
        source_text = next(t for t in texts if t['id'] == original['sourceContentIds'][0])
        source_question = next(q for q in source_text['questions'] if q['prompt'] == original['question'])
        assert source_text['text'] == original['sourceText']
        assert [(o['id'], o['label']) for o in original['options']] == [(o['id'], o['label']) for o in source_question['options']]
        assert original['answer']['correctOptionIds'] == [source_question['correctOptionId']]
        exercise['optionFeedback'] = {o['id']: o['explanation'] for o in source_question['options']}
        assert {k:v for k,v in exercise.items() if k != 'optionFeedback'} == original
        legacy.append(exercise)
    collection(old_row['id'], old_row['title'], level, 'text-question', legacy, old_row)
    for start in range(3, 100, 3):
        selected = texts[start:start+3]
        number = start // 3 + 1
        identity = f'klink-teksten-zelf-{level}-r{number:02d}-v1'
        exercises = []
        for t in selected:
            for q in t['questions']:
                exercise_id = q.get('exerciseId') or 'klink-teksten-zelf-' + q['id'].lower()
                e = question(exercise_id, level, 'text-question', t['id'], t['text'], t['title'], q['prompt'],
                             [{'id':o['id'], 'label':o['label']} for o in q['options']], q['correctOptionId'],
                             {o['id']:o['explanation'] for o in q['options']},
                             [{'id':t['id'], 'text':t['text'], 'audio':voices[t['id']]}], q['evidenceSegments'])
                e.update({'readingRoundId': identity, 'sourceQuestionId': q['id'],
                          'sourceDocumentId': '10jmVzyOB0swZPvJFMhIu_7gNyWwEaEN4'})
                exercises.append(e)
        collection(identity, f'Leesronde {number} · ' + ', '.join(t['title'] for t in selected), level, 'text-question', exercises)

sentences = read('docs/klink-complete-release-20261101/sources/KLINK_ZINNEN_200_NATUURLIJKHEID_V23_HOLD_20261101.json')['items']
assert len(sentences) == len({s['id'] for s in sentences}) == 200
for level in ['a1', 'a2']:
    candidates = [s for s in sentences if s['level'].lower() == level]
    old_rows = [r for r in baseline['originalRows'] if r['id'].startswith(f'klink-zinnen-zelf-{level}-')]
    assigned = set()
    groups = []
    for row in old_rows:
        identities = [e['exerciseId'] for e in read('public' + row['url'])['exercises']]
        groups.append((row['id'], row['title'], [next(s for s in candidates if s['id'] == i) for i in identities], row))
        assigned.update(identities)
    pending = [s for s in candidates if s['id'] not in assigned]
    for start in range(0, len(pending), 10):
        n = len(old_rows) + start // 10 + 1
        groups.append((f'klink-zinnen-zelf-{level}-20261031-r{n}', f'Zinnenronde {n}', pending[start:start+10], None))
    for identity, title, items, old in groups:
        exercises = []
        for s in items:
            blocks = [{'id':b['sourceId'], 'text':b['text'], 'audio':b['audio']} for b in s['sourceSegments']]
            assert '\n'.join(b['text'] for b in blocks) == s['sourceText']
            e = question(s['id'], level, 'sentences', s['sourceId'], s['sourceText'], '', s['question'],
                         [{'id':o['id'], 'label':o['text']} for o in s['options']], s['correctOptionId'],
                         {o['id']:o['why'] for o in s['options']}, blocks)
            e.update({'readingRoundId':identity, 'sourceContentIds':[b['id'] for b in blocks],
                      'sourceDocumentId':'1CcYrGyvehO1eJJD7tFuvQa-qAhq_0rVz', 'sourceRound':s['round']})
            exercises.append(e)
        collection(identity, title, level, 'sentences', exercises, old)

speaking = read('docs/klink-complete-release-20261101/sources/opdrachten_500_staging.json')['items']
levels = {'Alfa B':'alfa-b', 'Alfa C':'alfa-c', 'A1':'a1', 'A2':'a2', 'B1':'b1'}
instruction = read('data/klink-audio-bindings.json')['groep-zin-nazeggen']
assert instruction['role'] == 'instruction' and instruction['voiceId'] == 'h6uBOiAjLKklte8hdYio'
for source_level, level in levels.items():
    items = [s for s in speaking if s['level'] == source_level]
    assert len(items) == 100
    for start in range(0, 100, 10):
        n = start // 10 + 1
        identity = f'klink-zeg-de-zin-{level}-r{n:02d}'
        exercises = []
        for s in items[start:start+10]:
            exercises.append({'exerciseId':s['id'], 'componentId':'ALF-CMP-009', 'contractVersion':'1.0',
                              'mode':'sentence-speak', 'groupActivity':'sentence-speak', 'contentLevel':level,
                              'vocabularyLevels':[level], 'title':'Luister en zeg de zin na.',
                              'displayWord':s['reference'], 'helpWord':s['reference'], 'prompt':{'audio':voices[s['id']]},
                              'instructionAudio':{'audioId':'groep-zin-nazeggen', 'src':instruction['src']},
                              'assessment':'participation', 'requiresAudio':True, 'manualAdvance':True,
                              'independentReading':False, 'reviewEligible':False, 'access':'supported-listening',
                              'sourceContentIds':[s['id']], 'sourceDocumentId':'17mGufKogCQjVZ8un9O_0FwpvgTNdMbkH',
                              'sourceStatus':'source-bound-editorial-review-20261101', 'objective':s['id'],
                              'acceptanceRule':s['acceptance_rule'], 'automaticPronunciationScoring':False})
        collection(identity, f'Zeg de zin · Ronde {n}', level, 'sentence-speak', exercises)

b1 = read('docs/klink-complete-release-20261101/sources/b1-source-texts.json')
b1_voices = read('docs/klink-complete-release-20261101/voice-plan-b1.json')['bindings']
repairs = {}
for line in (folder / 'b1-question-repairs.tsv').read_text().splitlines():
    fields = line.split('|')
    assert len(fields) == 8
    assert fields[0] not in repairs
    repairs[fields[0]] = fields[1:]
assert len(repairs) == 114 and len(b1) == 120
review = []
for text in b1:
    number = text['id'][-3:]
    if number not in repairs:
        assert 19 <= int(number) <= 24
        continue
    source = copy.deepcopy(text['questions'][1])
    prompt, correct, wrong1, wrong2, why, why1, why2 = repairs[number]
    q = text['questions'][1]
    q['question'] = prompt
    wrong = iter([(wrong1, 'Niet goed. ' + why1), (wrong2, 'Niet goed. ' + why2)])
    for option in q['options']:
        option['label'], option['feedback'] = (correct, 'Goed. ' + why) if option['id'] == q['correctOptionId'] else next(wrong)
    assert q['correctOptionId'] == source['correctOptionId']
    review.append({'textId':text['id'], 'sourceQuestion':source, 'revisedQuestion':copy.deepcopy(q),
                   'review':'editorial; combine information, evaluate conditions, or apply to a new situation',
                   'questionOneRetainedAsSupportingRetrieval':True, 'humanReview':False, 'learnerPilot':False})
for start in range(0, 120, 6):
    number = start // 6 + 1
    identity = f'klink-flitslezen-b1-r{number:02d}'
    exercises = []
    for t in b1[start:start+6]:
        for q in t['questions']:
            e = question(q['id'], 'b1', 'text-question', t['id'], t['text'], t['title'], q['question'],
                         [{'id':o['id'], 'label':o['label']} for o in q['options']], q['correctOptionId'],
                         {o['id']:o['feedback'] for o in q['options']},
                         [{'id':t['id'], 'text':t['text'], 'audio':b1_voices[t['id']]}])
            e.update({'readingRoundId':identity, 'sourceDocumentId':t['sourceId'],
                      'sourceQuestionId':q['id'], 'sourceLevelReview':'B1-candidate; independent field validation open'})
            exercises.append(e)
    collection(identity, f'Flitslezen · Ronde {number}', 'b1', 'text-question', exercises)
save('docs/klink-complete-release-20261101/b1-question-review.json', review)

replaced = {r['id'] for r in rows}
assert len(replaced) == len(rows)
final = [r for r in index if r['id'] not in replaced] + rows
assert len({r['id'] for r in final}) == len(final)
save('data/klink-production-index.json', final)
save('data/klink-progress-image-aliases-20261030.json', aliases)
save('docs/klink-complete-release-20261101/import-manifest.json', {'rows':rows, 'runtimeFiles':runtime_files,
      'textCount':200, 'textQuestions':800, 'sentenceQuestions':200, 'speakingTasks':500,
      'b1Texts':120, 'b1Questions':240, 'b1QuestionRevisions':len(review),
      'existingReadingQuestionsRetained':24, 'existingTextAudioRetained':6,
      'appearanceChanged':False, 'automaticPronunciationScoring':False})
print(json.dumps({'rows':len(rows), 'readingQuestions':800, 'sentenceQuestions':200, 'speakingTasks':500, 'b1Questions':240}))
