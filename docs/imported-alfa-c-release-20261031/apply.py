import json,pathlib,hashlib
root=pathlib.Path('.');out=root/'docs/imported-alfa-c-release-20261031'
def read(p):return json.loads(pathlib.Path(p).read_text())
def save(p,x):pathlib.Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
f=read('data/klink-alfa-c-functioneel.json');before=json.loads(json.dumps(f));clips=read('data/klink-alfa-c-functioneel-audio.json')['clips']
for b in f['blocks']:
 for s in b['steps']:
  if s['id'].endswith(('werk-09','werk-10','werk-11','verbinden-09')):
   def replace(v):
    if isinstance(v,str):return v.replace('het boek in de map','het papier in de map').replace('Een boek in een map','Papier in een map').replace('de map en het boek','de map en het papier')
    if isinstance(v,list):return [replace(x)for x in v]
    if isinstance(v,dict):return {k:replace(x)for k,x in v.items()}
    return v
   s.update(replace(s))
new=[]
for b,oldb in zip(f['blocks'],before['blocks']):
 for s,o in zip(b['steps'],oldb['steps']):
  pairs=[('guide',s['instruction'],o['instruction'])]+[('target',v['text'],ov['text'])for v,ov in zip(s['presentation'],o['presentation'])]+[('target',v,ov)for v,ov in zip(s['exampleTargetTexts'],o['exampleTargetTexts'])]
  for role,t,old in pairs:
   if t!=old and not any(c['role']==role and c['text']==t for c in new):
    previous=next(c for c in clips if c['role']==role and c['text']==old)
    new.append({'id':role+'-'+hashlib.sha256(t.encode()).hexdigest()[:12],'role':role,'text':t,'before':old,'voiceId':previous['voiceId'],'originalSrc':previous['src']})
save('data/klink-alfa-c-functioneel.json',f)
save(out/'audio-plan.json',{'authorization':'Nico: volg je advies bij de drie twijfelgevallen; pas gekoppelde opdrachten en antwoorden aan, controleer audio en publiceer de herstelversie.','model':'eleven_v4','settings':{'stability':0.5,'similarity_boost':0.75,'speed':0.9},'instructionVoiceId':'h6uBOiAjLKklte8hdYio','clips':new})
d=read('data/klink-alfa-c-docent.json');t=next(t for t in d['tasks'] if t['id']=='kg-ga-c-02-001')
t['preparation'][-1]='Leer het begrip werkwoord vooraf aan. Doe daarna de gebaren voor wens (wil), mogelijkheid (kan) en plan (gaan) voor en oefen ze samen.'
t['teacherNote']='Begeleide oefening, geen zelfstandige niveautoets. Begin pas wanneer de cursist het begrip werkwoord en de drie afgesproken gebaren kent. Lees de instructies mondeling. Doe eerst met andere voorbeelden een wens, mogelijkheid en plan voor. Laat de cursist daarna zelf aanwijzen of uitleggen; zeg bij de gebarenvragen wil / kan / gaan niet voor. Noteer welke steun nodig was. Beide afdekvarianten zijn betekenisvol. Een nieuwe zin zelf maken hoort niet bij deze opdracht.'
for i in [3,4,5]:
 t['stages'][i]['teacherCue']='Controleer vooraf of de cursist weet wat een werkwoord is. Laat beide woorden aanwijzen; oefen samen opnieuw als dit begrip nog niet duidelijk is.'
for i,label in [(9,'wens'),(10,'mogelijkheid'),(11,'plan')]:t['stages'][i]['teacherCue']=f'Doe het vooraf samen geoefende gebaar voor {label}. Laat de cursist zelf een zin kiezen. Vraag daarna wat de zin betekent; help pas na de eigen reactie.'
save('data/klink-alfa-c-docent.json',d)
print('Audio replacements:',len(new));print([(c['role'],c['voiceId'],c['text'])for c in new])
