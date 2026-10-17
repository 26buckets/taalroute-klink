# Klink — canonieke publicatie

Publiceer alleen `main` uit 26buckets/taalroute-klink op klink.taalroute.nl.
Geen publicatie uit de aparte UI-werkmap of een oudere checkout.

De publicatie van 17 oktober 2026 combineert de Lexicon-indeling, de bestaande
les-/oefenspelers, de aangesloten teksten/gesprekken en alle 338 woordbeelden.
Nico's expliciete akkoord staat in docs/klink-content-approval-20261017.json.
Dat is geen onafhankelijk bewijs van item-voor-item luisterbeoordeling.
De losse t blijft afgekeurd/geparkeerd. Geen automatische beheersingsclaim.

Actief register: `docs/klink-publication-task-audio-20261017.json`.
Livebron: `1ffddba983f8bbfe78b564bdcea4a7fc2958ddc2`.
Worker-versie: `2f7132d2-92c8-44cc-906d-ff17c2c16a7b`.
Latere registercommits op main zijn geen nieuwe runtimepublicatie.

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
exacte bestandshashes staan in `docs/klink-photo-cards-approval-20261017.json`.
De publicatiecontrole toetst dit akkoord, de nieuwe beelden en alle oorspronkelijke
woordcovers. De live release vermeldt ook `sectionPhotosSha256`.

De navigatiefoto’s vullen hun 3:2-kader randloos. Vierkante beelden worden
bijgesneden; kip en bank hebben een hogere uitsnede. Oorspronkelijke beeldbestanden
en oefenbeelden blijven intact. De compacte kaarten staan met drie naast elkaar
boven 1100 pixels, twee tussen 701 en 1100 pixels en één tot en met 700 pixels.
De browsertest bewaakt randvulling, rijuitlijning, leesbare titels en grote knoppen
op negen schermbreedtes, inclusief de omslagpunten.

De oorspronkelijke publicatie van 14 oktober is gedocumenteerd in
docs/klink-publication-provenance.json. Het nieuwste register heeft voorrang
bij het vaststellen van de actieve publicatiebasis.
