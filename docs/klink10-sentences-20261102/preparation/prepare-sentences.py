import json,re,hashlib,subprocess
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parent; REPO=ROOT.parent.parent/'work/klink10-20261102'
DOC=REPO/'docs/klink10-sentences-20261102'; OUT=ROOT/'staging/sentences'
DOC.mkdir(parents=True,exist_ok=True); OUT.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
sources=[];receipts=[]
docids=dict(zip(['alfa-b','alfa-c','a1','a2','b1'],['1QKxQ5oEDI7T06wcr3zZACHOq--alHd4ObNsTrouEiXk','19m2bfuFarGMZonftSOJ9w9wMFh4_bciIcTFTLTNv4s4','1Qs19G1pZxl-HA92at5VuJSGMV2E1ZOOfPoaJdx4YosY','1_ybQ2hGDJatoojiV9oA7spTgXIyYZcCUdwfeU-wNsVU','1SqVArUyAQvYDg7rADh40oJ2OPP7P10imqMTuum2raPc']))
for level,docid in docids.items():
 p=ROOT/'sources'/('zinnen-'+level+'.txt');text=p.read_text();fresh=(ROOT/'staging'/('zinnen-'+level+'-fresh.txt')).read_text();assert text.strip()==fresh.strip()
 (DOC/'sources').mkdir(exist_ok=True);(DOC/'sources'/p.name).write_text(fresh);receipts.append({'documentId':docid,'file':p.name,'sha256':sha(fresh.encode()),'fullTextUnchanged':True})
 text=re.split(r'=+ (?:PRODUCTIE)?RONDE 2 =+',text)[0]
 matches=list(re.finditer(r'(?m)^\d+\. (SZ-[A-Z0-9-]+)\s*$',text))
 for n,m in enumerate(matches):
  raw=text[m.end():matches[n+1].start()if n+1<len(matches)else len(text)].strip(); assert len(raw)<5000
  sources.append({'id':m[1],'level':level,'documentId':docid,'raw':raw})
assert len(sources)==230 and len({s['id']for s in sources})==230
catalog={};source_audio={};reused={};clips={};adaptations=[]
policy=json.loads((REPO/'data/klink-audio-policy.json').read_text());tracked=set(subprocess.check_output(['git','ls-files','public'],cwd=REPO,text=True).splitlines())
def bytes_for(src):
 path,_,fragment=src.partition('#bytes=');assert 'public'+path in tracked;assert path not in policy['withdrawnFiles']and not any(path.startswith(p)for p in policy['withdrawnPrefixes']);b=(REPO/('public'+path)).read_bytes()
 if fragment:o,l=map(int,fragment.split(','));b=b[o:o+l]
 return b
for p in (REPO/'public/practice-content/complete-20261101').glob('klink-zeg-de-zin-*.json'):
 for e in json.loads(p.read_text())['exercises']:
  text=e['displayWord'];a=e['prompt']['audio'];source_audio[e['exerciseId']]=(text,a,str(p.relative_to(REPO)));catalog.setdefault((text,'target'),(a,str(p.relative_to(REPO))))
for p in (REPO/'docs').glob('**/recordings/*.json'):
 try:
  c=json.loads(p.read_text());src=c.get('src','');path=REPO/('public'+src)
  if c.get('status')=='generated-and-verified' and path.is_file() and 'public'+src in tracked and sha(bytes_for(src))==c.get('sha256'):
   role='instruction'if c['voiceId']=='h6uBOiAjLKklte8hdYio'else'target';catalog.setdefault((c['text'],role),({'src':src,'audioId':c['id']},str(p.relative_to(REPO))))
 except (ValueError,TypeError,KeyError,AssertionError):pass
for p in [REPO/'docs/klink10-listening-20261102/import-manifest.json']:
 for src,c in json.loads(p.read_text())['newAudio'].items():
  role='instruction'if c['voiceId']=='h6uBOiAjLKklte8hdYio'else'target';catalog.setdefault((c['text'],role),({'src':src,'audioId':c['id']},str(p.relative_to(REPO))))
voices={'instruction':'h6uBOiAjLKklte8hdYio','target':'0qLmDzgqulxcvv0yf3kg'}
word_audio=json.loads((REPO/'data/klink-word-listening.json').read_text())
def audio(text,role='target',old=None):
 found=old or catalog.get((text,role))
 if not found and role=='target' and ' 'not in text:
  entries=word_audio.get(text.casefold(),[])
  if entries:
   entry=entries[0];src=entry if isinstance(entry,str)else entry['src']+f"#bytes={entry['offset']},{entry['length']}"
   found=({'src':src,'audioId':'word-'+text.casefold()},'data/klink-word-listening.json')
 if found:
  a,evidence=found;reused[a['src']]={'text':text,'src':a['src'],'id':a['audioId'],'sha256':sha(bytes_for(a['src'])),'evidence':evidence};return a
 id='k10s-'+sha((voices[role]+'\0'+text).encode())[:16];clips[id]={'id':id,'text':text,'title':text,'role':role,'voiceId':voices[role],'src':'/package-audio/klink10-sentences-20261102/'+id+'.mp3','textSha256':sha(text.encode())};return {'audioId':id,'src':clips[id]['src']}
groups=defaultdict(list)
for s in sources:
 raw=s['raw'];id=s['id'];level=s['level'];kind=id.split('-')[-2]
 def field(label):
  m=re.search(r'(?m)^'+re.escape(label)+r': (.+)$',raw);assert m,(id,label);return m[1].strip()
 sentence=field('Doelzin en bronvoorbeeld'if 'Doelzin en bronvoorbeeld:'in raw else'Bronzin')if kind=='VWZ'else field('Zin');src=field('Audio');oldid=field('Bron'if re.search(r'(?m)^Bron:',raw)else'Bron- en audio-ID').split(' | ')[0]
 oldtext,olda,evidence=source_audio[oldid]
 if id=='SZ-ALFA-C-VWZ-002':
  assert sentence=='De bus komt om bus uur.' and oldtext=='De bus komt om acht uur.'
  adaptations.append({'id':id,'old':sentence,'new':oldtext,'reason':'Accidental replacement of eight by bus; restore the canonical source sentence and matching existing audio.'});sentence=oldtext
 assert oldtext==sentence and olda['src']==src,(id,oldtext,sentence)
 model=audio(sentence,old=(olda,evidence))
 e={'exerciseId':id,'sourceRecordId':id,'sourceDocumentId':s['documentId'],'sourceDoc':'https://docs.google.com/document/d/'+s['documentId'],'sourceContentIds':[oldid],'sourceStatus':'source-bound-review-20261102','contractVersion':'1.0','contentLevel':level,'vocabularyLevels':[level],'assessment':'answer','manualAdvance':True,'requiresExplicitCompletion':True,'independentReading':False,'reviewEligible':False,'access':'supported-listening','prompt':{'audio':model},'requiresAudio':False,'audioOnly':True,'feedback':'Probeer opnieuw. Je kunt de opname nog eens afspelen.'}
 if kind=='LLM':
  word=re.search(r'Vraag:.*?‘([^’]+)’',raw)[1];question=f"Luister naar de hele zin en lees mee. Tik op het woord '{word}'."
  tokens=[{'id':'word-'+str(m.start()),'text':m[0],'start':m.start(),'end':m.end()}for m in re.finditer(r'\S+',sentence)]
  accepted=[[t['id']]for t in tokens if t['text'].strip('.,!?').casefold()==word.casefold()];assert accepted
  e.update(componentId='KLINK-STANDARD',mode='mark',groupActivity='sentences',requiresAudio=True,title=question,question=f"Waar staat '{word}'?",sourceBlocks=[{'id':id+'-sentence','text':sentence,'audio':model}],standardTask={'kind':'mark','text':sentence,'tokens':tokens,'acceptedSelections':accepted,'help':'Luister nog eens. Lees de hele zin mee en tik op het gevraagde woord.'})
 elif kind=='VWZ':
  word=field('Startwoord');title='Maak een eigen zin met dit woord. Zeg de zin hardop of typ hem. Bekijk daarna het voorbeeld.'
  e.update(componentId='KLINK-EXTENDED',mode='open-sentence',groupActivity='word-sentence',title=title,displayWord=word,prompt={'audio':audio(word)},modelSentence=sentence,modelAudio=model,assessment='participation',sentenceWord=word,acceptanceRule='Self-review or teacher review; never exact matching or automatic grammatical approval.',automaticGrammarScoring=False)
 elif kind=='ZDZ':
  options=[];feedback={};correct=[]
  for letter,label,verdict,reason in re.findall(r'(?m)^([ABC])\. (.+?) \[(GOED|FOUT)\] Uitleg: (.+)$',raw):
   oid=id+'-'+letter;options.append({'id':oid,'label':label,'audio':audio(label)});feedback[oid]=reason
   if verdict=='GOED':correct.append(oid);assert label==sentence
   else:assert label!=sentence
  assert len(options)==3 and len(correct)==1 and len({o['label']for o in options})==3
  e.update(componentId='KLINK-EXTENDED',mode='find-sentence',groupActivity='find-sentence',title='Luister naar de opname. Kies precies wat je hoort.',question='Welke zin hoor je?',questionAudio=audio('Welke zin hoor je?','instruction'),options=options,optionFeedback=feedback,answer={'correctOptionIds':correct},requiresAudio=True,sourceBlocks=[{'id':id+'-sentence','text':sentence,'audio':model}],transcriptAfterAnswer=True)
 elif kind=='MDZ':
  replacements={'SZ-ALFA-B-MDZ-001':'Kunt u dat nog een keer zeggen?','SZ-ALFA-B-MDZ-002':'Moet ik deze doos pakken?','SZ-ALFA-B-MDZ-004':'Hoe laat beginnen we?'}
  if id in replacements:
   original=sentence;sentence=replacements[id];model=audio(sentence);e['prompt']['audio']=model;cards=sentence.split();adaptations.append({'id':id,'old':original,'new':sentence,'reason':'A complete sentence is needed for sentence building; original source/audio preserved.'})
  else:cards=re.findall(r'\[([^\]]+)\]',field('Goede volgorde'));assert ' '.join(cards)==sentence,(id,cards,sentence)
  phases=[re.sub(r"^maak .*?'(.*)'$",r'\1',p)for p in re.findall(r'(?m)^Fase \d+: (.+)$',raw)]
  if phases:assert ' '.join(phases)==sentence,(id,phases,sentence)
  else:phases=[sentence]
  # Split a source card only at a sentence boundary, retaining its other word groups.
  groups_words=[];cursor=0
  for card in cards:words=card.split();groups_words.append((cursor,cursor+len(words),words));cursor+=len(words)
  stages=[];start=0
  for n,phrase in enumerate(phases):
   end=start+len(phrase.split());parts=[' '.join(words[max(start,a)-a:min(end,b)-a])for a,b,words in groups_words if a<end and b>start];assert ' '.join(parts)==phrase
   items=[{'itemId':id+f'-s{n+1}-{i}','text':part}for i,part in enumerate(parts)];order=[x['itemId']for x in items];items=items[1::2]+items[::2]
   stages.append({'items':items,'targetOrderIds':order});start=end
  e.update(componentId='ALF-CMP-013',mode='sentence-build',groupActivity='sentence-build',title='Maak dezelfde zin als in de opname. Zet de kaarten in de juiste volgorde.',**stages[0])
  if len(stages)>1:e['sequenceStages']=stages;adaptations.append({'id':id,'kind':'sentence-phases','sentences':phases,'reason':'Do not mix cards from different sentences.'})
  e['helpWord']=sentence
 elif kind=='TDZ':
  copying=level.startswith('alfa-');title='Kijk naar de zin en typ hem na.'if copying else'Luister naar de opname. Typ precies wat je hoort.'
  e.update(componentId='ALF-CMP-006',mode='sentence-dictation',groupActivity='sentence-dictation',title=title,fields=[{'fieldId':id+'-answer','acceptedAnswers':[sentence]}],helpWord=sentence,writingSourceId=id,sentenceAnswerPolicy='exact-copy'if copying else'dictation',requiresAudio=not copying)
  if copying:e['displayWord']=sentence
 else:raise AssertionError(kind)
 e['instructionAudio']=audio(e['title'],'instruction');groups[(level,e['groupActivity'])].append(e)
rounds=[]
for (level,activity),exercises in groups.items():
 assert len(exercises)==10;id='klink10-sentences-'+level+'-'+activity;save(OUT/(id+'.json'),{'id':id,'exercises':exercises});rounds.append({'id':id,'title':'Ronde 1 · Zinnen in het dagelijks leven','level':level,'activity':activity,'help':'practice','image':None,'count':10,'stagedFile':id+'.json'})
assert len(rounds)==23
plan={'application':'Klink','authorization':'Nico, 2 November 2026: finish and publish ten reviewed chats including audio','instructionVoiceId':voices['instruction'],'roleVoices':voices,'model':'eleven_multilingual_v2','outputFormat':'mp3_44100_128','settings':{'stability':0.65,'similarity_boost':0.75,'style':0,'use_speaker_boost':True,'speed':1},'maximumIncludedCredits':80000,'buyExtraCredits':False,'characters':sum(len(c['text'])for c in clips.values()),'clips':list(clips.values())}
for name,v in [('source.json',sources),('source-recheck.json',receipts),('rounds.json',rounds),('voice-plan.json',plan),('audio-reused.json',list(reused.values())),('adaptations.json',adaptations)]:save(DOC/name,v);save(OUT/name,v)
print(json.dumps({'positions':len(sources),'rounds':len(rounds),'clips':len(clips),'reused':len(reused),'characters':plan['characters'],'stages':sum('kind'in a for a in adaptations)}))
