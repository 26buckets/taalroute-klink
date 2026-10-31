import json,pathlib
D=pathlib.Path('docs/word-coverage-release-20261031');bank=json.load(open('data/klink-imported-practice.json'))['items'];source=[x for x in bank if x['domain']=='woordpakketten'and x.get('teacherWorkflow',{}).get('kind')=='precise-response'];out=[];ledger=[]
def add(src,stimulus,prompt,correct,wrong,explanation):
 n=len(out);opts=[{'id':'good','text':correct}]+[{'id':f'wrong{i}','text':t}for i,t in enumerate(wrong)];shift=n%len(opts);opts=opts[shift:]+opts[:shift]
 item={'id':'self-use:'+src['id'],'domain':'woordpakketten','level':src['level'],'axis':src['axis'],'title':'Woorden gebruiken · '+src['level'],'objective':'Betekenis in een situatie herkennen; oefenen, geen zelfstandige lees- of spreekbeoordeling.','sourceIds':list(dict.fromkeys(src['sourceIds']+[src['id']])),'mode':'choice','prompt':prompt,'stimulus':stimulus,'options':opts,'correctOptionIds':['good'],'acceptedAnswers':[],'prerequisites':['De woorden en de betekenis van de opdracht zijn vooraf bekend.','Bij de Alfa-niveaus: oefen de situatie en uitleg eerst samen; deze keuze is geen bewijs van zelfstandig zinnen lezen.'],'teacherGuidance':'Zelfstandige keuzevariant van de bestaande docentopdracht. De oorspronkelijke mondelinge taak en docentobservaties blijven afzonderlijk beschikbaar.','feedback':{'correct':'Goed. '+explanation,'retry':'Dat past hier niet. Lees de situatie opnieuw en kies een ander antwoord.'}}
 out.append(item);ledger.append({'id':item['id'],'sourceId':src['id'],'level':src['level'],'correct':correct,'explanation':explanation})
def word(level,w):
 xs=[x for x in bank if x['domain']=='woordpakketten' and x['level']==level and 'klink-woord-'+w in x.get('teacherWorkflow',{}).get('targetWordIds',[])];assert xs,(level,w);return xs[0]
for level,w,context,prompt,correct,wrong,why in [
('Alfa A','bon','Je hebt betaald.','Welk papier krijg je?','bon',['jas','pan'],'Op een bon staat wat je hebt gekocht en betaald.'),
('Alfa A','bed','Je wilt slapen.','Wat gebruik je?','bed',['pen','pan'],'In een bed kun je slapen.'),
('Alfa A','pen','Je schrijft je naam.','Wat pak je?','pen',['jas','mat'],'Met een pen kun je schrijven.'),
('Alfa A','pan','Je kookt soep.','Wat gebruik je?','pan',['map','bed'],'Je kookt soep in een pan.'),
('Alfa A','jas','Je gaat naar buiten. Het is koud.','Wat trek je aan?','jas',['bon','map'],'Een jas houdt je buiten warm.'),
('Alfa A','map','Je wilt papier netjes bewaren.','Waar doe je het papier in?','map',['pan','bed'],'In een map kun je papier bewaren.'),
('Alfa A','mat','Je schoenen zijn vuil.','Waar veeg je je schoenen aan af?','mat',['pen','bon'],'Je veegt je schoenen aan een mat af.'),
('Alfa A','tas','Je neemt een boek en een pen mee.','Waar kun je die in doen?','tas',['pan','mat'],'In een tas kun je spullen meenemen.'),
('Alfa B','winkel','Je wilt brood kopen.','Waar kun je iets kopen?','winkel',['slaapkamer','badkamer'],'In een winkel kun je spullen of eten kopen.'),
('Alfa B','cadeau','Je vriend is jarig. Je geeft iets leuks.','Hoe noem je wat je geeft?','cadeau',['rekening','afspraak'],'Een cadeau geef je om iemand blij te maken.'),
('Alfa B','camera','Je wilt een foto maken.','Welk apparaat gebruik je?','camera',['stofzuiger','waterkoker'],'Met een camera maak je een foto.'),
('Alfa B','keuken','Je gaat eten koken.','In welke kamer doe je dat?','keuken',['slaapkamer','badkamer'],'In de keuken kun je eten koken.'),
('Alfa B','sokken','Je voeten zijn koud.','Wat trek je aan je voeten?','sokken',['jassen','mutsen'],'Sokken draag je aan je voeten.'),
('Alfa B','rugzak','Je neemt spullen mee op je rug.','Welke tas gebruik je?','rugzak',['handtas','boodschappentas'],'Een rugzak draag je op je rug.'),
('Alfa B','tomaten','Je maakt een salade.','Wat kun je erin doen?','tomaten',['sokken','ramen'],'Tomaten kun je in een salade eten.'),
('Alfa B','huiskamer','Je zit thuis op de bank.','In welke kamer zit je meestal?','huiskamer',['badkamer','keuken'],'De bank staat meestal in de huiskamer.')]:
 add(word(level,w),context,prompt,correct,wrong,why)
# These choice variants retain the reviewed source situation and level; source teacher tasks stay untouched.
def context(fragment):
 xs=[x for x in source if fragment in x['id']];assert len(xs)==1,fragment;return xs[0]
def from_source(fragment,prompt,correct,wrong,why,excerpt=None):
 s=context(fragment);text=s['stimulus'].split('\n\nVoorbeeld')[0];add(s,excerpt or text,prompt,correct,wrong,why)
for args in [
('2ca47fb1054b901e','Waar ligt de bon?','Aan de zijkant van de tas.',['In de tas.','Onder de tas.'],'Naast betekent: aan de zijkant.'),
('3e3845232741f551','Wat betekent schenk?','Ik doe thee vanuit een kan of pot in de kop.',['Ik drink thee uit de kop.','Ik zet de lege kop in de kast.'],'Bij schenken gaat de drank vanuit een houder in een andere houder.'),
('670e8423938f7788','Waar ligt de sok?','Lager dan het bed, in de ruimte eronder.',['Boven op het bed.','In een kast naast het bed.'],'Onder geeft aan dat iets lager ligt.'),
('52487fdaa2b4b003','Wat is een halte?','Een plek waar je op de bus kunt wachten.',['Een plek waar je brood koopt.','Een kamer waarin je slaapt.'],'Bij een halte stopt de bus om mensen in en uit te laten stappen.'),
('72e945a9bad1f034','Waar staat de mand?','Op het vlak waarop je in de kamer loopt.',['Boven op de tafel.','Aan de muur.'],'De vloer is het onderste vlak van de kamer.'),
('abc145ca713d0b7a','Welke plaats noemt deze zin?','Een stad.',['Een slaapkamer.','Een kop.'],'De zin vertelt dat het station in de stad ligt.'),
('f902ed772a4bfa09','Wat krijgt Youssef?','Eén van twee even grote delen van de koek.',['De hele koek.','Twee hele koeken.'],'De helft is één van twee even grote delen.'),
('77bf177b20aa0262','Wat schrijft Elena op?','Hoe zij heet.',['Waar zij woont.','Hoe oud zij is.'],'Je naam vertelt hoe je heet.'),
('1dad0d533b203f96','Wat vraagt Youssef?','Een laars die groter is.',['Een laars in een andere kleur.','Een laars die kleiner is.'],'Een grotere maat heeft een groter formaat.'),
('17aa25708b6699a6','Wat bedoelt de spreker met deze week?','De week die nu bezig is.',['De week na deze week.','Een bepaalde dag volgend jaar.'],'Deze week is de huidige week; een kalenderdatum staat er niet bij.'),
('ed50ab67521a402c','Wat wil de persoon niet in het water?','Bevroren water.',['Suiker uit een zak.','Een schijfje citroen.'],'IJs betekent hier bevroren water in de drank.'),
('2c66ebd0043acde3','Wat is een schaal hier?','Een open houder waarin fruit kan liggen.',['Een maat voor de temperatuur.','Een voorwerp om mee te schrijven.'],'De schaal is hier een houder voor fruit.'),
('a2ac929f69bfdd4f','Wat betekent nog één lepel?','Eén extra lepel.',['Eén lepel minder.','Alle lepels weg.'],'Bij zes lepels komt er één: samen zeven.'),
('a858a3de1a5ec4e1','Wat betekent lenen?','Even gebruiken en daarna teruggeven.',['Kopen en houden.','Weggooien na gebruik.'],'De spreker brengt de emmer vanmiddag terug.'),
('94c3ad68a158b702','Wat betekent voor zich laten bewaren?','Het boek voor haar apart laten houden als het terug is.',['Het boek vandaag meteen meenemen.','Het boek nooit meer terugbrengen.'],'Het boek is uitgeleend; de medewerker verwacht het vrijdag terug.'),
('afc4ec1f23e619ab','Wat betekent het gesprek verzetten?','Het gesprek op een ander moment laten plaatsvinden.',['Een andere bloes aantrekken.','De vlek uit de mouw wassen.'],'Het gesprek hoeft niet op een ander moment: Nora kiest andere kleding.'),
('53e4f6139e2fc86c','Wat betekent uitleg vragen hier?','Vragen waarom de verpakking anders is.',['Zelf bedenken wat de verandering betekent.','Zonder te vragen een andere verpakking kiezen.'],'Youssef wil de verandering begrijpen en vraagt het aan de medewerker.'),
('375e6e6e06b7d86d','Wat betekent kost minder?','De andere rok heeft een lagere prijs.',['De andere rok is kleiner.','De andere rok heeft dezelfde prijs.'],'De prijs van de andere rok is lager dan die van de eerste.'),
('99630940a92ca252','Wat zijn de maten van de kast?','De afmetingen van de kast.',['De prijs van de kast.','Het aantal planken in de kast.'],'Met de afmetingen kun je zoeken naar een plank die past.'),
('280b19696348dc34','Wat betekent ongeveer een half uur?','Rond dertig minuten.',['Precies op dit moment.','Zeker meer dan twee uur.'],'Ongeveer geeft geen exact tijdstip.'),
('8013db18a19b2c10','Wat betekent zich aanmelden?','Laten weten dat je wilt meedoen.',['Vragen wat een woord betekent.','Laten weten dat je niet meer wilt komen.'],'Fenna geeft door dat zij samen met Rosa komt.'),
('2ea7b3a90f44568c','Wat betekent pauze?','Tijdelijk stoppen en later verdergaan.',['Voorgoed stoppen met het werk.','Zonder te stoppen doorgaan.'],'Het schuren stopt tussen één en twee en kan daarna verder.')]:from_source(*args)
for args in [
('b1-voorlopig','Wat betekent voorlopig gepland?','Het plan kan nog veranderen.',['De workshop is definitief afgezegd.','De eerste datum staat al vast.'],'De levering en de bevestiging bepalen of de eerste zaterdag doorgaat.','De workshop fietsreparatie staat voorlopig gepland op zaterdag. Als het materiaal donderdag binnen is, gaat de workshop door. De deelnemers ontvangen dan donderdagmiddag een bevestiging. Komt de levering later, dan verschuift de workshop naar de volgende zaterdag.'),
('b1-rekening-houden','Wat betekent rekening houden met de beschikbaarheid?','Bij het indelen meewegen wanneer mensen kunnen helpen.',['Iedereen verplicht op dezelfde avond laten werken.','De tuin ook met één vrijwilliger openen.'],'Mogelijkheden tellen mee, maar twee vrijwilligers blijven nodig.','Voor het openen en afsluiten van de buurttuin zijn twee vrijwilligers nodig. Bij het maken van het rooster houden we rekening met hun beschikbaarheid. Sommigen kunnen pas na zeven uur; anderen kunnen niet iedere week. Met maar één vrijwilliger blijft de tuin gesloten.'),
('b1-overleg','Wat betekent in overleg een andere plek kiezen?','De plek met de betrokkenen bespreken en afspreken.',['Zelf een naam invullen en aannemen dat het geregeld is.','De receptie zonder bericht als afleverplek schrappen.'],'De beheerder moet instemmen en Rivaro Parcel moet de plek bevestigen.','In overleg met de ontvanger kan Rivaro Parcel een andere afleverplek kiezen. De beheerder moet het pakket willen aannemen en aanwezig zijn. Rivaro Parcel bevestigt de andere plek. Zonder bevestiging blijft de receptie de afgesproken afleverplek.'),
('b1-aanmerking','Wat betekent in aanmerking komen?','Aan de voorwaarden voldoen om beoordeeld te kunnen worden.',['Zeker weten dat je de bijdrage krijgt.','De materialen alvast zonder besluit kopen.'],'Geschikte plannen worden nog geselecteerd; toekenning is niet automatisch.','Om voor de bijdrage in aanmerking te komen, moet een plan aan drie voorwaarden voldoen. Dat betekent niet dat je automatisch geld krijgt: het bedrag is beperkt. Koop materiaal pas nadat je schriftelijk hebt gehoord dat de bijdrage is toegekend.')]:from_source(*args)
for item in out:
 if item['level'] in ['Alfa A','Alfa B']:
  target='klink-woord-'+next(o['text']for o in item['options']if o['id']=='good')
  assert target in item['sourceIds'],item['id']
  item['sourceIds']=[sid for sid in item['sourceIds']if not sid.startswith('klink-woord-')or sid==target]
assert len(out)==42
pathlib.Path('data/klink-word-use-self.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');(D/'word-use-review.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n');print({l:sum(i['level']==l for i in out)for l in dict.fromkeys(i['level']for i in out)})
