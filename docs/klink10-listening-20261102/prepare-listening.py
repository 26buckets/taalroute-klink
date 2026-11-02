import json, hashlib, subprocess, re
from pathlib import Path
from collections import defaultdict

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parent.parent/'work/klink10-20261102'
OUT=ROOT/'staging/listening';OUT.mkdir(parents=True,exist_ok=True)
DOC=REPO/'docs/klink10-listening-20261102';DOC.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
source=json.loads((ROOT/'staging/luisteren.json').read_text())
voices={'question':'h6uBOiAjLKklte8hdYio','narrator':'0qLmDzgqulxcvv0yf3kg','option':'7qdUFMklKPaaAVMsBTBt','female':'7qdUFMklKPaaAVMsBTBt','male':'60CwgZt94Yf7yYIXMDDe'}
tracked=set(subprocess.check_output(['git','ls-files','public'],cwd=REPO,text=True).splitlines())
catalog={};word_audio=json.loads((REPO/'data/klink-word-listening.json').read_text());policy=json.loads((REPO/'data/klink-audio-policy.json').read_text())
def permitted(src):return src not in policy['withdrawnFiles'] and not any(src.startswith(p) for p in policy['withdrawnPrefixes'])
for p in (REPO/'docs').glob('**/recordings/*.json'):
 try:
  c=json.loads(p.read_text());src=c.get('src','');f=REPO/('public'+src)
  if c.get('status')=='generated-and-verified' and isinstance(c.get('text'),str) and 'public'+src in tracked and f.is_file() and sha(f.read_bytes())==c.get('sha256') and permitted(src):catalog.setdefault((c['text'],c['voiceId']),{**c,'evidence':str(p.relative_to(REPO))})
 except (ValueError,OSError,TypeError):pass
clips={};reused={}
def audio(text,role='narrator',existing=None):
 voice=voices[role];id='k10l-'+sha((voice+'\0'+text).encode())[:16]
 if existing:
  id='k10l-'+sha((existing['voiceId']+'\0'+text+'\0'+existing['src']).encode())[:16]
  src=existing['src'];f=REPO/('public'+src);assert 'public'+src in tracked and f.is_file() and permitted(src);assert existing['voiceId']!=voices['question']
  reused[id]={'id':id,'text':text,'voiceId':existing['voiceId'],'src':src,'sha256':sha(f.read_bytes()),'evidence':'source.existingAudioSequence','sourceTurnId':existing['turnId']};return {'audioId':id,'src':src}
 if (text,voice) in catalog:
  c=catalog[(text,voice)];reused[id]={'id':id,'text':text,'voiceId':voice,'src':c['src'],'sha256':c['sha256'],'evidence':c['evidence']};return {'audioId':id,'src':c['src']}
 if role!='question' and ' ' not in text.strip().rstrip('.'):
  for entry in word_audio.get(text.strip().rstrip('.').lower(),[]):
   src=entry if isinstance(entry,str) else entry['src']
   if not permitted(src) or 'public'+src not in tracked:continue
   f=REPO/('public'+src);b=f.read_bytes()
   if isinstance(entry,dict):b=b[entry['offset']:entry['offset']+entry['length']];src+=f"#bytes={entry['offset']},{entry['length']}"
   reused[id]={'id':id,'text':text,'src':src,'sha256':sha(b),'evidence':'data/klink-word-listening.json'};return {'audioId':id,'src':src}
 c={'id':id,'text':text,'title':text,'role':role,'voiceId':voice,'src':'/package-audio/klink10-listening-20261102/'+id+'.mp3','textSha256':sha(text.encode())};clips[id]=c;return {'audioId':id,'src':c['src']}

groups=defaultdict(list);adaptations=[]
for s in source:
 if s['level'] in ['Alfa A','Alfa B']:continue
 id=s['id'];level=s['level'].lower().replace(' ','-');activity=s['activityCode'];script=s['promptAudioScript'];blocks=[]
 def block(text,role,speaker=None,existing=None):
  b={'id':id+'-source-'+str(len(blocks)+1),'text':text,'audio':audio(text,role,existing)}
  if speaker:b['speaker']=speaker
  blocks.append(b)
 if activity=='suitable-reply':
  context=next(x for x in source if x['level']==s['level'] and x['activityCode']=='text-question' and x['id'].rsplit('-',1)[-1]==id.rsplit('-',1)[-1]);block(context['promptAudioScript'],'narrator');adaptations.append({'id':id,'kind':'add-required-listening-context','sourceId':context['id'],'text':context['promptAudioScript'],'reason':'The isolated reply prompt does not state the situation needed to select its answer.'})
 lines=script.splitlines();dialogue=activity in ['dialogue-question','suitable-reply'] and all(':' in line for line in lines)
 if dialogue:
  names=list(dict.fromkeys(line.split(':',1)[0].strip() for line in lines));female={'Nora','Elena','Fatima','Mina','Sara','Samira','Lotte','Sofia','Amina','Eva'};male={'Omar','Ali','Youssef','Kofi','Abel','Daan','Rachid','Minh'}
  roles={name:'female' if name in female else 'male' for name in names}
  if len(names)==2:
   if names[0] in female|male:roles[names[1]]='male' if roles[names[0]]=='female' else 'female'
   elif names[1] in female|male:roles[names[0]]='male' if roles[names[1]]=='female' else 'female'
   else:roles={names[0]:'male',names[1]:'female'}
  for n,line in enumerate(lines):
   speaker,text=line.split(':',1);speaker=speaker.strip();old=s.get('existingAudioSequence',[]);block(text.strip(),roles[speaker],speaker,old[n] if old else None)
 else:block(script,'narrator')
 options=[];feedback={};correct=[]
 for a in s['answers']:
  label=a['label'];oid=id+'-'+a['id']
  if id=='KLINK-LUI-P01-B1-suitable-reply-001' and a['id']=='C':
   label='Dan kom ik vrijdag. Donderdag is blijkbaar vervallen.';adaptations.append({'id':id,'optionId':a['id'],'old':a['label'],'new':label,'reason':'The original Thursday response could also be a natural correct reply.'})
  options.append({'id':oid,'label':label,'audio':audio(label,'option')});feedback[oid]=('Niet goed. Het gesprek is donderdag, niet vrijdag. Een passende reactie is: Ja, donderdag kan ik. Dank u voor het bericht.' if id=='KLINK-LUI-P01-B1-suitable-reply-001' and a['id']=='C' else a['explanationA2'])
  if a['correct']:correct.append(oid)
 assert len(correct)==1 and correct[0].endswith('-'+s['correctOptionId']) and len({o['label'] for o in options})==len(options)
 e={'exerciseId':id,'componentId':'KLINK-EXTENDED','contractVersion':'1.0','mode':activity,'groupActivity':activity,'contentLevel':level,'vocabularyLevels':[level],'title':s['completeInstructionAudioScript'],'sourceStatus':'reviewed-source-adaptation-20261102','sourceRecordId':id,'assessment':'answer','access':'supported-listening','requiresAudio':True,'manualAdvance':True,'requiresExplicitCompletion':True,'independentReading':False,'reviewEligible':False,'audioOnly':True,'playAllBlocks':True,'transcriptAfterAnswer':True,'prompt':{'audio':blocks[0]['audio']},'sourceBlocks':blocks,'textBlocks':blocks,'sourceText':'\n'.join(b['text'] for b in blocks),'instructionAudio':audio(s['completeInstructionAudioScript'],'question'),'question':s['question'],'questionAudio':audio(s['questionAudioScript'],'question'),'options':options,'answer':{'correctOptionIds':correct},'optionFeedback':feedback,'feedback':'Luister nog eens en probeer opnieuw.','originalSourceId':s.get('originalSourceId')}
 groups[(level,activity)].append(e)
rounds=[]
for (level,activity),exercises in groups.items():
 assert len(exercises)==10
 id='klink10-listening-'+level+'-'+activity;save(OUT/(id+'.json'),{'id':id,'exercises':exercises});rounds.append({'id':id,'level':level,'activity':activity,'help':'practice','image':None,'count':10,'title':'Ronde 1 · Luisteren in het dagelijks leven','stagedFile':id+'.json'})
plan={'application':'Klink','authorization':'Nico, 2 november 2026: tien chats volledig afronden inclusief audio en publiceren','instructionVoiceId':voices['question'],'roleVoices':voices,'model':'eleven_multilingual_v2','outputFormat':'mp3_44100_128','settings':{'stability':0.65,'similarity_boost':0.75,'style':0,'use_speaker_boost':True,'speed':1},'maximumIncludedCredits':80000,'buyExtraCredits':False,'characters':sum(len(c['text']) for c in clips.values()),'clips':list(clips.values())}
for name,data in [('source.json',source),('rounds.json',rounds),('voice-plan.json',plan),('audio-reused.json',list(reused.values())),('adaptations.json',adaptations),('blocked.json',[{'id':s['id'],'reason':'Required context/answer images not provided; generation remains stopped.'} for s in source if s['level'] in ['Alfa A','Alfa B']])]:save(OUT/name,data);save(DOC/name,data)
print(json.dumps({'positions':sum(len(g)for g in groups.values()),'rounds':len(rounds),'newClips':len(clips),'reusedClips':len(reused),'characters':plan['characters'],'adaptations':len(adaptations)}))
