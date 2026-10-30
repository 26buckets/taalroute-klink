import json,pathlib,copy
D=pathlib.Path('docs/long-content-review-20261030'); before=json.loads((D/'before.json').read_text()); by={}
for kind,prefix in [('text','T'),('dialogue','D')]:
 for i,x in enumerate([x for x in before if x['kind']==kind],1):by[f'{prefix}{i:03}']=x
changes={
'T020':('Eerst houdt hij de foto op twee plekken.','Eerst houdt hij de foto op de ene plek en daarna op de andere.','Maak duidelijk dat Minh twee plekken na elkaar probeert, niet tegelijk.'),
'T042':('Zij wil er een plank in de kast van maken.','Zij wil de plank in haar kast gebruiken.','Vervang de omslachtige, dubbelzinnige omschrijving door het bedoelde gebruik.'),
'T121':('Murat is haar vader.','Murat is de vader van Rosa.','De bronvraag en de doorlopende familiegeschiedenis bevestigen dat Rosa wordt bedoeld.'),
'T164':('Beide tassen zet ze bij de deur.','De koffer en de rugzak zet ze bij de deur.','Noem de twee verschillende voorwerpen precies.'),
'D119':('Dat ik om negen uur in lokaal drie moet zijn en mijn identiteitsbewijs meeneem.','Dat ik om negen uur in lokaal drie moet zijn en mijn identiteitsbewijs moet meenemen.','Maak beide verplichtingen grammaticaal gelijkwaardig en expliciet.')}
clips=[]
for ref,(a,b,reason) in changes.items():
 x=by[ref]; block=next(bk for bk in x['blocks'] if a in bk['text']);clips.append({'id':ref.lower(),'contentId':x['id'],'blockId':block['id'],'title':x['title'],'before':a,'after':b,'reason':reason,'text':block['text'].replace(a,b),'voiceId':block.get('voiceId','0qLmDzgqulxcvv0yf3kg'),'role':'target','originalSrc':block['audio']['src'],'audioId':block['audio']['audioId']})
plan={'authorization':'Nico, 30 oktober 2026: Maak de vijf vervangende opnamen. Alleen deze vijf herstelopnamen; geen publicatieopdracht.','instructionVoiceId':'h6uBOiAjLKklte8hdYio','model':'eleven_v4','settings':{'stability':0.5,'similarity_boost':0.75,'speed':0.9},'clips':clips}
(D/'production-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
s=pathlib.Path('docs/sentence-second-review-20261030/generate.mjs').read_text().replace("docs/sentence-second-review-20261030","docs/long-content-review-20261030").replace("plan.clips.length===14&&chars<800","plan.clips.length===5&&chars<1600").replace("package-audio/zinsherstel-20261030","package-audio/tekstherstel-20261030")
s=s.replace("const dir=", "const dir=",1).replace("const key=", "mkdirSync(dir+'/originals',{recursive:true});\nconst key=",1)
(D/'generate.mjs').write_text(s)
print('Five approved clips;',sum(len(c['text']) for c in clips),'characters; voices',sorted(set(c['voiceId'] for c in clips)))
