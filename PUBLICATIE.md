# Klink — canonieke publicatie

Publiceer alleen `main` uit 26buckets/taalroute-klink op klink.taalroute.nl.
Geen publicatie uit de aparte UI-werkmap of een oudere checkout.

Gepubliceerd en live gecontroleerd op 18 oktober 2026: zichtbaar
keuzepaneel op Start, aparte fotohulp, zes zichtbare oefenstappen en grijze
plaatsen voor ontbrekend aanbod. Zie `docs/klink-route-panel-review-20261018.json`.
Geen nieuwe inhoud, beelden of audio. De eerdere lokale niveauroute blijft behouden.

Meegepubliceerde vervolguitwerking 18 oktober 2026: vier ingangen
per onderdeel, aparte lees-/taalkeuzes, leeropbouw, plaatsing Nu zelf / Met de
docent / Voor later, en instelbare beeldsteun. Zie
`docs/klink-level-routes-review-20261018.json`. De bronbank en mediabestanden
blijven gelijk. Het hieronder genoemde actieve live-register blijft leidend.
Nico heeft deze concrete versie nu expliciet vrijgegeven voor publicatie.
Het nieuwe inhoudsgebonden akkoord en de behoudcontrole staan in
`docs/klink-owner-release-route-panel-20261018.json`. Historische akkoorden
blijven bewaard; dezelfde publicatiepoort controleert de nieuwe bestandshashes.
Het huidige responsieve bodemmenu is vastgelegd in
`docs/KLINK-GOEDGEKEURDE-NAVIGATIE-20261018.md` en krijgt een behoudtest.

Audiopauze op verzoek van Nico, 18 oktober 2026: geen nieuwe audio genereren,
geen ElevenLabs-productie en geen nieuwe audiokoppelingen in Klink. Bestaande
audio ongewijzigd laten; ontbrekende audio uitsluitend administreren. Hervatten
vraagt een expliciete nieuwe opdracht van Nico. De menureview heft dit niet op.

De publicatie van 17 oktober 2026 combineert de Lexicon-indeling, de bestaande
les-/oefenspelers, de aangesloten teksten/gesprekken en alle 338 woordbeelden.
Nico's expliciete akkoord staat in docs/klink-content-approval-20261017.json.
Dat is geen onafhankelijk bewijs van item-voor-item luisterbeoordeling.
De losse t blijft afgekeurd/geparkeerd. Geen automatische beheersingsclaim.

Actief register: `docs/klink-publication-cumulative-20261018.json`.
Livebron: `7008a35917f73f5ea52df1089c5c2e7c53a741f4`.
Worker-versie: `22187f39-a827-442e-929b-280e4c79d653`.
Latere registercommits op main zijn geen nieuwe runtimepublicatie.

Vervolgopdracht 18 oktober: Nico koos Stappenlijn erboven met cijferrondjes
van 30 px en gaf expliciet opdracht deze online in te bouwen. Alleen de uitleg
Zo oefen je op Start wijzigt: witte cijfers boven zes bestaande kaders, verbonden
door een horizontale lijn; op mobiel een verticale lijn links van de kaders.
Deze uniforme cijfers zijn geen actieve of voltooide stappen. De interactieve
oefenlijn, fotokaarten, inhoud, audio en het bodemmenu blijven ongewijzigd.
Vrijgave: `docs/klink-owner-release-clear-step-line-20261018.json`.
Gepubliceerd en online gecontroleerd: 87 unittests en 156 browsercontrolegroepen
lokaal geslaagd, plus publicatiebewijstests, TypeScript en gerichte codecontrole.
Live zijn stappenlijn, routekeuzes, bodemmenu, docentbeelden en handleiding
gecontroleerd. Alle 2.679 aangeboden mediabestanden zijn bytegelijk teruggelezen.

Op verzoek van Nico hebben de zes stappen van Zo oefen je weer hun eigen
kadertje: de bestaande rand en papierachtergrond zijn hersteld. De huidige
ronde nummers, compacte maat, plaatsing en responsieve indeling zijn behouden.
De borderloze variant uit de eerdere beeldgidsronde is daarmee ingetrokken.
De volledige lokale regressie, live kader-/route-/docentbeeld-/wikicontroles
en vergelijking van alle 2.679 mediabestanden slagen. Geen gewijzigde inhoud
of audio. Scope: `docs/klink-owner-release-step-frames-20261018.json`.

Hoofdstuk 12 heet op verzoek van Nico nu Het idee achter Klink. De klantpagina
vertelt over de oorsprong, kleine stappen, Lexicon Basis 1000, beeldsteun en
praktische toepassing; LASLLIAM blijft kort genoemd. Bronnenlijst, datums en
interne controle-/reviewtaal zijn daar verwijderd. De interne onderbouwing en
historische beperkingen blijven bewaard. Hoofdstukken 1–11 zijn exact behouden.
De volledige lokale regressie en online wiki-, route- en docentbeeldcontroles
slagen. Alle 2.679 aangeboden media zijn opnieuw bytegelijk teruggelezen.
Akkoord en scope: `docs/klink-owner-release-origin-story-20261018.json`.

Nieuwste aanscherping op 18 oktober: vijf beeldblokken met concrete voorbeelden
staan in Docentomgeving → Overzicht → Van woordbeeld naar situatie. Dit is
docentuitleg, geen nieuwe cursistreeks. De cursist ziet een rustige oefenlijn
onder Start met ronde nummers; alleen een echte geselecteerde oefenstap krijgt
een witte nummering in een donkere cirkel. Het vastgestelde Klink-logo is circa
15% kleiner. Alle inhoud en mediabestanden blijven behouden. De volledige
lokale regressie slaagt met 87 unittests en 156 browsercontrolegroepen.
Online zijn de voorbeelden, routekeuzes en handleiding gecontroleerd en alle
2.679 media bytegelijk teruggelezen. Geen nieuwe audio of menselijke cursistproef.
Akkoord: `docs/klink-owner-release-picture-guide-20261018.json`.

Laatste aanscherping op 18 oktober: één compacte keuzebalk met Lezen/Taal,
contextgebonden rij, tweede klik deselecteert en één Hulp-knop. Taalroute en
Klink staan met een zichtbare scheidingslijn in de header; de dubbele merken
zijn uit beide zijmenu’s verwijderd. Bodemmenu, foto’s, oefenlijn, leerinhoud,
spelers en audio blijven gelijk. Docentenhandleiding en verwijzingen zijn
bijgewerkt. Akkoord: `docs/klink-owner-release-compact-route-20261018.json`.
Volledige lokale regressie (87 unittests, 153 browsercontrolegroepen), zeven
publicatiebewijstests, codecontrole en live route-, menu-, kaart-, speler-,
werkblad- en wikicontroles geslaagd. Alle 2.679 media opnieuw bytegelijk
teruggelezen. Geen nieuwe audio; geen menselijke cursistproef.

De routekeuze en oefenlijn zijn lokaal én live gecontroleerd. De volledige
lokale regressiereeks is geslaagd, evenals de aanvullende route- en
publicatiebewijstests. Live zijn ook de vijf vaste menuknoppen, compacte
fotokaarten, stabiele spelers, oefenbladen en bijgewerkte docentenwiki
gecontroleerd. Alle 2.679 aangeboden mediabestanden zijn bytegelijk teruggelezen.
Alfa C/B1 en de nog te maken beeldvormen blijven eerlijk als ontbrekend aanbod
zichtbaar. Geen nieuwe audio of nieuwe inhoud. Historische lokale reviewverslagen
bewaren hun toenmalige status; het actieve register is leidend. De gerichte
codecontrole slaagt; algemene bestaande lintmeldingen elders zijn niet opgelost.

De derde didactische review is gepubliceerd na Nico's expliciete akkoord en de
lokale eindcontrole. Zie `docs/KLINK-DIDACTISCHE-REVIEW-RONDE3-20261018.md` en
`docs/klink-owner-release-round3-20261018.json`. Toegevoegd: concrete docenthulp
per bestaande leesstap; aangescherpt: klankvoorbeelden, foutherstel, antwoordposities
bij terughalen, selectie na succes en docentstatus. Tien gesimuleerde perspectieven,
geen tien echte experts of cursistproef. De online nacontrole omvat 44
browsercontrolepunten en alle 2.679 aangeboden mediabestanden. Audio, beelden,
woordindeling, routes en opslag blijven behouden. De docenthulp is een voorbeeldblok,
geen nieuw cursusprogramma of beheersingsbewijs.

Publicatieopdracht van 18 oktober: Nico heeft de nieuwe klank-, spelling-,
grammatica-, praktijk- en tekstbegripreeksen plus geplande herhaling en beide
menureviews expliciet vrijgegeven voor publicatie. Het nieuwe inhoudsgebonden
akkoord staat in `docs/klink-owner-release-20261018.json`; de historische
akkoorden blijven bewaard. Dit is geen bewijs van een onafhankelijke menselijke
inhoudsbeoordeling. De audiopauze en beperkingen uit de reviewverslagen blijven
gelden. Deze versie is nu gepubliceerd en online gecontroleerd. De 431 reeksen
hergebruiken bestaande inhoud; dit zijn geen 431 nieuwe lessen. De vijf
cursistknoppen en twaalf hoofdstukken blijven staan. De docentwijzer, vaste
klikroutes, gelijke benamingen, terugkeer naar de gekozen kaart en geldige
herhaalopdrachten zijn meegepubliceerd. Lokaal zijn 75 unittests en 132
aanvullende controlepunten geslaagd; online 39 browsercontrolepunten.
Alle 2.679 aangeboden mediabestanden zijn opnieuw bytegelijk teruggelezen;
de audiopauze blijft van kracht. De eerdere reviewverslagen bewaren bewust
hun toenmalige ontwikkelstatus; het actieve publicatieregister is leidend.

Op 18 oktober is naast de bestaande reeks de keuze 'Op één blad' toegevoegd
aan tien woordactiviteiten. Alle geselecteerde woorden blijven op dezelfde
scrollbare pagina. Dit gebruikt de bestaande spelers, afleiders, media en
leesvoorwaarden, zowel via Lessen als Oefenen. De woordroute, hoofdstukken,
bingo's, koppelbladen en vaste één-voor-éénkaart blijven behouden. Zie
`docs/klink-practice-sheet-review-20261018.json` voor scope en beperkingen.
De volledige lokale regressiereeks en live blad-, hoofdstuk- en kaartcontroles
zijn geslaagd; alle 2.679 aangeboden mediabestanden zijn opnieuw bytegelijk.

Eerder op 18 oktober is het gedeelde oefenvlak gestabiliseerd: een vaste,
ruime hoogte per schermformaat, een vaste onderrand en een gereserveerd volledig
beeldvlak. Lange opdrachten blijven scrollbaar. Lam/kat, woordwissels en audio
zijn lokaal en live gecontroleerd op vijf schermformaten. De volledige lokale
regressiereeks is geslaagd; alle 2.679 media zijn live bytegelijk teruggelezen.
De hoofdstukken, lessen, compacte overzichtskaarten en inhoud blijven behouden.

Oefenen heeft twaalf rechtstreekse hoofdstukken, los van Lessen. Alle veertig
bestaande oefenvormen gebruiken dezelfde spelers, woorden, bronnen en media.
De woordroute blijft vijftien onderdelen met 302 lessen. Hoofdstuklinks zijn
herlaadbaar onder `#learner/chapters/…`; vrije oefenvoortgang blijft apart van
de lesroute. Alfa A/B volgt bestaande leesvoorwaarden; A1/A2 zijn bronlabels
met hulp, geen behaalde niveaus. Losse klanken, expliciete spellingregels,
volledige grammatica en B1 zijn hierdoor niet ineens voltooid. Zie
`docs/KLINK-APARTE-HOOFDSTUKKEN-20261017.md`. De volledige lokale regressiereeks
plus hoofdstuktests en de live hoofdstuk-/fotokaartcontroles zijn geslaagd.

Het onderdelenoverzicht heeft kleinere kaarten met volledige foto's, zonder
uitsnede of vergroting. De foto's van onderdelen 7, 9, 14 en 15 zijn op
Nico's verzoek vierkant gemaakt, met behoud van hun herkenbare onderwerp.
De brede versies blijven bewaard. Lesinhoud en oefenbeelden zijn ongewijzigd.

Herstel van de niet-werkende stappenbalk: de bestaande fasen openen hun eerste
opdracht, ook op mobiel en met toetsenbord. De huidige modelstap kan het woord
herhalen. Vooruit bladeren telt niet als afronden en verplaatst de opgeslagen
route niet voorbij onafgerond werk. Bij het einde keert Verder zo nodig terug
naar de eerste ontbrekende opdracht. Broninhoud en audiobeleid blijven gelijk.

De groeps- en vervolgoefeningen zijn gepubliceerd op Nico's expliciete opdracht,
vastgelegd in `docs/klink-owner-release-20261017.json` met inhoudshashes. Dit
akkoord bewijst geen onafhankelijke combinatiebeoordeling of cursistproef.
Gesproken instructies en hulp zijn op zijn verzoek ingetrokken: 48 bestanden
blijven in bron en herstelkopie, maar zijn via `public/.assetsignore` uitgesloten
van publieke assets. Korte opdrachttekst en werkelijke woord-, zin-, vraag-,
antwoord-, tekst- en gespreksaudio blijven beschikbaar. Het standaardtempo is
0,85 met behoud van toonhoogte. Alle 2.679 aangeboden mediabestanden zijn live
teruggelezen en vergeleken met de gecontroleerde bronbytes.

De goedgekeurde startpagina gebruikt de kop “Klink jij ook?”, één compact Klink-logo,
“Een leermiddel van” met het officiële Taalroute-logo bovenaan en Alfabeta+
onderaan. Akkoord: `docs/klink-landing-approval-20261017.json`. Het bestaande
domein, de nieuwste compacte leskaarten, 15 onderdelen, 302 lesroutes, media
en lokale opslag blijven behouden. Haal voor vervolgwerk de actuele GitHub-main
op; een oudere lokale checkout is geen publicatiebasis.

## Voor iedere volgende publicatie

1. Lees het laatste publicatieregister en de live `/release.json`. Controleer de
   actieve Cloudflare Worker-versie. Een branchnaam of datum is geen bronbewijs.
2. De publicatiebron moet afstammen van de laatst gepubliceerde broncommit.
   Behoud routes, bestaande inhoud, media, lokale voortgang en opslagafspraken.
3. Controleer verschillen met de vastgezette Lexicon-export. Nieuwe inhoud/media
   vragen nieuwe inhoudelijke vrijgave; het akkoord van 17 oktober is geen blanco
   akkoord voor toekomstige generaties.
4. Voer TypeScript, curriculum-, publicatiebewijs-, browser-, UI-/audio- en
   metadatacontroles lokaal uit. Geen GitHub Actions voor de zware reeksen.
5. Inspecteer workflows vóór een push. De huidige repository bevat geen workflows.
6. Commit de gecontroleerde bron op main. Publiceer via `npm run deploy`.
   Behoud de publicatiepoort; geen rechtstreekse omweg of alternatieve configuratie.
7. Lees de aangeboden release, applicatie en mediabestanden terug. Controleer
   hashes, Taalroute-metadata en de werkelijke spelers op het bestaande domein.
8. Leg broncommit, Worker-versie, controles en herstelback-up vast en werk main bij.

`public/release.json` wordt tijdens de normale build gegenereerd en is geen
cursistentekst. Vergelijkingen met andere methoden en Drive-herstelverwijzingen
blijven uitsluitend in interne documenten, nooit in de cursisteninterface.

## Onderdelenindeling

`data/klink-sections.json` is een exacte import van de Lexicon-export
`public/data/klink-onderdelen.json`, editie `klink-onderdelen-20261017-v1`.
Vijftien ingangen houden alle 338 betekenissen en 302 lesroutes intact.
`groep-2` blijft als hervatalias van `groep-1` ondersteund. De openingsfoto
is bewust gekozen en hoort bij een titelwoord; oefenbeelden en audio blijven
ongewijzigd. Nieuwe Lexicon-edities importeren via `scripts/import-lexicon-sections.mjs`,
exporthash in het vrijgaverecord vastleggen en de gerichte behoudtests draaien.
De live release vermeldt ook `sectionsSha256`.

## Fotokaarten

De goedgekeurde vorm 'Foto bovenaan' verandert alleen de onderdeelkaart.
`data/klink-section-photos.json` bevat vier aparte navigatiebeelden; de
Lexicon-export en oefenwoordbeelden blijven ongewijzigd. Het beeldakkoord en de
exacte bestandshashes staan in `docs/klink-square-photo-cards-approval-20261017.json`.
De vorige brede versies en hun oorspronkelijke akkoord blijven bewaard.
De publicatiecontrole toetst dit akkoord, de nieuwe beelden en alle oorspronkelijke
woordcovers. De live release vermeldt ook `sectionPhotosSha256`.

Nico heeft de vaste 3:2-uitsnede ingetrokken: toon voortaan de volledige foto,
zonder bijsnijden, uitrekken of vergroten. De kaart is maximaal 200 pixels breed;
de foto behoudt zijn eigen verhoudingen en vult de kaartbreedte zonder zijstroken.
Op Nico's vervolgopdracht zijn ook de foto's van 7, 9, 14 en 15 vierkante
bronbeelden geworden (1:1). Alle vijftien foto's hebben daardoor dezelfde hoogte;
er wordt geen extra uitsnede toegepast. De vier aangepaste scènes behouden hun
onderwerp en zijn afzonderlijk visueel gecontroleerd; zie het beeldreviewrecord.
Op grotere schermen passen zoveel kaarten naast elkaar als de beschikbare ruimte
toelaat; op telefoons tot en met 480 pixels staan twee kleinere kaarten naast
elkaar. De bestaande foto-bovenaan-opzet, bronbeelden en oefenbeelden blijven
intact. Titels blijven 20 pixels en de Open-knop behoudt 48 pixels tikhoogte.
De browsertest bewaakt volledige beelden, natuurlijke verhoudingen, geen
vergroting, rijuitlijning en bediening op elf schermbreedtes.

De oorspronkelijke publicatie van 14 oktober is gedocumenteerd in
docs/klink-publication-provenance.json. Het nieuwste register heeft voorrang
bij het vaststellen van de actieve publicatiebasis.

## Header en docentenhandleiding — 18 oktober 2026

Nico heeft opdracht gegeven de docentenhandleiding op de website te plaatsen,
met een standaard Taalroute-header en rechts de ingang Voor docenten.
De webhandleiding staat op /docenten en bevat twaalf hoofdstukken. DigiBord is
niet toegevoegd. Zie docs/klink-header-manual-scope-20261018.json voor de exacte
scope en lokale controles. De handleiding gebruikt de gecontroleerde knopnamen
van de ronde-3-liveversie. Bij volgende wijzigingen van tabs, routes of knoppen
moeten de bijbehorende klikroutes in data/klink-teacher-manual.json en de
bewerkbare handleidingbron samen worden bijgewerkt vóór publicatie.

Deze header en handleiding zijn gepubliceerd en live gecontroleerd. Alle 2.679
aangeboden mediabestanden zijn bytegelijk teruggelezen. In leeslessen in vensters
tot 600px hoog verdwijnt de header tijdelijk om de oorspronkelijke leesruimte
te behouden; terugkeren naar het menu herstelt de docenteningang.

## Wiki-opzet handleiding — 18 oktober 2026

Op verzoek van Nico is /docenten een compact overzicht geworden. De twaalf
bestaande hoofdstukken hebben elk een eigen pagina onder
/docenten/hoofdstuk-1 tot en met /docenten/hoofdstuk-12. Een onderwerpenmenu,
kruimelpad en vorige/volgende-links houden de pagina's bereikbaar. Het menu is
op mobiel inklapbaar. Oude hoofdstukankers blijven werken. De inhoudelijke
hoofdstuktekst is exact behouden; alleen verwijzingen en kopniveaus zijn aan
de losse pagina's aangepast. Scope en controles:
`docs/klink-manual-wiki-review-20261018.json`.

Op 18 oktober is de volledige docentenwiki redactioneel en didactisch herzien.
De twaalf onderwerpen gebruiken gewone woorden, actieve instructies en concrete
docenthandelingen. Het oefenblok legt nu ook automatisch doorgaan pauzeren,
voordoen met Eén terug en de overstap naar een losse woordkaart uit. Taaldoel:
A2+/B1−, redactioneel beoordeeld; geen formele niveaucertificering of docentproef.
Boekdoel, echte bijeenkomst, materiaal, tijd en lesbezoekkader blijven verbonden.
Zie `docs/KLINK-HANDLEIDING-REVIEW-20261018.md` en het bijbehorende reviewrecord.
Leerinhoud, audio, beelden, routes en opgeslagen voortgang blijven ongewijzigd.

## Cumulatieve uitbreiding — gepubliceerd op 18 oktober 2026

De overdracht `publication-contract-handoff-001` legt Nico's bestaande opdracht
van 18 oktober vast voor de lokaal gecontroleerde uitbreiding. Het nieuwe
inhoudsgebonden akkoord is
`docs/klink-owner-release-cumulative-20261018.json`. Het bewaart de hele scope
van het voorgaande akkoord en bindt de actuele bron, 1.393 toegelaten records,
zes spelers, kandidaat-/weergavehashes, reviewdossiers, lokale controles en de
teruggelezen Drive-back-up. De exacte opdracht staat in het akkoord en in
`docs/klink-cumulative-release-20261018/owner-instruction.json`.

Centrale regie heeft deze uitbreiding via `npm run deploy` gepubliceerd vanuit
schone main op de hierboven vastgelegde livebron. Alle 1.393 toegelaten records
staan live; 2.679 aangeboden mediabestanden zijn bytegelijk teruggelezen.
Het register beschrijft de echte routecontroles en de beperkingen van controles
met lokaal ingevoegde spelers. Bij 320 × 480 bleef één zichtbare overlap tussen
de opdracht en onderste knoppen open; dit is geen volledig foutloze oplevering.

De 478 uitgesloten kandidaten en vier afzonderlijke ongeclassificeerde teksten
zijn niet vrijgegeven. De audiopauze blijft gelden: geen nieuwe audio of
koppelingen. Docentafronding blijft deelname, zonder onafhankelijke
leesvrijgave, beheersingsclaim, menselijke itemreview of volledige methode- en
niveaudekkingsclaim. Historische akkoorden en menselijke reviewstatussen blijven
ongewijzigd. De eenvoudigere bedieningstaal van de zes spelers verandert geen
hoger ingedeelde brontekst in A1-materiaal.

Herstel gebruikt de eerder geverifieerde bronback-up en acht mediapakketten,
aangevuld met de afzonderlijke bron-/bewijsdelta van deze overdracht. Controles,
resterende publicatiestappen en delta-ontvangstcontrole worden vastgelegd in
`outputs/publication-contract-handoff-20261018/HANDOFF.md` en het gedeelde
`adapter-status-six-players.json`. Een back-up is geen livepublicatie.

## Herstel korte schermen — gereedmaken voor centrale publicatie

`short-screen-workflow-footer-overlap-001` herstelt uitsluitend
het scrollgedrag bij schermen tot 600 px hoog. Gemengde oefenrondes
behouden hun vaste hoogte en eigen scrollruimte, zodat hun knoppen niet over
de bestaande feedback en Verder-knop vallen.
Indeling, tekst, lettertypes, inhoud, media, routes en opgeslagen gegevens blijven
behouden. De uitgebreidere echte routetest controleert volledige knopvlakken,
invulvelden en begin-, midden- en eindposities op zes schermformaten.

De nieuwe brongebonden overdracht staat in
`docs/klink-owner-release-short-screen-20261018.json`; het actuele herkomstbewijs
staat in `docs/klink-short-screen-release-20261018/live-baseline-check.json`.
Historische akkoorden en publicatieregisters blijven onveranderd. Dit lokale
herstel is nog niet gepubliceerd. Centrale regie legt de gecontroleerde bron
vast en gebruikt de normale publicatiepoort; een Drive-back-up is geen publicatie.


## Losse klanken — 25 oktober 2026

De canonieke publicatiebron blijft deze repository, branch `main`.
Het dossier `docs/klink-klanken-release-20261025/` legt de actuele livebasis,
46 losse opnamen, de acht goedgekeurde ongewijzigde bestanden, metadata,
bronbehoud, lokale controles en teruggelezen Drive-herstelkopie vast.
Voor de 38 nieuwe opnamen staat menselijke uitspraakbeoordeling nog open;
de extra automatische luisterdienst was door een uitgeput bestaand tegoed niet beschikbaar.
Er is geen budget verhoogd. Technische audiocontroles vervangen die beoordeling niet.

Klink: de letter op de klankenkaart speelt direct de klank. De aparte knop
Woorden opent de bijbehorende bestaande woorden. De letter boven de woorden
en de letters bij Kijk en luister spelen dezelfde losse opname op normale snelheid.
De bestaande woordaudio houdt tempo 0,85. Posteruitleg en de losse luisterknop
zijn verwijderd; de rustige Klankstudio-link blijft. De zeven lege woordenlijsten
zijn aangevuld met bestaande woorden, zonder nieuwe lessen of woordaudio.

Klankstudio: dezelfde 46 referentieopnamen hebben hun eigen stemvermelding Remko.
De vier bestaande stemmen voor voorbeeldwoorden, oude media, inhoud, header,
instellingen en lokale gegevens blijven behouden.

Publiceer via de bestaande normale route. Bewaar historische akkoorden ongewijzigd.
De Klink-poort valideert de begrensde opvolger en blijft de eerdere vrijgaven tegen
hun eigen bron controleren. Instructieaudio buiten de eerdere vrijgave blijft geblokkeerd.
De uiteindelijke broncommit, livecontrole en back-up staan in het publicatieregister
voor deze klankenuitgave. Een Drive-back-up is geen livepublicatie.

## Gesprekken herstellen — 25 oktober 2026

Nico vraagt de gemaakte herstelversie online en standaard bij de juiste opdrachten.
De brongebonden vrijgave docs/klink-owner-release-gesprekken-20261025.json beperkt dit
uitdrukkelijk tot 128 gesprekken, 512 nieuwe beurten, 16 gekoppelde scène-/locatiebeelden
en de bijbehorende speler en registratie. Het eerste gesprek gebruikt Sara en Daan.
De 505 unieke oorspronkelijke opnamen blijven ongewijzigd beschikbaar als bron en
staan ook apart in de herstelback-up. Vaste personen behouden dezelfde voice-ID.

De speler toont één actieve beurt met zichtbare knoppen, per beurt of als geheel
luisteren en optioneel meelezen. De steunkeuzes Alfa B/C wijzigen het A1/A2-bronlabel
niet en zijn geen volledige niveaucertificering. Menselijke luisterreview blijft open.
De overige lessen, woorden, klankenkaart, opgeslagen voortgang en historische akkoorden
blijven behouden. Beeldgeneratie in Work is gestopt; er worden voor deze publicatie
geen nieuwe beelden gemaakt. Het merendeel van de beelden is een gedeeld locatiebeeld,
niet een unieke uitbeelding van alle 128 gesprekken.

Publiceer alleen via npm run deploy op main. De opvolgende publicatiepoort controleert
deze begrensde wijziging en toetst eerdere vrijgaven tegen hun eigen bewaarde bron.
Vermeld de werkelijke controles en beperkingen in docs/klink-gesprekken-release-20261025/.
