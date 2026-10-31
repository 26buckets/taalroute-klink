import json,collections
from pathlib import Path
p=Path(__file__).parent; idx=json.load(open('data/klink-production-index.json')); records=[]; audio=collections.defaultdict(set); problems=[]; checked=collections.Counter(); extras=set()
for c in idx:
 for e in json.load(open('public'+c['url']))['exercises']:
  records.append((c,e))
  if e['mode']=='read-series':
   for b in e['textBlocks']:audio[b['audio']['src']].add(b['text'])
def check_audio(e,ref,word,c):
 checked['audioAnswerLinks']+=1
 words=audio.get(ref.get('src'),set())
 if words and word not in words:problems.append({'collection':c['id'],'exerciseId':e['exerciseId'],'kind':'audio-word','word':word,'recordedLabels':sorted(words),'src':ref['src']})
for c,e in records:
 checked['placements']+=1
 if c['level']!=e['contentLevel']:problems.append({'kind':'level','id':e['exerciseId']})
 checked['levelLinks']+=1
 m=e['mode'];a=e.get('answer',{})
 if m=='copy-word':
  checked['copyAnswers']+=1
  if e.get('exampleWord',e['fields'][0]['acceptedAnswers'][0]) not in e['fields'][0]['acceptedAnswers']:problems.append({'kind':'copy-answer','id':e['exerciseId']})
  if e.get('prompt',{}).get('audio'):check_audio(e,e['prompt']['audio'],e.get('exampleWord',e['fields'][0]['acceptedAnswers'][0]),c)
 if m=='word-build':
  checked['tileAnswers']+=1
  result=''.join(next(t['token'] for t in e['tiles'] if t['id']==tid) for tid in a['targetTileIds'])
  if result!=e['helpWord']:problems.append({'kind':'tile-answer','id':e['exerciseId']})
  if e.get('prompt',{}).get('audio'):check_audio(e,e['prompt']['audio'],result,c)
 if m=='word-bingo':check_audio(e,e['prompt']['audio'],next(x['text'] for x in e['cells'] if x['cellId']==a['correctCellId']),c)
 if m=='heard-word':
  for oid in a['correctOptionIds']:check_audio(e,e['prompt']['audio'],next(x['label'] for x in e['options'] if x['id']==oid),c)
 if m=='hear-match':
  for s in e['sources']:
   target=next(t for t in e['targets'] if t['id']==a['mapping'][s['id']]);check_audio(e,s['audio'],target['label'],c)
 if m in ['heard-image','word-image','word-image-match']:
  checked['imageAnswerLinks']+=1
  if a.get('mapping'):
   for k,v in a['mapping'].items():
    if v not in [k,'image-'+k]:problems.append({'kind':'image-mapping','id':e['exerciseId'],'source':k,'target':v})
 if m=='word-sort':
  for item in e['standardTask']['items']:
   checked['sortAnswers']+=1;matches=[]
   for cat in e['standardTask']['categories']:
    label=cat['label']; token=label.split()[-1];w=item['label'].lower()
    good=token not in w if label.startswith('bevat geen') else token in w if label.startswith('bevat') else w.startswith(token) if label.startswith('begint met') else w.endswith(token) if label.startswith('eindigt op') else None
    assert good is not None,label
    if good:matches.append(cat['id'])
   if matches!=[item['categoryId']]:problems.append({'kind':'sort-answer','id':e['exerciseId'],'word':item['label'],'matches':matches})
report={'checked':dict(checked),'problems':problems,'audioSourceLabels':len(audio),'note':'Checks compare word/source labels and answer structure; no listening or visual image audit.'}
(p/'answer-level-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(dict(checked));print('problems',len(problems));print(json.dumps(problems[:18],ensure_ascii=False))
