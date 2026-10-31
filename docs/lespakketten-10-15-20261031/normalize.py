import json,pathlib,re,hashlib
ROOT=pathlib.Path(__file__).resolve().parent
groups=['sok stop stad','boom boon boot','tand been bord jurk','kaak kaas naam','kook koop maak','maan maand mee meer']
canonical={x['word']:next(w for w in x['matches']if w['id']=='klink-woord-'+x['word'])for x in json.loads((ROOT/'canonical-words.json').read_text())}
framework=['15.3, 15.7','5.1–5.5, 5.8','5.1–5.5, 15.7','4.8–4.9, 10.5–10.8','15.6, 15.7','6.3, 6.9, 7.2, 7.5, 15.8','7.2, 7.5, 10.5–10.8','23.1, 23.3–23.5, 23.7']
def pick(d,*keys,default=''):
 return next((d[k]for k in keys if d.get(k)not in [None,'']),default)
def clean(v):
 if isinstance(v,list):return '\n'.join(map(clean,v))
 if isinstance(v,dict):return '\n'.join(str(k)+': '+clean(x)for k,x in v.items())
 return re.sub(r'(?<!\.)\.{2}(?!\.)','.',str(v)).strip()
def phase(p,i):
 p={k.lower().replace(' ','_'):v for k,v in p.items()}
 mins=pick(p,'tijd','tijd_minuten','tijd_min_schatting','tijd_minuten_schatting',default=2)
 feedback=p.get('feedback',{})
 return dict(title=pick(p,'onderdeel','title'),prompt=clean(pick(p,'op_het_bord','prompt')),visible=clean(pick(p,'zichtbare_inhoud','visible')),studentAction=clean(pick(p,'handeling_cursist','cursisthandeling','handeling','student_action')),action=clean(pick(p,'docenthandeling','teacher_action')),expected=clean(pick(p,'antwoord_model','antwoord_of_model','answer')),hint=clean(pick(p,'hulp','hint')),feedback=clean(pick(p,'feedback_passend',default=feedback.get('passend','')if isinstance(feedback,dict)else feedback)),retry=clean(pick(p,'feedback_niet_passend','feedback_nog_niet','feedback_nog_niet_passend',default=feedback.get('opnieuw','')if isinstance(feedback,dict)else'')),observe=clean(pick(p,'observatie')),materials=clean(pick(p,'benodigd_materiaal','materiaal')),minutes=int(re.search(r'\d+',str(mins))[0]),framework=framework[i])
def sheet(p,i,w,c):
 title=clean(pick(p,'title','instruction','instructie'))
 body=clean(pick(p,'content','cursistinhoud','display','stimulus','visible','visible_content'))
 if p.get('choices'):body+='\n'+'\n'.join('□ '+clean(x)for x in p['choices'])
 if not body:body=clean(pick(p,'instruction','response',default=title))
 return dict(id=f'KPD-{w.upper()}-WB-{c.upper()}-{i+1:02}',number=i+1,title=title,body=body,answer=clean(pick(p,'answer','antwoord')),oral=clean(pick(p,'oral','teacher_oral','oral_script','exacte_voorleestekst')),action=clean(pick(p,'teacher','teacher_note','docentaanwijzing','teacher_action_and_criteria','hint')),criteria=clean(pick(p,'criteria','rubric','beoordelingscriterium','teacher_action_and_criteria',default='Beoordeel de gegeven antwoordvorm; registreer hulp afzonderlijk.')),layout=clean(pick(p,'kind','form','response_type','antwoordruimte','response',default='write')),visual=None)
lessons=[]
for package,group in enumerate(groups,10):
 for w in group.split():
  f=next(p for p in (ROOT/'sources'/w).glob('*.json')if 'Werkbladen en'not in p.name)
  d=json.loads(f.read_text());meta=pick(d,'lesson_kernel','lesson_core','content',default=d)
  sentence=meta['sentence'];text=meta['text'];assert len(text)==3 and text[0]==sentence
  rounds={};sheets={}
  for c,name in zip('abc',['Woord','Zin','Tekst']):
   if package==10:raw=d['board_phases'][name];ws=d['worksheets'][name]
   elif package==11:raw=d['rounds'][name]['phases'];ws=d['rounds'][name]['worksheet']
   elif package==12:raw=d['digibord']['rondes'][name];ws=d['werkbladen'][name]
   elif package==13:raw=[p for p in d['phases']if p['ronde']==name];ws=d['worksheets'][name]
   elif package==14:raw=d['rounds'][name];ws=json.loads(next(f.parent.glob('*Werkbladen*.json')).read_text())['workbooks'][name]
   else:raw=d['board'][name];ws=d['worksheets'][name]
   assert len(raw)==8 and len(ws)==10,(w,c)
   phases=[phase(p,i)for i,p in enumerate(raw)]
   for p in phases:
    for k in ['title','prompt','visible','studentAction','action','expected','hint','observe','materials']:assert p[k],(w,c,k)
   example=w if c=='a'else sentence if c=='b'else'\n'.join(text)
   matches=[s for s in text if s in phases[3]['expected']]
   cards=canonical[w]['segmentation'].split('|')if c=='a'else sentence.split()if c=='b'else(matches[0]if len(matches)==1 else text[1]).split()
   goal=meta.get('meaning',d.get('meaning',canonical[w].get('meaning',w)))
   prior=pick(meta,'prior','known','prereq',default=pick(d,'previous_knowledge','assumptions',default='Controleer betekenis, letters en alle woorden vóór iedere ronde.'))
   rounds[c]=dict(label='Alfa '+c.upper(),goal=goal,example=example,prerequisites=[clean(prior)],tokens=list(dict.fromkeys(re.findall(r"[\w’'-]+",example.lower()))),cards=cards,materials=phases[0]['materials'],bookGoal=f'Gekoppeld aan het Klink-bronwoord {w}; observeer betekenis, horen, lezen en schrijven afzonderlijk.',followUp='Verdeel de rondes over werkelijk ingeroosterde lesmomenten. Bordtijd, papier, pauzes en zelfstandige oefentijd staan apart. Herhaal later zonder direct model.',phases=phases,questions=[],replyModel=text[-1])
   sheets[c]=dict(title=name,level='Alfa '+c.upper(),pdf=f'/docent-werkbladen/lespakketten-10-15/{w}-{name.lower()}.pdf',answerPdf=f'/docent-werkbladen/lespakketten-10-15/{w}-{name.lower()}-antwoorden.pdf',previews=[f'/docent-werkbladen/lespakketten-10-15/{w}-{name.lower()}-{j}.png'for j in [1,2]],answers=[sheet(p,i,w,c)for i,p in enumerate(ws)])
  display=pick(meta,'display',default=pick(d,'display',default=(meta.get('article','')+' '+w).strip()))
  lessons.append(dict(id=w,wordRef=canonical[w]['id'],display=display,sourceLessonId=f'KPD-pakket-{package}-{w}',phases=rounds['a']['phases'],routes=rounds,presentation=dict(imageAlt=goal,phrases=sentence.split(),entryAction=rounds['c']['phases'][0]['studentAction'],ownPrompt=rounds['c']['phases'][6]['prompt'],ownHint=rounds['c']['phases'][6]['hint'],wordUse=rounds['a']['phases'][5]['studentAction']),source=dict(package=package,path=str(f.relative_to(ROOT)),sha256=hashlib.sha256(f.read_bytes()).hexdigest(),sentence=sentence,text=text),worksheet=dict(id=w,title=w.capitalize(),rounds=sheets)))
assert len(lessons)==20
(ROOT/'normalized-lessons.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n')
print('20 lessons, 480 board phases and 600 worksheet tasks normalized')
