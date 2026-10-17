# Klink: woordroute en oefenhoofdstukken gescheiden

## Opdracht en afbakening

Nico vraagt aparte ingangen voor taalvaardigheden, zonder verplichte doorgang via
een klank- of woordgroep. De bestaande vijftien woordonderdelen, 302 lesroutes,
Lexicon-plaatsingen en herhalingen blijven ongewijzigd. Er komt geen tweede app,
geen gekopieerde DigLin-inhoud en geen nieuw niveau-oordeel.

## Twee manieren om dezelfde inhoud te gebruiken

- **Lessen:** de bestaande stapsgewijze woordroute met de kleine vierkante foto's.
- **Oefenen:** twaalf rechtstreekse hoofdstukken. Kies een oefenvorm, vervolgens
  bestaande inhoud. Bron­niveau en hulp zijn zichtbaar waar ze relevant zijn.

| Hoofdstuk | Aangesloten inhoud | Grens van deze bouwronde |
| --- | --- | --- |
| Woorden | Beelden, woordaudio, herkennen en koppelen | Geen nieuwe woordenschatleerlijn |
| Klanken | Hetzelfde of anders met bestaande woordcontrasten | Geen volledige losse-klanklijn; afgekeurde t blijft geparkeerd |
| Zinnen | Meelezen, zoeken, bouwen, typen en nazeggen | Luisteren/nabouwen is geen bewijs van zelfstandig lezen |
| Teksten | 192 bestaande teksten; 180 bronvragen; 156 bewijsopdrachten | Niet alle teksten hebben een vraag; geen volledige A2/B1-leerlijn |
| Luisteren | Woordkeuze, zinsbegrip, tekst- en gespreksvragen | Nog ontbrekende vraag-/antwoordaudio vraagt lees- of docentsteun |
| Spreken | Nazeggen, gesprekken en reageren op een beurt | Geen automatische uitspraakgoedkeuring |
| Schrijven | Lettermodel, overschrijven, dictee, bericht en berichtkaart | Geen lettertraject of automatische handschriftbeoordeling |
| Spelling | Woordbouw met/zonder model, aanvullen, dictee | Expliciete spellingregels en zelfstandige transfer blijven open |
| Grammatica | Zinnen ordenen en bestaande ik-vormkeuzes | Geen volledige grammaticaleerlijn |
| In de praktijk | 128 gesprekken; 120 begripsvragen en schrijfdoelen | Berichtkaart is geen breed aanbod administratieve formulieren |
| Samen herhalen | Bingo, paren, leesreeksen en werkbladen | Oefenen is geen beheersingstoets |
| Rustig beginnen | Beeld/woord, woord namaken en natypen | Geen instapdiagnostiek of automatische profielindeling |

Alle veertig bestaande oefenvormen hebben een ingang. Overlap tussen hoofdstukken
is doelbewust: hetzelfde gesprek kan bij Spreken en In de praktijk bereikbaar zijn.
Het wordt daardoor niet twee keer als nieuwe bron of nieuwe les geteld.

## Vergelijking met DigLin

Op 17 oktober opnieuw in Nico's ingelogde Chrome-sessie bekeken: de twaalf
hoofdnavigatie-opties en de aparte menu's Klanken, Lezen, Grammatica en Spreken.
ABC stond los van deze domeinen. Klanken had eigen contrastreeksen; Lezen
afzonderlijke zins-/tekstgroepen en bron­niveaus; Grammatica woordsoort- en
zinsdeelgroepen; Spreken situaties en gespreksvormen. Alleen menuorganisatie
gecontroleerd, geen volledige didactische of inhoudelijke vergelijking.

De eerdere complete menu-inventaris blijft bewaard in
`outputs/diglin-comparison-20261017/diglin-menu-evidence.json`.
Deze wijziging maakt Klinks toegang vergelijkbaar, niet de inhoudelijke omvang.
Een compleet DigLin-minimum, met alle spellingregels, klankreeksen en hogere
taalniveaus, is hiermee **niet** bereikt.

## Bronbehoud, niveaus en voortgang

- `lib/practice-chapters.ts` maakt ingangen op bestaande oefeningen. Geen wijziging
  aan bronvragen, antwoorden, media, doelwoord-ID's, leesvoorwaarden of spelers.
- Alfa A/B is de bestaande voorgestelde leesfase van de betrokken woorden, inclusief
  voorbereidingswoorden en volledige bingokaarten. Het is geen cursistcertificering.
- A1/A2 volgt uitsluitend `sourceLevel`, inclusief bronlabels voor microteksten.
  De cursist ziet **met hulp**. `independentReading` wordt niet op waar gezet.
  B1 en Alfa C worden niet als beschikbare filters verzonnen.
- Bestaande woord-naar-zin-ketens en bingokaarten worden niet door filters opgeknipt.
- Teksten en gesprekken die in verschillende woordlessen terugkomen, verschijnen
  in een hoofdstuk eenmaal per oefenvorm. Herhaling in de woordroute blijft intact.
- Hoofdstukken hebben eigen hervatposities; voltooiing verandert de woordroute niet.
  Hetzelfde oefenonderdeel deelt zijn vrije-oefenpositie tussen twee hoofdstukken.
- Deelbare adressen onder `#learner/chapters/…`, terugnavigatie en herladen ondersteunen
  rechtstreeks openen zonder door de woordlessen te gaan. Ongeldige links vallen
  veilig terug op een geldig overzicht.
- Bestaande foto's blijven volledig, compact en zonder uitsnede. Geen nieuwe beelden
  of opnamen, geen herinschakeling van instructieaudio. Afspelen blijft 0,85×.

## Ontwerpbasis en docentgebruik

Canonieke ontwerpbasis op Drive gelezen:
`1iXr55yHAoIVVtu_J6yZrcqkjKca3USrz`, vastgesteld 17 oktober 2026.
Dit is een ontsluiting van bestaand oefenmateriaal, geen nieuw cursusprogramma.
Bronles-ID's, doelwoorden, context-ID's en leesvoorwaarden blijven in iedere opdracht
aanwezig. De docent kan een hoofdstuk rechtstreeks openen bij het passende bestaande
lesdoel en daarna terug naar de woordroute. Niet dubbel tellen als klassikale lestijd
én zelfstandige tijd. Het appmenu bewijst geen compleet boek-/rooster-/observatiekader;
concrete bijeenkomstplanning en praktijkobservatie blijven afzonderlijke werkzaamheden.

De docentomgeving toont de twaalf ingangen, de betekenis van de filters en de
inhoudelijke lacunes. Interne vergelijkingen en productiestatus staan niet bij de cursist.

## Gerichte controle

Nieuwe controles: alle veertig vormen bereikbaar, inhouds-unie zonder verlies,
geen gesplitste bingoborden, ongewijzigde opdrachten en leesvoorwaarden, bron­niveaus,
linkvalidatie, herladen/terug, fout/herstel, toetsenbord, audiofouten en vijf schermmaten.
Daarboven de bestaande volledige lokale regressiereeks. Publicatie en livecontrole
worden afzonderlijk vastgelegd in het publicatieregister; geen GitHub Actions nodig.

Geen nieuwe cursistproef uitgevoerd. Ontsluiting van inhoud is geen onafhankelijke
inhoudelijke vrijgave of garantie van gelijkwaardigheid met DigLin.
