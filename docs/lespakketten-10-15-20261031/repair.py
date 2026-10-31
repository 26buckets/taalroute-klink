import json,pathlib,re,copy
R=pathlib.Path(__file__).resolve().parent
ls=json.loads((R/'normalized-lessons.json').read_text());before=copy.deepcopy(ls)
words={x['word']:next(w for w in x['matches']if w['id']=='klink-woord-'+x['word'])for x in json.loads((R/'canonical-words.json').read_text())}
def task(l,c,n,**values):l['worksheet']['rounds'][c]['answers'][n-1].update(values)
def phase(l,c,n,**values):l['routes'][c]['phases'][n-1].update(values)
def scrub(s):
 for a,b in [('Wat gebeurt eerst','Wat gebeurt er eerst'),('Wat gebeurt daarna','Wat gebeurt er daarna'),('Kijk naar wat gebeurt','Kijk naar wat er gebeurt'),('wat gebeurt','wat er gebeurt'),('Vind de cursist','Vindt de cursist'),('Begin met eerste woord','Begin met het eerste woord'),('Leg de les af','Sluit de les af'),('klankgroepen','klanken en letters'),('klankgroep','letter of lettergroep')]:s=s.replace(a,b)
 return re.sub(r'(?<!\.)\.{2}(?!\.)','.',s)
def walk(v):
 if isinstance(v,dict):return{k:walk(x)for k,x in v.items()}
 if isinstance(v,list):return[walk(x)for x in v]
 return scrub(v)if isinstance(v,str)else v
ls=walk(ls)
for l in ls:
 w=l['id'];p=l['source']['package'];units=words[w]['segmentation'].split('|');sounds=[('t'if i==len(units)-1 and x=='d'else x)for i,x in enumerate(units)]
 for c,r in l['routes'].items():
  r['prerequisites']+=['Bereid alle keuzes en contextwoorden mondeling voor. Lees papierinstructies voor. Noteer wijzen, nazeggen, kopiëren en zelfstandig lezen afzonderlijk; geen automatische niveauclaim.']
  for i,x in enumerate(r['phases']):
   old=x['visible']
   x['visible']=w if c=='a'else l['source']['sentence']if c=='b'else'\n'.join(l['source']['text'])
   if i==3:x['visible']=' | '.join(r['cards'])
   if i==4:x['visible']=r['example']
   x['feedback']=f'Ja, dat past bij {w}. '+(x['expected']if len(x['expected'])<130 else'Wijs de passende woorden in de tekst aan.')
   if w.endswith('d')and c=='a'and i in [2,3,4]:x['action']+=' Je hoort aan het einde /t/ en schrijft d volgens het zichtbare, aangeleerde woordmodel. Horen alleen bewijst de spelling niet.'
  for x in l['worksheet']['rounds'][c]['answers']:
   x['action']+=' Lees de opdracht zo nodig voor en bereid alle keuzeopties mondeling voor. Noteer hulp afzonderlijk.'
   x['body']=x['body'].replace(' / ','\n')if c=='c'and x['number']==1 else x['body']
   if c=='a'and x['number']in [1,10]:x['visual']=w
   if 'trek over'in x['title'].lower():x['layout']='trace'
   if c=='a'and x['number']==3 and 'lijn'in x['title'].lower():x['layout']='matching';x['matchUnits']=units
   if c=='a'and x['number']==4:x['boxes']=len(units)if p not in [14]else len(w)
   if c=='a'and x['number']in [5,6,8,9]:x['criteria']='Schrijf exact de gevraagde letters of lettergroepen. Een betekenisgelijke spelling is geen juist antwoord. Noteer ondersteuning afzonderlijk.'
 # Genuine checkbox rows, with a spoken model that matches the answer per row.
 if p in [12,14,15]:
  opts=list(dict.fromkeys(sounds+(['m']if 'm'not in sounds else['t'])))
  task(l,'a',2,title='Luister. Kruis aan.',body='\n'.join(f'{i+1}  '+'   '.join('□ '+x for x in opts)for i in range(len(sounds))),answer='; '.join(f'{i+1} {s}'for i,s in enumerate(sounds)),oral='Zeg afzonderlijk: '+' · '.join(sounds)+'. Gebruik de klanken, geen letternamen.',criteria='Elke rij hoort bij de genoemde klank. Een eind-d klinkt als /t/; de spelling wordt apart met woordmodel geoefend.')
 if p==10:
  phase(l,'c',2,visible='\n'.join(l['source']['text']),action='Lees de tekst één keer rustig voor. Herhaal indien nodig. Laat luisteren zonder meezeggen.')
  phase(l,'a',6,expected={'sok':'Een sok. Dat is een sok.','stop':'Ik stop bij de deur.','stad':'Naar de stad.'}[w])
  phase(l,'c',1,expected=' / '.join(l['source']['text']))
  phase(l,'c',6,expected='Bij de voorgedane situatie hoort: '+' / '.join(l['source']['text']),action='Doe één concrete situatie uit de tekst voor; laat de bijbehorende zin aanwijzen. Doe geen nieuwe inhoud voor.')
  own={'sok':'Ik pak mijn sok.','stop':'Ik wacht bij de deur.','stad':'Ik koop brood in de stad.'}[w]
  for c in ['b','c']:phase(l,c,7,expected='Bijvoorbeeld: '+own,action=l['routes'][c]['phases'][6]['action']+' Bereid nieuwe woorden mondeling voor. Een letterlijk overgeschreven bronzin is geen bewijs van eigen productie.')
  if w=='sok':
   task(l,'a',1,title='Kijk. Omcirkel de sok.',body='Omcirkel de sok op de foto.',answer='De sok is omcirkeld.')
   task(l,'a',10,body='Kijk naar de foto. Schrijf het woord: ______.')
   task(l,'b',6,title='Welke zin staat in de tekst?',body='□ De sok ligt op de stoel.\n□ De sok ligt bij de stoel.')
   task(l,'c',3,title='Wat doe ik in de tweede zin?',body='□ Ik pak de sok.\n□ Ik trek de sok aan.')
   task(l,'c',5,title='Zet de drie stappen uit de tekst op volgorde.')
   task(l,'c',8,body='Iemand thuis vraagt: Waar ligt de sok? Schrijf een kort antwoord.')
   task(l,'c',10,body='Je zoekt je sok. Vraag iemand thuis om hulp.',answer='Bijvoorbeeld: Waar ligt mijn sok?',action='Bereid zoeken, mijn en de vraag Waar ligt ...? mondeling voor. Beoordeel een begrijpelijke hulpvraag.')
  elif w=='stop':
   task(l,'a',1,title='Kijk. Doe na.',body='De docent loopt naar de deur en stopt. Doe na.',answer='De cursist loopt en stopt bij de deur.',visual=None,action='Voer lopen en daarna stoppen duidelijk na elkaar uit; een stilstaande foto bewijst stoppen niet.')
   task(l,'a',10,title='Maak de zin af.',body='Kijk: stop. Ik ____ bij de deur.',answer='stop',visual=None)
   for n in [1,6]:phase(l,'b',n,expected='De persoon stopt bij de deur.',studentAction='Doe het stoppen bij de deur voor. Zeg: De persoon stopt bij de deur.')
   task(l,'b',6,title='Welke zin staat in de tekst?',body='□ Ik stop bij de deur.\n□ Ik wacht bij de deur.')
   task(l,'c',1,title='Lees. Zoek de drie woorden.')
   task(l,'c',5,title='Zet de zinnen in de volgorde van de tekst.')
   task(l,'c',6,body='□ De deur is dicht.\n□ De deur is open.')
   task(l,'c',8,title='Maak een bordje.')
   task(l,'c',9,title='Wat doet de ik-persoon als de deur dicht is?')
   task(l,'c',10,body='Je wacht bij een dichte deur. Schrijf dat aan iemand op het werk.')
   phase(l,'c',8,prompt='Waar stop ik? Hoe is de deur? Wat doe ik?',expected='Bij de deur. De deur is dicht. Ik wacht even.',studentAction='Beantwoord de drie vragen en wijs de passende zinnen aan.')
  else:
   task(l,'a',1,title='Kijk naar de stad.',body='Wijs de stad op de foto aan. Vertel wat je ziet.',answer='De cursist wijst het stedelijke geheel aan.',criteria='Ondersteund betekenisgesprek; één foto bewijst geen zelfstandig onderscheid tussen stad en dorp.')
   task(l,'a',8,body='Kijk: stad. Je hoort aan het einde /t/. Schrijf de laatste letter over: sta□.',answer='d')
   task(l,'a',10,body='Kijk naar de foto. Schrijf het woord: ______.')
   task(l,'b',3,title='Onderstreep waar de bus naartoe rijdt.',body=l['source']['sentence'],answer='naar de stad')
   task(l,'b',4,title='Onderstreep wat rijdt.',body=l['source']['sentence'],answer='De bus')
   task(l,'b',6,title='Welke zin staat in de tekst?',body='□ De bus rijdt naar de stad.\n□ De bus rijdt in de stad.')
   task(l,'c',3,title='Onderstreep wie meegaat.',body='Ik ga mee.',answer='Ik')
   task(l,'c',5,body='Trek lijnen.\nde bus          koop ik\nik                 rijdt\nbrood           ga mee',answer='de bus–rijdt; ik–ga mee; brood–koop ik')
   task(l,'c',8,body='Schrijf op het boodschappenbriefje wat de persoon in de tekst koopt.',answer='brood')
   for n in [9,10]:task(l,'c',n,action='Functionele transfer: bereid ben, met, waar en de zinsbouw mondeling voor. Beoordeel een begrijpelijk bericht, geen letterlijk teruggevonden bronzin.')
   phase(l,'c',8,prompt='Waar rijdt de bus naartoe? Wie gaat mee? Wat koop ik?',expected='Naar de stad. Ik ga mee. Brood.',studentAction='Beantwoord de drie vragen en wijs de passende zinnen aan.')
 elif p==11:
  task(l,'a',1,title='Kijk. Omcirkel '+w+'.',body='Omcirkel '+('één boon'if w=='boon'else'de '+w)+' op de foto.',answer='De '+w+' is aangewezen of omcirkeld.')
  task(l,'a',10,body='Kijk naar de foto. Schrijf het woord.')
  task(l,'a',8,title='Luister. Schrijf de letters.',body='Schrijf bij elke klank de letter of letters: □   □   □.',oral='Zeg afzonderlijk: '+' · '.join(units)+'.')
  task(l,'a',9,title='Schrijf letters en stukjes.',body='Vier letters: □ □ □ □\nDrie stukjes: □ □ □',answer='Letters: '+' | '.join(w)+'; stukjes: '+' | '.join(units))
  if w in ['boon','boot']:task(l,'a',7,answer='Omcirkel posities 1, 5 en 8, van links naar rechts en van boven naar beneden.')
  q,a,draw={'boom':('Waar staat de boom?','bij het huis','Een herkenbare boom bij een huis.'),'boon':('Welk woord vertelt de kleur?','bruine','Eén herkenbare bruine boon.'),'boot':('Waar ligt de boot?','bij de brug','Een herkenbare boot bij een brug.')}[w]
  task(l,'b',3,title='Wat zie ik?'if w=='boon'else q)
  task(l,'b',4,title=q+' Onderstreep.',body=l['source']['sentence'],answer=a)
  task(l,'b',9,answer=draw,criteria='Beoordeel alleen de informatie uit de voorbeeldzin; tekentalent telt niet.')
  task(l,'c',5,title='Zet de zinnen in de volgorde van de tekst.',criteria='Tekstvolgorde 3, 1, 2; geen afzonderlijk bewezen chronologie.')
  phase(l,'c',8,action='Sluit af door de drie zinnen in tekstvolgorde terug te vinden. Een plaats of toestand is geen afzonderlijke handeling.',observe='Vindt de cursist de informatie en tekstvolgorde terug, met of zonder hulp?')
  if w=='boom':task(l,'c',10,body='Schrijf over de mus. Wat gebeurt eerst en daarna?',answer='Bijvoorbeeld: Er zit een mus in de boom. Daarna vliegt de mus weg.',action='Bereid eerst en daarna mondeling voor. Beide momenten moeten herkenbaar zijn.')
  if w=='boon':task(l,'c',6,body='□ Ik eet de boon.\n□ Ik leg de boon op het bord.')
  if w=='boot':task(l,'c',6,body='□ Een man stapt in de boot.\n□ Een man stapt uit de boot.')
  task(l,'c',9,answer={'boom':'Eerst: de mus zit in de boom. Daarna: de mus vliegt weg.','boon':'Eerst: de boon ligt op het bord. Daarna: ik eet de boon.','boot':'Eerst: de man stapt in de boot. Daarna: dezelfde man vaart met de boot weg.'}[w])
 elif p==12:
  phase(l,'a',6,expected={'tand':'De tand wordt correct herkend en benoemd.','been':'Het been wordt correct herkend en benoemd.','bord':'Het bord wordt correct herkend en benoemd.','jurk':'De jurk wordt correct herkend en benoemd.'}[w])
  for c in 'abc':
   for x in l['routes'][c]['phases']:x['action']=re.sub(r'Toon ([A-Z])',lambda m:'Toon '+m[1].lower(),x['action'])
  task(l,'a',2,criteria='Kruis per uitgesproken klank de passende letter of lettergroep aan.'+(' Ee bestaat uit twee letters voor één klank.'if w=='been'else' De spelling van eind-d wordt afzonderlijk met woordmodel geoefend.'if w.endswith('d')else''))
  task(l,'a',8,title='Luister. Schrijf de letters.',body='Schrijf de letters bij de eerste drie klanken: □ □ □.',answer=' | '.join(units[:3]),oral='Zeg uitsluitend: '+' · '.join(units[:3])+'.')
  task(l,'a',9,title='Schrijf de stukjes.',body='Kijk: '+w+'. Schrijf '+' | '.join(units)+'.',answer=' | '.join(units))
  task(l,'b',1,title='Onderstreep '+w+'.',answer=w)
  task(l,'b',4,criteria='Onderstreep exact: '+{'tand':'elke tand','been':'Mijn been','bord':'op tafel','jurk':'in de kast'}[w]+'.')
  draw={'tand':'Iemand poetst een tand.','been':'Een been met een aangeduide pijnplek; pijn hoeft niet uit een foto te blijken.','bord':'Een eetbord op tafel.','jurk':'Een jurk die in de kast hangt.'}[w]
  task(l,'b',9,body='Teken wat de zin zegt: '+l['source']['sentence'],answer=draw,criteria='Alleen de voorbeeldzin wordt beoordeeld. Geen eis uit de rest van de tekst; tekentalent telt niet.')
  for c in ['b','c']:phase(l,c,7,expected='Bijvoorbeeld: '+{'tand':'Poets je tanden.','been':'Mag ik even zitten?','bord':'Ik leg brood op mijn bord.','jurk':'Ik pak de jurk uit de kast.'}[w],action='Laat een eigen passende uiting maken. Bereid de benodigde nieuwe woorden of vraagvorm eerst mondeling voor. Een eigen variant is goed.')
  task(l,'c',6,title='Wat vertelt iedere zin?',body='Schrijf bij zin 1, 2 en 3 kort wat er staat.',answer='1: '+l['source']['text'][0]+'\n2: '+l['source']['text'][1]+'\n3: '+l['source']['text'][2])
  x=l['worksheet']['rounds']['c']['answers'][6];x['body']=x['body'].replace('In deze zin staat één verkeerd woord:','Deze zin klopt niet met de tekst:')
  if w=='tand':
   task(l,'c',3,body='Wat doe ik na het poetsen?\n□ Ik spoel mijn mond.\n□ Ik poets mijn tanden.',answer='Ik spoel mijn mond.')
   task(l,'c',10,body='Schrijf een korte herinnering voor thuis over tandenpoetsen.')
   phase(l,'c',6,prompt='Wat zegt de tekst over mijn tanden?',expected='Mijn tanden zijn schoon.',studentAction='Wijs de zin aan die het resultaat noemt. Een gebaar bewijst niet of tanden werkelijk schoon zijn.')
  elif w=='been':
   task(l,'a',1,body='Kijk naar het been op de foto. Kies: □ been  □ arm.',answer='been')
   for c in ['b','c']:phase(l,c,1,studentAction='Luister naar de docent: Mijn been doet pijn. Wijs het been aan.',action='Gebruik de foto om het been aan te wijzen. Spreek de pijnzin zelf uit; pijn is geen bewezen fotofeit.')
   task(l,'b',3,body='Mijn been doet pijn.\n□ Mijn been.\n□ Mijn arm.',answer='Mijn been.')
   task(l,'b',6,title='Welke zin staat in de tekst?',body='□ Mijn been doet pijn.\n□ Mijn arm doet pijn.')
   task(l,'b',8,body='1. Wat doet pijn?\n2. Welke twee woorden staan na been?',answer='1. Mijn been. 2. doet pijn.')
   task(l,'c',3,body='Waar ga ik zitten?\n□ Op een stoel.\n□ Op de vloer.',answer='Op een stoel.')
  elif w=='bord':
   phase(l,'b',1,prompt='Waar staat het bord?',studentAction='Zet een bord op tafel. Wijs aan waar het staat.')
   task(l,'b',3,body='Het bord staat op tafel.\n□ Op tafel.\n□ In de kast.',answer='Op tafel.')
   task(l,'c',3,body='Wat leg ik op het bord?\n□ Brood.\n□ Kaas.',answer='Brood.')
   task(l,'c',8,body='Welke tekst past bij brood op een bord voor het eten?\n□ Leg het brood op het bord.\n□ Laat het brood op tafel liggen.')
   task(l,'c',10,body='Schrijf waar het bord moet staan en waar het brood moet liggen.',answer='Bijvoorbeeld: Zet het bord op tafel. Leg het brood op het bord.')
  else:
   phase(l,'a',1,studentAction='Wijs de jurk aan en zeg welk kledingstuk je ziet.')
   phase(l,'a',6,expected='De bedoelde jurk wordt correct herkend en benoemd.')
   task(l,'b',3,body='De jurk hangt in de kast.\n□ In de kast.\n□ Op een hanger buiten de kast.')
   task(l,'b',6,title='Welke zin staat in de tekst?',body='□ De jurk hangt in de kast.\n□ De jurk ligt op de stoel.')
   task(l,'c',8,body='Welke tekst past bij kleding pakken?\n□ Ik pak de jurk. Daarna trek ik hem aan.\n□ Ik leg de jurk op de stoel.')
   task(l,'c',9,answer='Bijvoorbeeld: De jurk hangt in de kast. Daarna pak ik hem uit de kast.')
   task(l,'c',10,criteria='Een begrijpelijk bericht dat pakken en aantrekken vermeldt. Een vraag is niet verplicht.')
 elif p==14:
  action={'kook':'Doe alsof je bonen in een pan roert.','koop':'Speel met de docent na dat je een brood koopt en betaalt.','maak':'Maak een kaart: teken een bloem en schrijf je naam op de kaart.'}[w]
  task(l,'a',1,title='Kijk. Doe na.',body='De docent zegt: '+l['source']['sentence']+'\n'+action,answer='De cursist toont de voorbereide handeling.',visual=None,action='Doe de handeling voor met passend materiaal. Een stilstaand voorwerp alleen bewijst de werkwoordbetekenis niet.')
  for n in [1,6]:phase(l,'a',n,studentAction=action,expected=l['source']['sentence'],action='Doe voor en spreek de volledige ik-zin uit: '+l['source']['sentence']+' Laat de cursist daarna zelf handelen; het is geen gebiedende wijs.')
  task(l,'a',3,title='Onderstreep '+('aa'if w=='maak'else'oo')+'.',body=w)
  for n in [5,8]:task(l,'a',n,title='Luister. Schrijf de letters.',body='Schrijf bij elke klank de letter of letters: □ □ □.',oral='Zeg: '+' · '.join(units)+'.',answer=' | '.join(units))
  task(l,'a',6,title='Vul de ontbrekende letters in.')
  task(l,'a',9,title='Schrijf de letters apart.')
  task(l,'a',10,title='Schrijf het woord.',body='De docent zegt: '+l['source']['sentence']+'\nSchrijf het geoefende woord: ______.',visual=None)
  task(l,'b',4,title='Onderstreep wat ik '+{'kook':'kook','koop':'koop','maak':'maak'}[w]+'.')
  task(l,'b',6,title='Zoek dezelfde zin. Kruis aan.',criteria='Visuele zinsherkenning; geen afzonderlijk bewijs van zelfstandig tekstbegrip.')
  task(l,'b',8,title={'kook':'Wie kookt de bonen?','koop':'Wie koopt een brood?','maak':'Wie maakt een kaart?'}[w])
  task(l,'b',9,title='Schrijf een passende zin.',body='Bedenk een tweede situatie met '+w+'. De docent helpt met nieuwe woorden.',answer='Bijvoorbeeld: '+{'kook':'Ik kook soep.','koop':'Ik koop kaas.','maak':'Ik maak een tekening.'}[w],criteria='Een begrijpelijke eigen zin met het werkwoord; bereid nieuwe woorden eerst mondeling voor.')
  task(l,'c',2,title='Wat gebeurt er eerst?'if w=='kook'else'Welke zin staat eerst in de tekst?')
  task(l,'c',4,title={'kook':'Wat zijn ze in de tweede zin?','koop':'Over welk brood gaat het?','maak':'Welke kaart bedoel ik?'}[w],body={'kook':'Daarna doe ik ze op mijn bord. Wat zijn ze?','koop':'Daarna doe ik het brood in mijn tas. Over welk brood gaat het?','maak':'Daarna schrijf ik mijn naam op de kaart. Welke kaart?'}[w])
  task(l,'c',6,title='Zet de zinnen in de volgorde van de tekst.',criteria='De tekstvolgorde is 3, 1, 2. Kopen of maken omvat de andere handelingen; geen drie strikt gescheiden gebeurtenissen claimen.')
  task(l,'c',7,title='Onderstreep Daarna. Schrijf wat er daarna gebeurt.')
  phase(l,'c',1,prompt='Wat vertelt iedere zin?',expected=' / '.join(l['source']['text']),studentAction='Kijk naar de situatie. Vertel wat iedere zin noemt; de docent doet de handelingen voor.')
  if w=='koop':task(l,'c',10,body='Iemand thuis vraagt: Waar is het brood? Schrijf een antwoord.',answer='Bijvoorbeeld: Het brood is in mijn tas.')
  if w=='maak':task(l,'c',10,answer='Bijvoorbeeld: Ik maak een kaart. Ik schrijf mijn naam op de kaart.')
 elif p==15:
  opening={'maan':'Wat zie je?','maand':'Welke maanden zie je?','mee':'Wie gaan samen naar de winkel?','meer':'Wat verandert er in de kom?'}[w]
  for c in ['b','c']:phase(l,c,1,prompt=opening)
  phase(l,'c',7,prompt='Zeg een eigen zin of vraag.',studentAction='Zeg een passende eigen zin of vraag. De docent kan deze noteren; schrijven doe je afzonderlijk op het werkblad.')
  task(l,'a',5,title='Trek over. Schrijf.',layout='trace',body=w,answer=w)
  task(l,'a',6,answer={'maan':'aa | m | n','maand':'d | a | m','mee':'ee | m | e','meer':'ee | r | m'}[w])
  if w=='maan':
   task(l,'a',1,body='Omcirkel de maan op de foto.',answer='De maansikkel aan de hemel is omcirkeld.')
   task(l,'a',7,body='maan  naam  aman  maan  mee  amna',answer='Posities 1 en 4.',criteria='Zoek alleen de exacte geschreven vorm maan; de andere reeksen hoeven niet gelezen te worden.')
   task(l,'b',8,title='Beantwoord de vraag.')
   task(l,'b',9,title='Teken wat de zin zegt.',body='Ik zie de maan. Teken de maan die je ziet.',answer='Een herkenbare maan; geen niet-getekend raam vereisen.')
   task(l,'c',4,title='Welke zin vertelt wat?',body='Zet 1 bij wat ik zie. Zet 2 bij waar de maan staat.\n□ Ik zie de maan.\n□ De maan staat boven het huis.',answer='Eerste zin 1; tweede zin 2.')
   task(l,'c',7,title='Waardoor kijk ik naar de maan?',body='□ door het raam\n□ door de deur',answer='door het raam')
   task(l,'c',10,title='Schrijf een kort bericht.',body='Wat zie je door het raam? Schrijf het aan iemand thuis.')
   for n in [1,6]:phase(l,'c',n,studentAction='De docent doet kijken door het raam voor. Wijs de zin aan die daarbij past.',action='Doe de kijkhandeling voor. De maanfoto toont de maan; ze bewijst niet dat iemand door een raam kijkt.')
  elif w=='maand':
   task(l,'a',1,title='Wijs de kalendermaanden aan.',body='Wijs april en mei aan.',answer='April en mei zijn twee kalendermaanden.')
   task(l,'a',8,title='Lees. Schrijf de laatste letter.',body='Kijk: maand. Schrijf de laatste letter: maan□.',answer='d',oral='Aan het einde hoor je /t/. De geschreven laatste letter in maand is d.')
   task(l,'a',10,body='Dit kalenderblad toont één _____.',answer='maand')
   task(l,'b',4,title='Welke maand is het in de zin?')
   task(l,'b',9,visual='maand')
   task(l,'b',8,title='Beantwoord de vraag.',body='Is het april? Kruis aan: □ ja  □ nee.',answer='ja')
   phase(l,'b',6,prompt='Welke maand is het in de zin?',studentAction='Lees de zin. Antwoord: april.',expected='april')
   task(l,'c',5,title='Welke maand weten we?',body='In mei heb ik een afspraak. Schrijf de maand.',answer='mei')
   task(l,'c',6,title='Schrijf de maanden in de juiste volgorde.',body='Eerst: ______ 2027. Daarna: ______ 2027.',answer='april | mei')
   task(l,'c',8,title='Weten we op welke dag de afspraak is?',body='In mei heb ik een afspraak. Kruis aan: □ ja  □ nee.',answer='nee; de tekst noemt alleen de maand mei.')
   task(l,'c',10,body='Schrijf een kort bericht over je afspraak in mei.',answer='Bijvoorbeeld: In mei heb ik een afspraak.')
   for c in ['b','c']:
    for x in l['routes'][c]['phases']:x['prompt']='Oefensituatie: het is nu april 2027. '+x['prompt']
   l['contextCaption']='Oefensituatie: het is nu april 2027.'
   l['boardImage']='/docent-werkbladen/lespakketten-10-15/maand-kalenders.png'
  elif w=='mee':
   task(l,'a',1,title='Welke zin past?',body='De docent loopt samen met iemand naar de winkel.\n□ Ik ga mee.\n□ Ik ga alleen.',answer='Ik ga mee.',visual=None,action='Doe meelopen met twee personen voor. De foto bewijst geen familierelatie of bestemming.')
   task(l,'b',7,title='Onderstreep waar ik naartoe ga.')
   task(l,'b',8,title='Met wie ga ik mee?',body='Ik ga mee met mijn _____.',answer='buur')
   task(l,'c',6,title='Zet de handelingen in volgorde.',body='□ Boodschappen doen.\n□ Naar de winkel gaan.',answer='Eerste regel 2; tweede regel 1.')
   task(l,'c',8,title='Welke zin past?')
   task(l,'c',10,body='Je gaat nu met je buur naar de winkel. Schrijf een zin met samen.',answer='Bijvoorbeeld: We doen samen boodschappen.')
   phase(l,'a',1,studentAction='Loop met iemand mee; wissel van rol.',action='Laat twee personen meelopen voordoen. Maak buur en samen mondeling duidelijk; de foto is ondersteuning.')
  else:
   task(l,'a',1,body='Kijk naar dezelfde kom, eerst en daarna. Waar is meer soep?',answer='Daarna, in de rechterkom.')
   task(l,'a',7,criteria='Zoek alleen de exacte geschreven vorm meer; de andere vormen hoeven niet gelezen te worden.')
   task(l,'b',4,title='Wat wil ik?',body='Ik wil meer soep.',answer='meer soep')
   task(l,'b',8,body='Je vraagt om extra soep. Wat zeg je?\n□ Ik wil meer soep.\n□ Ik wil minder soep.',answer='Ik wil meer soep.')
   task(l,'c',5,title='Welke zin vertelt wat ik doe?',body='□ Ik wil meer soep.\n□ Ik schep er soep bij.',answer='Ik schep er soep bij.')
   task(l,'c',6,title='Lees. Wat gebeurt er met de kom?',body='Ik schep er soep bij.\n□ De kom blijft bijna leeg.\n□ De kom wordt voller.',answer='De kom wordt voller.')
   task(l,'c',8,title='Waar komt de extra soep?',body='Mijn kom is bijna leeg. Ik schep er soep bij.',answer='In mijn kom.')
   task(l,'c',10,body='Schrijf aan iemand aan tafel dat je nog wat soep wilt.',answer='Bijvoorbeeld: Mijn kom is bijna leeg. Mag ik nog wat soep?')
   phase(l,'b',6,prompt='Wat wil ik?',studentAction='Lees de zin en zeg wat ik wil.',expected='meer soep')
   phase(l,'c',3,prompt='Welke zin vertelt wat ik doe?',studentAction='Wijs de zin aan die vertelt wat ik doe.',expected='Ik schep er soep bij.')
   l['boardImage']='/docent-werkbladen/lespakketten-10-15/meer-soep.png'
 if p==14:
  task(l,'a',10,title='Schrijf het woord bij de afbeelding.',body='Kijk naar de afbeelding. Schrijf het geoefende woord: ______.',visual=w)
  if w=='maak':l['boardImage']='/docent-werkbladen/lespakketten-10-15/maak-kaart.png'
 # Keep written letters and sound cards distinct in the actual printable spaces.
 for c,sheet in l['worksheet']['rounds'].items():
  for x in sheet['answers']:
   if c=='a':
    if x['number']==4 and re.search(r'Zet|Maak het woord',x['title'],re.I):x['boxRows']=[dict(label='',count=len(w)if p in [13,14]else len(units))]
    if x['number']in [5,8] and 'luister'in x['title'].lower()and '□'in x['body'] and '□ '+w not in x['body']:
     count=3 if p==12 else len(units)
     x['boxRows']=[dict(label='',count=count)]
    if x['number']==9 and p in [10,11,12,14]:
     x['boxRows']=[dict(label='Letters',count=len(w)),dict(label='Stukjes',count=len(units))]if p==11 else[dict(label='',count=len(units)if p==12 else len(w))]
   if c=='a'and x['number']==7:
    content=x['body'].split('in:')[-1]if p==12 else x['body']
    rows=content.replace(' / ','\n').split('\n')
    rows=[line.strip().removeprefix('□').strip()for line in rows if not line.startswith('Omcirkel')]
    x['searchRows']=[re.split(r'\s{2,}',line)for line in rows]
    if p==15:x['searchRows']=[x['body'].split()]
    assert sum(cell==w for row in x['searchRows']for cell in row)>=2,(w,x['searchRows'])
   if c=='c'and 'volgorde'in x['title'].lower():x['body']=re.sub(r'□\s*\[\s*\]|□','___',x['body'])
   if p==11 and c=='c'and x['number']==9:x['drawingPanels']=2
   if w=='meer'and c=='b'and x['number']==9:x['drawingPanels']=2
   if p==11 and any(re.search(r'\b'+other+r'\b',x['criteria'],re.I)for other in ['boom','boon','boot']if other!=w):x['criteria']='Beoordeel het opgegeven lesgebonden antwoord; noteer benodigde steun afzonderlijk.'
 # Refresh the shared views after source-bound corrections.
 l['phases']=l['routes']['a']['phases']
 l['presentation'].update(entryAction=l['routes']['c']['phases'][0]['studentAction'],ownPrompt=l['routes']['c']['phases'][6]['prompt'],ownHint=l['routes']['c']['phases'][6]['hint'],wordUse=l['routes']['a']['phases'][5]['studentAction'])
 assert l['source']['sentence']==l['routes']['b']['example'] and l['source']['text']==l['routes']['c']['example'].split('\n')
for l in ls:
 for c,s in l['worksheet']['rounds'].items():
  for x in s['answers']:
   for k in ['title','body','answer','oral','action','criteria']:
    x[k]=re.sub(r'Alfa\s*[ABC]','de oefenroute',x[k]).replace('schematische tekening','foto').replace('schematische','afgebeelde').replace('Schematische','Afgebeelde')
   assert x['title']and x['body']and x['answer']and x['criteria'],(l['id'],c,x['number'])
changes=[]
def diff(a,b,path):
 if isinstance(a,dict)and isinstance(b,dict):
  for k in a.keys()|b.keys():diff(a.get(k),b.get(k),path+'/'+k)
 elif isinstance(a,list)and isinstance(b,list)and len(a)==len(b):
  for i,(x,y)in enumerate(zip(a,b)):diff(x,y,path+'/'+str(i))
 elif a!=b:changes.append(dict(path=path,before=a,after=b))
diff(before,ls,'lessons')
(R/'repairs-ledger.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n')
(R/'repaired-lessons.json').write_text(json.dumps(ls,ensure_ascii=False,indent=2)+'\n')
print('20 lesson kernels retained;',len(changes),'source-bound field corrections and presentation adaptations recorded')
