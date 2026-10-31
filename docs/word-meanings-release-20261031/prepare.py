import json,pathlib
D=pathlib.Path('docs/word-meanings-release-20261031')
def save(p,x):pathlib.Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sense(label,meaning,example,**kw):return dict(label=label,meaning=meaning,example=example,**kw)
def audio(id):return json.load(open(D/(id+'.json')))['src']
contexts={
'pak':[
sense('Een pak: kleding','Een colbert met een bijpassende broek.','Hij draagt een donkerblauw pak.',image='/package-media/cp001/aa-cp001-pak-action-03.webp'),
sense('Een pak: verpakking','Een verpakt geheel, bijvoorbeeld een doos met spullen.','Het pak ligt klaar om te versturen.',image='/package-media/artsmart-20261025/k304.webp')],
'want':[
sense('Want: een reden geven','Verbindt een uitspraak met de reden daarvoor.','Ik neem een jas mee, want het is koud.'),
sense('Een want: kleding','Kleding voor een hand, met de duim apart en de andere vingers bij elkaar.','Ik heb één want verloren.',optional=True)],
'regent':[
sense('Het regent','Er valt water uit de wolken.','Het regent. Er valt water uit de wolken.',audio=audio('regent-weer')),
sense('De regent','Iemand die tijdelijk voor een koning of koningin een land bestuurt.','De regent bestuurt tijdelijk het land voor de koning.',audio=audio('regent-bestuurder'),optional=True)],
'zinnen':[
sense('Zinnen: meer dan één zin','Groepen woorden waarmee je iets zegt, vraagt of uitroept.','Ik schrijf twee zinnen: Ik ben thuis. Ik lees een boek.'),
sense('Zinnen op: nadenken over','Nadenken over een manier om iets te doen.','Zij zinnen op een manier om het probleem op te lossen.',optional=True)],
'voorkomen':[
sense('Voorkómen: verhinderen','Ervoor zorgen dat iets niet gebeurt.','We willen voorkomen dat er een ongeluk gebeurt.',audio=audio('voorkomen-verhinderen')),
sense('Vóórkomen: gebeuren','Gebeuren of ergens aanwezig zijn.','Zo een fout kan voorkomen. Dat gebeurt soms.',audio=audio('voorkomen-gebeuren'),optional=True)]}
save('data/klink-meaning-contexts.json',contexts)
rows=[
('adequaat','Passend en voldoende voor de situatie.','De medewerker reageert adequaat: hij haalt hulp en blijft bij de klant.'),
('adolescent','Een jongere in de overgang van kind naar volwassene.','In dit onderzoek worden jongeren van zestien jaar adolescenten genoemd.'),
('algeheel','Wat alles of iedereen binnen een bepaalde groep of situatie betreft.','In het gebouw geldt een algeheel rookverbod: niemand mag er roken.'),
('allerminst','Helemaal niet.','Ik ben allerminst tevreden, want de reparatie heeft niet geholpen.'),
('ambt','Een officiële functie, bijvoorbeeld bij de overheid.','Zij vervult het ambt van burgemeester.'),
('ambtelijk','Wat te maken heeft met het werk van ambtenaren.','In de ambtelijke brief staat het besluit van de gemeente.'),
('autonoom','Zelfstandig, met de vrijheid om eigen beslissingen te nemen.','Het team werkt autonoom en kiest zelf hoe het de taken verdeelt.'),
('beogen','Met een handeling een bepaald resultaat willen bereiken.','Met deze cursus beogen we dat deelnemers zelfstandig formulieren kunnen invullen.'),
('conceptie','Het ontstaan van een zwangerschap door bevruchting.','De verloskundige legt uit dat conceptie de bevruchting is.'),
('geding','Een zaak waarover een rechter moet beslissen; ook in de verbinding in het geding zijn.','De rechter doet uitspraak in het geding tussen de huurder en de verhuurder.'),
('gelijken','Een formeel woord voor lijken op.','De twee gebouwen gelijken op elkaar: ze hebben dezelfde ramen en deuren.'),
('intellectueel','Wat te maken heeft met nadenken, kennis en begrijpen.','Dit vraagstuk is een intellectuele uitdaging: je moet er goed over nadenken.'),
('impliceren','Betekenen dat iets anders er ook uit volgt of bij hoort.','Een handtekening onder dit contract impliceert dat je met de afspraken instemt.'),
('integraal','Volledig, zonder delen weg te laten.','De tekst is integraal overgenomen: er is niets weggelaten.'),
('intuïtie','Een gevoel dat je iets aanvoelt of weet zonder er bewust over na te denken.','Mijn intuïtie zei dat er iets niet klopte; later bleek de rekening fout.'),
('manifesteren','Zichtbaar of merkbaar worden, in de combinatie zich manifesteren.','Het probleem manifesteert zich tijdens drukke uren: dan valt de verbinding uit.')]
s=json.load(open('data/klink-b1-reading-support.json'));assert len(s['words'])==28
for w,m,e in rows:s['words'][w]={'meaning':m,'example':e}
save('data/klink-b1-reading-support.json',s)
save(D/'new-extension-words.json',[r[0] for r in rows])
save(D/'audio.json',[json.load(open(D/(c['id']+'.json')))for c in json.load(open(D/'audio-plan.json'))['clips']])
