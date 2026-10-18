# Klink — canonieke publicatie

Publiceer alleen `main` uit 26buckets/taalroute-klink op klink.taalroute.nl.
Geen publicatie uit de aparte UI-werkmap of een oudere checkout.

Audiopauze op verzoek van Nico, 18 oktober 2026: geen nieuwe audio genereren,
geen ElevenLabs-productie en geen nieuwe audiokoppelingen in Klink. Bestaande
audio ongewijzigd laten; ontbrekende audio uitsluitend administreren. Hervatten
vraagt een expliciete nieuwe opdracht van Nico. De menureview heft dit niet op.

De publicatie van 17 oktober 2026 combineert de Lexicon-indeling, de bestaande
les-/oefenspelers, de aangesloten teksten/gesprekken en alle 338 woordbeelden.
Nico's expliciete akkoord staat in docs/klink-content-approval-20261017.json.
Dat is geen onafhankelijk bewijs van item-voor-item luisterbeoordeling.
De losse t blijft afgekeurd/geparkeerd. Geen automatische beheersingsclaim.

Actief register: `docs/klink-publication-didactic-round3-20261018.json`.
Livebron: `46d64d8efd9b593fd5584d058410c003bf4c1dc0`.
Worker-versie: `e60bd45e-1bed-4352-a096-1edf1fec7914`.
Latere registercommits op main zijn geen nieuwe runtimepublicatie.

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
