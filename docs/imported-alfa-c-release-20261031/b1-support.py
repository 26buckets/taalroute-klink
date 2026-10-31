import json,pathlib
rows=[
('bestuursdwang','Een overheid grijpt zelf in om een overtreding te stoppen.','De gemeente past bestuursdwang toe en laat het afval weghalen.'),
('bewerkstelligen','Ervoor zorgen dat iets gebeurt.','Met extra overleg willen we een betere samenwerking bewerkstelligen.'),
('derhalve','Een formeel woord voor daarom of dus.','Het formulier is niet compleet en kan derhalve nog niet worden behandeld.'),
('geenszins','Helemaal niet.','Een extra oefening is geenszins een straf.'),
('jegens','Een formeel woord voor tegenover, als het gaat om hoe je iemand behandelt.','Iedereen moet zich respectvol gedragen jegens collega’s.'),
('krachtens','Op grond van een regel, wet of afspraak.','Krachtens deze afspraak mag de vereniging de zaal gebruiken.'),
('sedert','Een formeel woord voor sinds.','Zij woont hier sedert 2020.'),
('teneinde','Een formeel woord voor om, wanneer je een doel noemt.','We plannen een gesprek teneinde een oplossing te vinden.'),
('onherroepelijk','Definitief; iets kan niet meer worden teruggedraaid.','Na de sloop is het oude huis onherroepelijk verdwenen.'),
('hiërarchisch','Met een duidelijke volgorde van hogere en lagere functies.','In een hiërarchisch bedrijf beslist de directeur en voeren medewerkers de besluiten uit.'),
('hypothese','Een mogelijke verklaring die je nog moet onderzoeken.','Onze hypothese is dat de plant te weinig licht krijgt; we zetten haar bij het raam om dat te onderzoeken.'),
('autonomie','De vrijheid om zelf beslissingen te nemen.','Het team krijgt meer autonomie en bepaalt voortaan zelf de werkverdeling.'),
('cognitief','Wat te maken heeft met denken, leren en onthouden.','Een geheugentaak doet een beroep op cognitieve vaardigheden.'),
('alsmede','Een formeel woord voor en ook.','Neem uw paspoort alsmede de uitnodiging mee.'),
('alsook','Een ander woord voor en ook.','De docent helpt bij het lezen alsook bij het schrijven.'),
('alvorens','Een formeel woord voor voordat.','Lees de uitleg alvorens u het formulier invult.'),
('blijkens','Zoals te zien is in of blijkt uit iets.','Blijkens het verslag waren alle deelnemers aanwezig.'),
('gaarne','Een formeel woord voor graag.','Wij ontvangen gaarne uw reactie.'),
('hetzij','Je gebruikt hetzij … hetzij … om twee mogelijkheden te noemen: of … of … .','U kunt betalen hetzij met uw pas, hetzij contant.'),
('louter','Alleen maar; niets anders dan.','Het was louter toeval dat we elkaar op het station zagen.'),
('nimmer','Een formeel of ouderwets woord voor nooit.','Ik zal die hulp nimmer vergeten.'),
('overeenkomstig','Zoals een afspraak, regel of wens zegt.','We werken overeenkomstig de gemaakte afspraken.'),
('pretentie','Wat iemand beweert te kunnen of te zijn, soms meer dan diegene waarmaakt.','Hij heeft niet de pretentie alles te weten en vraagt daarom om hulp.'),
('respectievelijk','In dezelfde volgorde als de personen of dingen die eerder zijn genoemd.','De kleine en de grote tas kosten respectievelijk tien en twintig euro.'),
('teweegbrengen','Ervoor zorgen dat iets ontstaat of gebeurt.','De nieuwe openingstijden kunnen een verandering in ons werk teweegbrengen.'),
('tezamen','Een formeel woord voor samen.','De twee groepen oefenen tezamen in één lokaal.'),
('weldra','Binnenkort; over korte tijd.','De verbouwing is bijna klaar; de winkel gaat weldra weer open.'),
('wier','Een formele vorm om bezit aan te geven: van wie. Hier gaat het om een vrouw.','De vrouw wier fiets is gestolen, doet aangifte. Dat betekent: de fiets van die vrouw is gestolen.')]
words={w:{'meaning':m,'example':e}for w,m,e in rows}
assert set(words)==set(json.load(open('docs/imported-alfa-c-review-20261031/owner-review.json'))[0]['words'])
collections={}; placements=0;found=set()
for row in json.load(open('data/klink-production-index.json')):
 if row['activity']!='read-series' or row['level']!='b1':continue
 es=json.load(open('public'+row['url']))['exercises'];chosen=[e['exerciseId']for e in es if any(t['text']in words for t in e['textBlocks'])]
 for e in es:
  for t in e['textBlocks']:
   if t['text']in words:found.add(t['text'])
 if chosen:collections[row['id']]={'allExerciseIds':[e['exerciseId']for e in es],'supportIds':chosen};placements+=len(chosen)
assert found==set(words)
pathlib.Path('data/klink-b1-reading-support.json').write_text(json.dumps({'words':words,'collections':collections},ensure_ascii=False,indent=2)+'\n')
print({'words':len(words),'collections':len(collections),'supportedPlacements':placements})
