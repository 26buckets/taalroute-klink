import json,re
from pathlib import Path
p=Path(__file__).parent
rows=json.loads((p/'inventory.json').read_text()); byn={r['n']:r for r in rows}; fixes=[]
def add(n,new,why):
 r=byn[n]; assert r['meaning']!=new
 assert not any(f['n']==n for f in fixes),n
 fixes.append(dict(n=n,word=r['word'],before=r['meaning'],after=new,reason=why))
# Exact, reviewed meaning records, not a spelling-wide replacement.
explicit={
23:'Afhankelijk van iemand of iets voor hulp, in de combinatie ‘aangewezen op’.',
1058:'Een vermoeden of mening hebben, bijvoorbeeld: ik denk dat de winkel open is.',
1157:'Dezelfde activiteit voortzetten; verdergaan.',
1248:'Met kracht tegen iemand of iets drukken, zodat die persoon of dat voorwerp van je af beweegt.',
1376:'Een korte tijd, bijvoorbeeld: wacht even.',
1747:'Eetbare delen van planten die je bij een maaltijd eet, zoals wortels, sla en bloemkool.',
1777:'Haren op het hoofd. Ook een verwijzing naar een vrouw of meisje: ik zie haar; haar tas.',
1911:'Nodig of verplicht zijn, bijvoorbeeld: je hoeft niet te komen; je hoeft alleen je naam te schrijven.',
2136:'Je best doen om iets te bereiken of anderen te helpen, in de combinatie ‘zich inzetten’.',
2361:'Een omhelzing: je houdt iemand in je armen om te laten merken dat je die persoon graag mag.',
2571:'Alle delen van een mens of dier samen, zoals het hoofd, de romp, de armen en de benen.',
2678:'Een volwassen mannelijk persoon.',2679:'Een volwassen mannelijk persoon.',
2840:'Een vrouwelijke ouder.',2886:'Klanken die samen een melodie of ritme vormen, om naar te luisteren of op te bewegen.',
3264:'Was aan een lijn of rek hangen om te drogen.',
4132:'De noodzaak om iets snel te doen omdat wachten niet kan.',
4155:'Materiaal of voorwerpen; in het meervoud ‘spullen’ vaak dingen die je gebruikt of bij je hebt.',
4511:'Een ruimte of voorziening waar je kunt plassen en poepen.',
4547:'Met kracht iets naar je toe of in een bepaalde richting bewegen.',
4589:'Een beleefde vorm van jij of jullie, bijvoorbeeld: wilt u zitten?',
4637:'Informatie die duidelijk maakt wat iets betekent of hoe je iets doet.',
4640:'Je afmelden bij een website of app wanneer je klaar bent. Je account blijft bestaan.',
4641:'Je afmelden bij een website of app wanneer je klaar bent. Je account blijft bestaan.',
4707:'Een mannelijke ouder.',5242:'Een volwassen vrouwelijk persoon.',
5593:'De ster die de aarde licht en warmte geeft.',
}
assert byn[4511]['word']=='toilet'
for n,new in explicit.items():add(n,new,'Betekenis verduidelijkt; cirkelomschrijving, onjuiste formulering of ontbrekende gebruikscontext hersteld.')
# Preserve each selected sense, remove internal codes and exact duplicate glosses.
for r in rows:
 if re.search(r'TL\d+\.S\d+:|\bS\d+:',r['meaning']):
  raw=re.sub(r'(?:TL\d+\.)?S\d+:\s*','',r['meaning'])
  parts=[]
  for part in raw.split(' / '):
   part=part.strip().rstrip('.')
   if part.casefold() not in [s.casefold() for s in parts]:parts.append(part)
  new='. '.join(s[:1].upper()+s[1:] for s in parts)+'.'
  new={'al':'Reeds, zoals in ‘ik ben al klaar’. Ook: de hele hoeveelheid, zoals in ‘al het water’.','alleen':'Zonder andere mensen. Ook: niet meer of anders dan dit.','gaan':'Je naar een andere plaats bewegen. Ook gebruikt voor een voorgenomen handeling (‘ik ga koken’) of om te vragen hoe het met iemand is (‘hoe gaat het?’).','staan':'Rechtop op een plaats zijn. Ook: ergens vermeld of weergegeven zijn, bijvoorbeeld op een formulier.'}.get(r['word'],new)
  add(r['n'],new,'Interne betekeniscodes en dubbele omschrijvingen verwijderd; de afzonderlijke betekenissen behouden.')
# Distinguishing definitions for deliberately short beginner glosses.
short={
'aardappel':('voedselknol','Een knol die onder de grond groeit en die je gekookt, gebakken of gepureerd eet.'),
'appel':('vrucht','Een meestal ronde vrucht met een groene, gele of rode schil en een klokhuis met pitten.'),
'banaan':('vrucht','Een lange, gebogen vrucht met meestal een gele schil als hij rijp is.'),
'beker':('drinkvat','Een voorwerp met een open bovenkant waaruit je drinkt, bijvoorbeeld van plastic of aardewerk.'),
'glas':('drinkvat','Een doorzichtig voorwerp zonder oor waaruit je drinkt.'),
'kop':('drinkvat met oor','Een klein voorwerp met een oor waaruit je bijvoorbeeld koffie of thee drinkt.'),
'ei':('ei als voedsel','Een rond of ovaal product met een schaal, eiwit en dooier, bijvoorbeeld van een kip, dat je kunt eten.'),
'boos':('gevoel van boosheid','Niet blij met wat iemand doet of wat er gebeurt; je kunt bijvoorbeeld mopperen of kwaad kijken.'),
'computer':('digitaal apparaat','Een apparaat waarmee je bijvoorbeeld teksten maakt, informatie zoekt en programma’s gebruikt.'),
'internet':('digitaal netwerk','Een wereldwijd netwerk waarmee computers en telefoons informatie uitwisselen.'),
'koffie':('warme drank','Een drank die je maakt met water en gemalen koffiebonen.'),
'lepel':('eetgereedschap','Een stuk bestek met een steel en een klein kommetje, bijvoorbeeld om soep te eten.'),
'vork':('eetgereedschap','Een stuk bestek met tanden waarmee je eten opprikt.'),
'tafel':('meubel','Een meubel met een vlak blad op poten, bijvoorbeeld om aan te eten of te werken.'),
'stoel':('zitmeubel','Een meubel waarop één persoon zit, meestal met een rugleuning.'),
'potlood':('schrijfvoorwerp','Een voorwerp waarmee je schrijft of tekent en waarvan je de lijnen meestal kunt uitgummen.'),
'pet':('hoofddeksel','Een hoofddeksel met een klep aan de voorkant.'),
'shirt':('bovenkleding','Een dun kledingstuk voor het bovenlichaam, met korte of lange mouwen.'),
'thee':('warme drank','Een drank die je maakt met heet water en theebladeren of kruiden.'),
'rijst':('graanproduct','Kleine graankorrels die je kookt om te eten.'),
'sneeuw':('bevroren neerslag','Witte vlokken van ijskristallen die uit de lucht vallen.'),
'snijden':('in stukken verdelen','Met een mes of ander scherp voorwerp in stukken verdelen.'),
'groot':('met grote afmetingen','Met veel lengte, breedte of hoogte; het tegenovergestelde van klein.'),
'klein':('met kleine afmetingen','Met weinig lengte, breedte of hoogte; het tegenovergestelde van groot.'),
'schoonmaken':('schoon maken','Vuil weghalen, bijvoorbeeld met water en een doek.'),
'slapen':('in slaap zijn','Rusten zonder wakker te zijn, meestal met je ogen dicht.'),
'vis':('vis als voedsel','Het vlees van een vis dat je als voedsel eet.'),
'nek':('deel tussen hoofd en romp','De achterkant van je hals, tussen je hoofd en je schouders.'),
'verdrietig':('gevoel van verdriet','Je ongelukkig voelen, bijvoorbeeld omdat je iemand mist of iets vervelends hebt meegemaakt.'),
'zon':('zon aan de hemel','De ster die de aarde licht en warmte geeft.'),
}
for word,(old,new) in short.items():
 found=[r for r in rows if r['word']==word and r['meaning']==old]
 if word=='zon':continue
 assert len(found)==1,(word,found)
 add(found[0]['n'],new,'Te algemene of cirkelvormige beginnersomschrijving vervangen door een onderscheidende uitleg.')
months=['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december']
colors={'blauw':'De kleur van de lucht op een heldere dag.','bruin':'De kleur van bijvoorbeeld chocolade.','geel':'De kleur van bijvoorbeeld een rijpe citroen.','grijs':'Een kleur tussen zwart en wit.','groen':'De kleur van bijvoorbeeld gras.','oranje':'Een kleur tussen rood en geel.','rood':'De kleur van bijvoorbeeld een rijpe tomaat.','wit':'De kleur van bijvoorbeeld sneeuw of melk.','zwart':'De donkerste kleur.'}
for r in rows:
 if r['word'] in months and r['meaning']=='kalendermaand':add(r['n'],'De '+['eerste','tweede','derde','vierde','vijfde','zesde','zevende','achtste','negende','tiende','elfde','twaalfde'][months.index(r['word'])]+' maand van het jaar.','De maand herkenbaar gemaakt door zijn plaats in het jaar.')
 if r['word'] in colors and r['meaning']=='kleur':add(r['n'],colors[r['word']],'De kleur uitgelegd met een herkenbaar voorbeeld.')
for word in ['bevinden','concentreren','herinneren','oriënteren','vergissen','verontschuldigen','veroorloven','verslapen']:
 for r in rows:
  if r['word']==word and not re.search(r'\bzich\b',r['meaning']):
   add(r['n'],r['meaning']+f' In deze betekenis gebruik je ‘zich {word}’.','Wederkerende gebruiksvorm toegevoegd bij de bedoelde betekenis.')
# Core packages: keep source/editorial notes in the audit, show a plain meaning to learners.
package_defs={
'kam':'Een voorwerp met tanden waarmee je je haar verzorgt.','kat':'Een klein huisdier met snorharen, scherpe klauwen en een staart.',
'kan':'Een voorwerp met een handvat en een tuit om vloeistof uit te schenken.','man':'Een volwassen mannelijk persoon.',
'map':'Een omslag waarin je papieren bij elkaar bewaart.','pan':'Een voorwerp waarin je eten op het vuur of de kookplaat bereidt.',
'pak':'Een colbert met een bijpassende broek.','boom':'Een grote plant met een houten stam en takken.','boon':'Een eetbaar zaad uit een peul, hier een bruine boon.',
'boot':'Een vaartuig waarmee je over water gaat.','noot':'Een eetbare vrucht met een harde dop, hier een walnoot.',
'kool':'Een groente met veel bladeren dicht om elkaar, hier witte kool.','roos':'Een bloem van een rozenplant.',
'rook':'Een wolk van kleine deeltjes en gassen die bij verbranding ontstaat.','tien':'Het getal en de hoeveelheid 10.',
'kies':'Een brede tand achter in de mond waarmee je eten fijnkauwt.','biet':'Een eetbare wortelknol die vanbinnen roodpaars is.',
'vies':'Niet schoon; er zit vuil op.','vier':'Het getal en de hoeveelheid 4.','riem':'Een band die je om je middel draagt, bijvoorbeeld om een broek op zijn plaats te houden.',
'pen':'Een voorwerp waarmee je met inkt schrijft.','boek':'Bladzijden met tekst of afbeeldingen die samen zijn gebonden.',
'bloem':'Het deel van een plant dat bloeit, vaak met gekleurde blaadjes.','bloes':'Een kledingstuk voor het bovenlichaam, vaak met knopen aan de voorkant.',
'haak':'Een gebogen voorwerp waaraan je iets kunt ophangen.','haar':'Haren op het hoofd.','ik':'Het woord waarmee de spreker zichzelf aanduidt.',
'kaas':'Een voedingsmiddel dat van melk wordt gemaakt.','kin':'Het onderste deel van het gezicht, onder de mond.',
'kip':'Een vogel die mensen onder meer voor de eieren houden.','koe':'Een volwassen vrouwelijk rund.','koek':'Een gebakken lekkernij van deeg, vaak zoet.',
'laars':'Een schoen die ook een deel van het been bedekt.','lip':'Een van de randen rondom de mond.','maan':'Het hemellichaam dat om de aarde beweegt.',
'naam':'Het woord of de woorden waarmee je een persoon aanduidt.','pil':'Een geneesmiddel in een kleine vaste vorm.',
'soep':'Een vloeibaar gerecht, vaak met stukjes groente of ander eten.','vis':'Een dier met kieuwen en vinnen dat in het water leeft.',
'voet':'Het lichaamsdeel onder aan je been waarop je staat.','zit':'Een vorm van zitten: met je lichaam op je billen rusten.'}
extra=json.loads((p/'supplementary-inventory.json').read_text()); pf=[]
for r in extra:
 if r['file']=='lib/package-content.generated.json':
  pf.append(dict(file=r['file'],path=r['path'],word=r['word'],before=r['meaning'],after=package_defs[r['word']],reason='Leerlingbetekenis verduidelijkt; productienotities apart in het herstelbestand bewaard.'))
(p/'fixes.json').write_text(json.dumps({'meanings':fixes,'packages':pf},ensure_ascii=False,indent=2)+'\n')
print('Reviewed meaning fixes',len(fixes),'package word fixes',len(pf))
