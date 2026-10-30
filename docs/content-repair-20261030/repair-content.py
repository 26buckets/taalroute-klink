import json,pathlib,hashlib,subprocess,copy
R=pathlib.Path('.');P=pathlib.Path('/Users/nicoknoester/Documents/Codex/2026-10-30/wat-ik-zo-bijzonder-vind-is/outputs/klink-contentreview');D=R/'docs/content-repair-20261030'
names=['klink-connected-content.json','klink-content-routing.json','klink-dialogue-repair.json','klink-imported-practice.json','klink-functional-writing.json','../public/content-register/active.json','klink-docent-mat.json']
before={n:json.loads(subprocess.check_output(['git','show','HEAD:'+str(pathlib.PurePosixPath('data')/n).replace('data/../','')])) for n in names};data=copy.deepcopy(before)
bank=data[names[0]]['items'];by={x['id']:x for x in bank};imp=data[names[3]]['items'];ib={x['id']:x for x in imp};writing={x['id']:x for x in data[names[4]]['items']}
senses=json.loads((P/'structuurcontrole.json').read_text())['homographs']
for wid,ids in senses.items():
 for id in ids:
  if wid=='haar':m='Verwijst naar een eerder genoemde vrouw of meisje, of geeft aan dat iets bij die persoon hoort. Bespreek naar wie haar in deze zin verwijst; hier gaat het niet om hoofdhaar.'
  elif wid=='want':m='Verbindt een uitspraak met de reden ervoor: er is meer licht, daarom wordt die plek gekozen. Hier gaat het niet om kleding.'
  elif id=='klink-text-2fc7bd8fac1caee1':m='Deze tekst vergelijkt twee betekenissen: meer water is een grotere hoeveelheid water; een meer is een grote waterplas. Bereid beide betekenissen afzonderlijk voor.'
  elif id=='klink-text-250bee53ab02115c':m='Geen ei meer willen: Pavel heeft genoeg ei gehad en wil nu geen extra ei. Meer hoort hier bij geen ei meer.'
  elif id in ['klink-text-ff98b538d2885209','klink-text-b31a7d8975c8b492','klink-dialogue-32f962399de8f4c3']:m='Geen ... meer: iets was er eerder wel, maar is nu op. Lees en bespreek de hele woordgroep.'
  else:m='Niet meer: iets gebeurde of kon eerder wel, maar nu niet. Lees en bespreek de hele woordgroep.'
  by[id]['reading'].setdefault('meaningOverrides',{})['klink-woord-'+wid]=m
# Orthography only: the existing spoken words remain the same.
replacements={'Hij hangt hier naast.':'Hij hangt hiernaast.','Mag het licht aan blijven?':'Mag het licht aanblijven?'}
def replace(obj,reps):
 if isinstance(obj,str):
  for a,b in reps.items():obj=obj.replace(a,b)
  return obj
 if isinstance(obj,list):return [replace(x,reps) for x in obj]
 if isinstance(obj,dict):return {k:replace(v,reps) for k,v in obj.items()}
 return obj
for n in names:data[n]=replace(data[n],replacements)
data[names[6]]=replace(data[names[6]],{'OPTIONEELE UITBREIDING ‘KENDE WOORDEN’':'OPTIONELE UITBREIDING ‘BEKENDE WOORDEN’','wordt het audio niet':'wordt de audio niet'})
for row in data[names[5]]:
 if row['id']=='klink-text-8013db18a19b2c10:question':
  assert row['status']=='missing' and not row.get('src')
  row['text']='Op welke vraag heeft Fenna nog geen antwoord?'

bank=data[names[0]]['items'];by={x['id']:x for x in bank};imp=data[names[3]]['items'];ib={x['id']:x for x in imp};writing={x['id']:x for x in data[names[4]]['items']}
by['klink-text-8013db18a19b2c10']['discussion']['question']='Op welke vraag heeft Fenna nog geen antwoord?'
changes={
'kg-a1-f02-001':{'Vul heb, hebt of hebben in:':'Vul heb, hebt, heeft of hebben in:'},
'kg-a1-f14-001':{'Welke kleur heeft weinig pennen voor zes mensen?':'Van welke kleur zijn er te weinig pennen voor zes mensen?','rood heeft er weinig ten opzichte van zes.':'er zijn twee rode pennen; dat zijn er te weinig voor zes mensen.'},
'kg-a1-f24-001':{'waarin je dag, tijd en lokaal corrigeert':'waarin je de dag en tijd corrigeert, het lokaal noemt'},
'kg-a2-g12-001':{'de brede/een breed bureau':'het brede/een breed bureau'},
'kg-a2-g15-001':{'Bij vier aanwezige appels nog vier kopen;':'Eerste situatie: zes deelnemers en vier appels, dus nog twee kopen. Toepassing: acht deelnemers en vier appels, dus nog vier kopen;'},
'kg-a2-g26-001':{'voor elk van deze vier woorden':'voor elk van deze vier woorden: hij, zij, het en ze. Schrijf op'},
'kg-b1-g53-001':{'niet alle = deel':'niet alle = minder dan alle; hier zijn drie kopjes kapot en zeven heel','niet alle mag niet als geen enkel worden gelezen.':'in deze bron zijn zeven kopjes heel, dus betekent niet alle hier niet geen enkel. Zonder die aantallen sluit niet alle op zichzelf nul niet uit.'},
'klink-teksten-b13-05':{'Wie kunnen zij zich nu ook online aanmelden':'Wie worden bedoeld met ‘zij’ in ‘Nu kunnen zij zich ook online aanmelden’'},
'klink-teksten-b14-01':{'U meldt vooraf aan':'U meldt zich vooraf aan'},
'klink-wp-final-bij-functional-use':{'Je ziet een insect dat nectar verzamelt bij een bloem. Welk dier staat op je kaart?':'Je staat naast de deur. Gebruik het woord op je kaart om te vertellen waar je staat.','Bij als insect, niet het voorzetsel.':'Bij als plaatswoord: bijvoorbeeld Ik sta bij de deur. Laat aanwijzen dat dit in de buurt van de deur betekent; niet het insect.'},
'klink-wp-final-kleur-functional-use':{'Je kiest tussen rood en blauw. Wat kies je van het voorwerp?':'Je mag bepalen of de stoel rood of blauw wordt. Wat mag je kiezen?'},
'klink-wp-final-text-a2ac929f69bfdd4f-contextual-model-fade':{'Er ligt nog één lepel in de la.':'We hebben nog één lepel nodig.','Eén extra lepel naast de zes die er al liggen, zodat er zeven zijn.':'Bron en oefenfase: zes lepels voor zeven mensen, dus één extra nodig. Nieuwe situatie: drie lepels voor vier mensen, dus ook één extra nodig.'},
}
for id,reps in changes.items():
 old=json.dumps(ib[id],ensure_ascii=False)
 for a in reps:assert a in old,(id,a)
 ib[id].update(replace(ib[id],reps))
# Keep the marked words and the sentence grammatically complete.
ib['kg-a2-g26-001']['prompt']=ib['kg-a2-g26-001']['prompt'].replace('Schrijf voor elk van deze vier woorden: hij, zij, het en ze. Schrijf op naar wie of wat het verwijst.', 'Bekijk de woorden hij, zij, het en ze. Schrijf voor elk woord op naar wie of wat het verwijst.')
ib['klink-teksten-b13-05']['prompt']='Wie worden bedoeld met ‘zij’ in ‘Nu kunnen zij zich ook via een kort online formulier aanmelden’? Welke twee bronnen worden bedoeld met ‘beide bronnen’?' 
# The response phase must actually supply the promised new context without the model.
x=ib['klink-wp-final-text-a2ac929f69bfdd4f-contextual-model-fade']
x['teacherWorkflow']['phases'][-1]['instruction']='Verberg model, doelwoord, bron en eerdere notities. Geef mondeling de nieuwe situatie: Er komen vier mensen eten. Er liggen drie lepels. Vraag de cursist te zeggen wat er nog nodig is. Noteer gebruikte hulp en beoordeel betekenis en grammatica apart.'
writing['klink-dialogue-575a5b9e5e8c7ecf-write']['example']='De muziek staat hard. Ik zoek een rustigere tafel, zodat we elkaar beter kunnen verstaan.'
writing['klink-dialogue-ed531a759212bc2c-write']['criteria'][0]='Noem voor welk huisnummer de brief bestemd is.'
writing['klink-dialogue-7e39d6d38b6f128b-write']['criteria'][1]='Je keuze is begrijpelijk.'
for item in data[names[1]]['items']:
 if item['id'] in by:item['textHash']=hashlib.sha256(by[item['id']]['text'].encode()).hexdigest()
# Version changed tasks so an old answer is not silently assessed against a new model.
for index,item in enumerate(data[names[3]]['items']):
 if item!=before[names[3]]['items'][index] and item.get('teacherWorkflow'):
  material=copy.deepcopy(item);material['teacherWorkflow'].pop('sourceHash')
  item['teacherWorkflow']['sourceHash']=hashlib.sha256(json.dumps(material,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
# Original fields, including producer hashes, remain in the recovery manifest.
patches=[]
def diff(a,b,path):
 if a==b:return
 if isinstance(a,dict) and isinstance(b,dict):
  for k in dict.fromkeys(list(a)+list(b)):
   if k not in a:patches.append({'path':path+[k],'added':True,'after':b[k]})
   elif k not in b:raise AssertionError('Unexpected deletion')
   else:diff(a[k],b[k],path+[k])
 elif isinstance(a,list) and isinstance(b,list) and len(a)==len(b):
  for i,(x,y) in enumerate(zip(a,b)):diff(x,y,path+[i])
 else:patches.append({'path':path,'before':a,'after':b})
for n in names:
 diff(before[n],data[n],[('data/'+n).replace('data/../','')]);(R/'data'/n).write_text((json.dumps(data[n],ensure_ascii=False,indent=2) if subprocess.check_output(['git','show','HEAD:'+str(pathlib.PurePosixPath('data')/n).replace('data/../','')]).count(b'\n')>5 else json.dumps(data[n],ensure_ascii=False,separators=(',',':')))+'\n')
(D/'source-changes.json').write_text(json.dumps({'baseline':'9d4a78ed','liveBaseline':'bd2f7f41d4329eb8e9c1bf876a7258cf935c8cc3','published':False,'changes':patches},ensure_ascii=False,indent=2)+'\n')
print('Changed fields:',len(patches));print('Meaning sources:',len(set(sum(senses.values(),[]))))
