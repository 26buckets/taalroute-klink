import json,pathlib,subprocess,hashlib,copy,re,collections
D=pathlib.Path('docs/long-content-review-20261030'); baseline='52acd5b5'; before=json.loads((D/'before.json').read_text()); refs={}
for kind,prefix in [('text','T'),('dialogue','D')]:
 for i,x in enumerate([x for x in before if x['kind']==kind],1):refs[f'{prefix}{i:03}']=x['id']
files=['data/klink-connected-content.json','data/klink-content-routing.json','data/klink-dialogue-repair.json','data/klink-functional-writing.json','data/klink-imported-practice.json','public/content-register/active.json']
original={f:json.loads(subprocess.check_output(['git','show',baseline+':'+f])) for f in files}; data=copy.deepcopy(original)
bank=data[files[0]]['items']; by={x['id']:x for x in bank}; repair={x['id']:x for x in data[files[2]]['dialogues']}; writing={x['contentId']:x for x in data[files[3]]['items']}; changes=[]
def fix(ref,field,new,reason):
 x=by[refs[ref]]; obj=x
 for k in field[:-1]:obj=obj[k]
 old=obj[field[-1]];assert old!=new;obj[field[-1]]=new;changes.append({'ref':ref,'contentId':x['id'],'field':'.'.join(map(str,field)),'before':old,'after':new,'reason':reason})
for ref,title in {'T047':'Wie haalt het kind op?','T095':'Het paard niet voeren','T103':'Een kleur kiezen','D061':'Naar de juiste startplek','D070':'Verf voor de voordeur'}.items():
 fix(ref,['title'],title,'De oude titel suggereerde een verandering of gebeurtenis die niet in de bron staat.')
 id=refs[ref]
 if id in writing:writing[id]['title']=title
 if id in repair:
  repair[id]['title']=title
  for turn in repair[id]['turns']:turn['title']=title
fix('T171',['discussion','question'],'Wat krijgt Said cadeau?','Het cadeau is een boek; de bron beschrijft geen verpakking met een inhoud.')
fix('D116',['discussion','question'],'Waar wil Erik opgehaald worden?','De bron noemt een gewenste ophaalplek; er staat niet dat Erik daar al wacht.')
fix('D077',['discussion','distractors',0],'Vanmiddag om drie uur.','Drie uur is geen tijdstip in de avond; ook een fout antwoord moet logisch Nederlands zijn.')
# Written tasks do not inherit invented delay or awkward positional language.
x=writing[refs['D056']];changes.append({'ref':'D056','contentId':x['contentId'],'field':'writingTask','before':{k:x[k] for k in ['prompt','example','criteria']},'after':{'prompt':'Schrijf je afspraakgenoot wanneer jullie het schip kunnen bekijken en waar je wacht.','example':'We kunnen het schip over ongeveer een half uur bekijken. Ik wacht bij de ingang.','criteria':['Je noemt over ongeveer een half uur.','Je noemt waar je wacht.']},'reason':'De bron noemt een wachttijd, maar geen vertraging ten opzichte van een geplande begintijd.'});x.update(changes[-1]['after'])
x=writing[refs['D070']];changes.append({'ref':'D070','contentId':x['contentId'],'field':'writingTask.example','before':x['example'],'after':'Ik zoek blauwe buitenverf voor mijn voordeur.','reason':'Buitenverf benoemt het bedoelde product natuurlijker dan een voordeur buiten.'});x['example']=changes[-1]['after']
plan=json.loads((D/'production-plan.json').read_text());clips=[]
for c in plan['clips']:
 clip=json.loads((D/(c['id']+'.json')).read_text());assert clip['status']=='candidate' and clip['metadataVerified'];clips.append(clip)
 x=by[c['contentId']];a,b=c['before'],c['after'];assert a in x['text'];x['text']=x['text'].replace(a,b);x['humanReview']='open'
 for bk in x['blocks']:
  if bk['id']==c['blockId']:bk['text']=c['text'];bk['audio']['src']=clip['src']
 if x.get('discussion'):x['discussion']['evidence']=x['discussion']['evidence'].replace(a,b)
 changes.append({'ref':c['id'].upper(),'contentId':x['id'],'field':'text','before':a,'after':b,'reason':c['reason'],'audio':clip['src']})
 if x['kind']=='dialogue':
  t=next(t for t in repair[x['id']]['turns'] if t['id']==c['blockId']);t['text']=clip['text'];t['originalSrc']=clip['src']
  for k in ['src','status','voiceId','humanListeningReview','requestId','historyItemId','sha256','originalSha256','metadata','duration','metadataVerified','audioPacketsUnchanged']:t[k]=clip[k]
  t.pop('characterCost',None)
# Update dependent copies only where the exact amended source sentence occurs.
reps={c['before']:c['after'] for c in plan['clips']}
def replace(obj):
 if isinstance(obj,str):
  for a,b in reps.items():obj=obj.replace(a,b)
  return obj
 if isinstance(obj,list):return [replace(x) for x in obj]
 if isinstance(obj,dict):return {k:replace(v) for k,v in obj.items()}
 return obj
data[files[4]]=replace(data[files[4]])
for old,x in zip(original[files[4]]['items'],data[files[4]]['items']):
 if x!=old and x.get('teacherWorkflow'):
  material=copy.deepcopy(x);material['teacherWorkflow'].pop('sourceHash',None);x['teacherWorkflow']['sourceHash']=hashlib.sha256(json.dumps(material,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
# Reading preparation tracks the actual new forms; canonical semantic lesson targets stay intact.
words=json.load(open('data/klink-curriculum.json'))['words'];wby={w['id']:w for w in words};surface={w['word'].lower():w['id'] for w in words}
for c in clips:
 x=by[c['contentId']];tokens=list(dict.fromkeys(re.findall(r"[\w]+(?:['’][\w]+)?",x['text'].lower())))
 x['readingWordIds']=[id for id in x['readingWordIds'] if wby[id]['word'].lower() in tokens]
 for token in tokens:
  if token in surface and surface[token] not in x['readingWordIds']:x['readingWordIds'].append(surface[token])
 x['reading']['outsideWordBank']=[t for t in tokens if t not in surface]
 meanings=x['reading'].get('meaningOverrides',{})
 for id in list(meanings):
  if id not in x['readingWordIds']:del meanings[id]
 if 'klink-woord-haar' in x['readingWordIds']:meanings['klink-woord-haar']='Haar geeft hier aan dat iets van de genoemde vrouw is; het betekent hier niet hoofdhaar.'
 if meanings:x['reading']['meaningOverrides']=meanings
 else:x['reading'].pop('meaningOverrides',None)
for row in data[files[1]]['items']:
 if row['id'] in by:row['textHash']=hashlib.sha256(by[row['id']]['text'].encode()).hexdigest()
# Questions and answers have no recording here; keep missing status instead of attaching stale audio.
for row in data[files[5]]:
 for c in clips:
  if row.get('src')==c['originalSrc'] and row.get('text') in [c['text'].replace(c['after'],c['before']),c['text']]:
   row['text']=c['text'];row['src']=c['src'];row['voiceId']=c['voiceId'];row['review']='Tekstherstel; technische audiocontrole uitgevoerd, menselijke luisterreview open.'
 for ref in ['T171','D116','D077','D056']:
  id=refs[ref];x=by[id]
  wanted=None
  if row['id']==id+':question':wanted=x['discussion']['question']
  if ref=='D077' and row['id']==id+':answer:1':wanted=x['discussion']['distractors'][0]
  if ref=='D056' and row['id']==id+'-write:prompt':wanted=writing[id]['prompt']
  if wanted and row['text']!=wanted:
   assert row.get('status')=='missing' and not row.get('src');row['text']=wanted
# The written output is independently levelled; listening does not lower a writing task automatically.
writing_changes={'D030':'A1','D045':'A1','D047':'A1','D061':'A1','D112':'A1','D108':'A2'}
for ref,level in writing_changes.items():writing[refs[ref]]['level']=level
# Explicit editorial exceptions following a full read of all 320 sources and 120 linked writing tasks.
level_changes={
'T041':('A2','Voltooide tijd en een voordat-zin combineren een eerdere voorbereiding met de volgorde van ophalen.'),
'T054':('A2','Totdat plus een ingebedde dat-zin en het antwoord toestemming vragen meer dan een losse plaats of tijd herkennen.'),
'T079':('A2','De indirecte vraag, de passieve vorm bedoeld wordt en de verduidelijkingsvraag maken dit een A2-situatie.'),
'T149':('A2','De volgorde moet over voordat en als heen worden gevolgd; de vraag verwijst terug naar de handeling vóór vertrek.'),
'T173':('A2','Niet weten of en voordat leggen een verband tussen twijfel, navragen en pas daarna instappen.'),
'T174':('A2','De technische woorden gardes, stopcontact en uitschakelen komen samen met meerdere tijdsrelaties en een precieze veiligheidsvolgorde.'),
'T012':('A1','Een concrete reeks eenvoudige dagelijkse handelingen; de vraag vraagt alleen wat Elena tijdens het wachten doet.'),
'T096':('A1','Een concreet verkeerd bezorgde brief, korte hoofdzinnen en een direct beschreven handeling; postwoorden mondeling voorbereiden.'),
'D108':('A2','Stoofgerecht en welk vlees daarvoor geschikt is vragen een productspecifieke woordenschat en een ingebedde vraag.'),
'D016':('A1','Een korte winkeluitwisseling met duurder/goedkoper als concrete keuze; de begripsvraag vraagt welke rok.'),
'D030':('A1','Een pakje ophalen wordt met korte vragen en expliciete tijdstippen afgesproken.'),
'D045':('A1','Een alledaagse boodschappenaanvulling; het ene gevraagde aantal staat rechtstreeks in de laatste beurt.'),
'D047':('A1','Een kleine portie vragen en bevestigen met korte, vaste eetformules.'),
'D053':('A1','Een eenvoudig gebrek melden en een plek aanwijzen; vier korte beurten zonder ingewikkelde uitleg.'),
'D056':('A1','Een eenvoudige wanneer-vraag met expliciete wachttijd en een concrete wachtplek.'),
'D061':('A1','Een concrete plek navragen en een korte routecorrectie; de vraag vraagt alleen de huidige plek.'),
'D064':('A1','Twee concrete huisnummers vergelijken en de brief bij het genoemde nummer bezorgen; geen verborgen gevolgtrekking.'),
'D087':('A1','Een ontbrekend dagelijks product noemen, om meenemen vragen en kort bevestigen.'),
'D112':('A1','Er zijn wortels en geen tomaten: een korte, concrete voorraadkeuze met een direct antwoord.'),
'D126':('A1','De vertrektijd verandert van tien naar elf; de spreker herhaalt en controleert één expliciet tijdstip.')}
# True owner decisions are content choices or borderline language demands, not routine repairs.
doubts=[
 {'id':'kookpersonen','refs':['T192','D128'],'question':'Zijn de leestekst Samen koken en het gesprek Een ander ingrediënt één doorlopende situatie, of bewust twee varianten?','recommendation':'Maak er één situatie met Sara en Ali van, zoals in beide oorspronkelijke bronnen. Beslis dan ook wie de biet koopt.','reason':'De oorspronkelijke dialoog noemt Ali, maar de expliciet gepubliceerde stemversie vervangt hem door Daan. Bovendien neemt in de tekst Ali de biet mee en koopt in het gesprek Sara die. Alleen een naam omzetten zou de vaste stem en de boodschappenafspraak niet herstellen.','status':'owner-review','unchanged':True},
 {'id':'reisniveau','refs':['T153'],'question':'Wil je Het document controleren als begeleide A2-tekst houden, of de huidige formulering bij B1 plaatsen?','recommendation':'Voorlopig begeleid A2 houden en eisen, bestemming, geldig en geldigheidsdatum vooraf bespreken; toets dit met de doelgroep.','reason':'De situatie is alledaags, maar de formele woordenschat en het vergelijken van officiële informatie liggen aan de bovengrens van A2. Zelfstandig officiële reiseisen lezen wordt hiermee niet getoetst.','status':'owner-review','alternativeLevel':'B1'},
 {'id':'textielniveau','refs':['T179'],'question':'Wil je Textiel inleveren op A2 met woordvoorbereiding houden, of de huidige formulering naar B1 verplaatsen?','recommendation':'Voorlopig begeleid A2; vereenvoudig bij een volgende inhoudsronde accepteert, aan voorwaarden voldoen en een andere bestemming als juist zelfstandig A2 het doel is.','reason':'Het concrete sorteergedrag past bij A2, maar de relatieve bijzin en formele woordgroepen zijn merkbaar zwaarder dan in de andere A2-teksten.','status':'owner-review','alternativeLevel':'B1'}]
notes={
'T011':'Pil in verpakking is begrijpelijk; pillen of medicijn klinkt vaak natuurlijker. Behouden vanwege het doelwoord pil; geen grammaticale fout.',
'D007':'De verpakking van deze pil is begrijpelijk, maar pillen/medicijn is gebruikelijker. Doelwoord pil behouden.',
'D032':'Ik bel de opvang dat jij komt is spreektaal. Om te zeggen dat jij komt is explicieter, maar een extra opname is hier geen noodzakelijk herstel.',
'D038':'Tochten die nog plaats hebben is begrijpelijke spreektaal; op welke tochten nog plaats is is een mogelijk stijlalternatief.',
'D040':'Bij Nee, nog niet. Ja, daar ligt hij! is een kijkpauze in de uitvoering nodig. Alleen tekstcontrole bewijst die pauze niet.',
'D085':'Dat zoek ik na is begrijpelijk; dat vraag ik na klinkt in deze dienstverleningssituatie vaak natuurlijker. Geen ondubbelzinnige taalfout.',
'T134':'De vraag bedoelt de twee genoemde blauwe pennen. Er wordt niet beweerd dat alle pennen in het lokaal blauw zijn.',
'T153':doubts[1]['reason'],'T179':doubts[2]['reason'],'T192':doubts[0]['reason'],'D128':doubts[0]['reason'],
'D116':'Opgehaald worden is hier een vaste taxiformule. Een passieve vorm maakt een concrete A1-uitwisseling niet op zichzelf A2.',
'T142':'Rekenen met wisselgeld is een aparte ondersteuningsbehoefte; geen zelfstandig bewijs van taalniveau.',
'T155':'Het omrekenen per kilo vraagt ook rekenvaardigheid; bespreek die apart van tekstbegrip.',
'D102':'Het rekenresultaat wordt letterlijk uitgesproken. De begripstaak vraagt herkenning; zelf omrekenen is een andere vaardigheid.',
'T106':'Bereid de twee betekenissen van meer apart voor; geen automatisch B1-label wegens taalbeschouwing.',
'T143':'Bereid klinkerklank en lettergreep voor en gebruik de bestaande klanksteun.',
'T180':'Bereid de twee c-klanken voor; de uitspraak /s/ en /k/ in circus klopt.',
'D096':'Open lettergreep en lange klank zijn vakwoorden die vooraf uitleg nodig hebben.',
'T177':'Een patiënt die om uitleg vraagt maakt deze concrete leestekst niet automatisch B1. Zelf medische uitleg kunnen verwerken is niet aangetoond.'}
items=[]
for ref,id in refs.items():
 x=by[id];old=next(v for v in before if v['id']==id);oldlevel=old['sourceLevel'];level='A2' if oldlevel.lower().startswith('a2') else 'A1'
 if ref in level_changes:level,reason=level_changes[ref]
 else:
  if level=='A1':reason='Korte concrete '+('uitwisseling met vaste vragen en directe antwoorden' if x['kind']=='dialogue' else 'beschrijving met herkenbare personen, voorwerpen en handelingen')+'.'
  else:reason='Een concrete dagelijkse situatie met '+('verduidelijken, afstemmen of een reden/voorwaarde bespreken' if x['kind']=='dialogue' else 'verbanden, verwijzingen of een korte handelingsketen')+'; de gegeven vraag blijft brongebonden.'
  reason+=' Beoordeeld bij: '+x['text'].split('. ')[0].rstrip('.')+'.'
 preparation='Bereid onbekende woorden en verwijzingen uit deze bron mondeling voor; luistersteun blijft beschikbaar.'
 if ref in notes:preparation+=' '+notes[ref]
 provisional=ref in ['T153','T179']
 row={'ref':ref,'contentId':id,'kind':x['kind'],'title':x['title'],'text':x['text'],'discussion':x.get('discussion'),'previousLevel':oldlevel,'level':level,'status':'provisional' if provisional else 'reviewed','reason':reason,'preparation':preparation,'editorialNote':notes.get(ref,''),'checks':['spelling','grammatica','vloeiendheid','samenhang','vraag-antwoord-bewijs','niveau'],'ownerReview':any(ref in d['refs'] for d in doubts)}
 if provisional:row['alternativeLevel']='B1'
 items.append(row)
registry={'reviewDate':'2026-10-30','baseline':baseline,'scope':'192 teksten/microteksten en 128 dialogen uit de gekoppelde bronbank; bijbehorende 120 schrijftaken afzonderlijk nagekeken. Andere zelfstandige bronbanken vallen buiten deze vervolgpassage.','method':'Integrale redactionele lezing van tekst, beurten, vraag, antwoord, afleiders, bewijs en gekoppeld schrijfdoel. Niveau is een onderbouwde werkindeling, geen ERK-certificering of praktijktoets. Alfa-leessteun blijft apart.','items':items}
pathlib.Path('data/klink-long-content-levels.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
# Fine-grained ledger enables exact backward checks without weakening publication gates.
patches=[]
def diff(a,b,path):
 if a==b:return
 if isinstance(a,dict) and isinstance(b,dict):
  for k in dict.fromkeys(list(a)+list(b)):
   if k not in a:patches.append({'path':path+[k],'added':True,'after':b[k]})
   elif k not in b:patches.append({'path':path+[k],'removed':True,'before':a[k]})
   else:diff(a[k],b[k],path+[k])
 elif isinstance(a,list) and isinstance(b,list) and len(a)==len(b):
  for i,(v,w) in enumerate(zip(a,b)):diff(v,w,path+[i])
 else:patches.append({'path':path,'before':a,'after':b})
for f in files:
 diff(original[f],data[f],[f]);raw=subprocess.check_output(['git','show',baseline+':'+f]);text=json.dumps(data[f],ensure_ascii=False,indent=2) if raw.count(b'\n')>5 else json.dumps(data[f],ensure_ascii=False,separators=(',',':'));pathlib.Path(f).write_text(text+'\n')
for name,obj in [('source-amendments.json',{'baseline':baseline,'changes':patches}),('repairs.json',changes),('owner-review.json',doubts),('audio.json',clips),('writing-review.json',[{'contentId':x['contentId'],'title':x['title'],'level':x['level'],'previousLevel':next(y['level'] for y in original[files[3]]['items'] if y['id']==x['id']),'status':'reviewed','reason':'Opdracht, model en criteria samen beoordeeld; korte concrete gegevens/verzoeken A1, redenen en meerledige afstemming A2.'} for x in data[files[3]]['items']])]:
 (D/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
print('Reviews',len(items),'level counts',collections.Counter((x['kind'],x['level']) for x in items),'repairs',len(changes),'changed fields',len(patches))
