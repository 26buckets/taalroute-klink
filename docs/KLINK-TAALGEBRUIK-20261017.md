# Klink — uitbreiding op de bestaande woordgroepen

17 oktober 2026. Werkbron: `feat/mixed-practice-20261017`, basiscommit `071e001252a6b6b8a51590fcd0263c98ef659121`. Geen nieuwe app, geen H5P-import, geen wijziging aan de canonieke Lexicon-woordgroepen.

## Wat daadwerkelijk is gebouwd

Alle nieuwe keuzes staan bij **Oefeningen → Samen oefenen**, naast de bestaande groepsactiviteiten. De vijftien onderdelen, 302 oorspronkelijke routes, 338 betekenissen, foto's, woordaudio en oude voortgang blijven behouden. Een werkvorm verschijnt uitsluitend wanneer er geschikte broninhoud voor dat onderdeel is.

| Werkvorm | Inhoud | Begrenzing |
|---|---|---|
| Hetzelfde of anders | 122 vergelijkingen in zeven woordgroepen, bestaande woordaudio, gelijk/ongelijk in balans | Eén voorbereide klank verschilt; geen losse klankopname of syntheseclaim |
| Begrijp het verhaal | 180 bestaande tekstvragen | Antwoord, afleiders en bewijs ongewijzigd uit de bron |
| Begrijp het gesprek | 120 bestaande gespreksvragen | Tekst en echte beurtopnamen blijven beschikbaar |
| Zoek het antwoord | 156 exacte bewijszinnen | Alleen ondubbelzinnig één volledige bronzin; geen willekeurige afleiders |
| Maak de zin | 1.283 bestaande korte zinnen | De gehoorde volgorde leggen, niet iedere andere grammaticale zin afkeuren als taalgebruik |
| Kies het werkwoord | 28 bestaande zinnen | Afgebakende ik-vormkeuze; niet een volledige grammaticalijn |
| Schrijf een bericht | 120 bestaande schrijfopdrachten | Oorspronkelijk doel, criteria en voorbeeld; zelf-/docentcontrole |
| Vul een berichtkaart in | Dezelfde 120 schrijfdoelen | Afzender en bericht apart; geen breed aanbod van administratieve formulieren |
| Jij bent aan de beurt | Rolbeurten bij 128 bestaande gesprekken | De ander spreekt, cursist antwoordt; model verborgen tot hulp, opnemen optioneel |

Dit zijn bron- en werkvormaantallen, geen aantallen onafhankelijke leerdoelen. Een bron kan bij meerdere relevante woordgroepen terugkomen. De eerste groep biedt nu 39 passende keuzes; de hele bibliotheek bevat 40 keuzes. De groep mat/tas/map/man/pan/jas blijft exact behouden.

## Beoordeling en bediening

- Bronvragen tonen de bron en bewaren keuzes bij fouten. Een goed antwoord wacht op Verder zodat het antwoordbewijs leesbaar blijft.
- Zinsbouw hergebruikt dezelfde tik-, sleep- en toetsenbordbediening. Vergelijking houdt woordgrenzen intact, ook bij herhaalde woorden.
- Grammatica verbergt de bronzin vóór het antwoord. Voorbeeld/hulp wordt als hulp geregistreerd.
- Vrije teksten krijgen geen automatische inhoudelijke goedkeuring. De expliciete zelfcontrole of docentcontrole registreert deelname. De knop Verder is geblokkeerd totdat die handeling is gedaan.
- Het schrijfconcept blijft alleen in sessionStorage van hetzelfde tabblad. Geen verzending aan docent/server; geen beloofde duurzame bewaring. Er is een wisknop en zichtbare melding wanneer opslag niet lukt. De resultaatregistratie bevat niet de vrije berichttekst.
- Een rolbeurt toont de modelreactie niet vooraf. Microfoonweigering blokkeert hardop oefenen niet. Geen automatische uitspraakscore.
- Alle bredere inhoud behoudt bron-ID, oorspronkelijke leesstap, doeltaalniveau en leesvoorwaarden. Plaatsing bewijst geen zelfstandig leesniveau. De vragen/antwoorden vragen lees- of docentsteun zolang hun opnamen ontbreken.

## Negen nieuwe opnamen

### Kaartstijl en standaardtempo — aanvullende opdracht 17 oktober

Nico kiest de actuele online vormgeving als basis. Live is broncommit `10affc05a167a7ebba4620ce0c368346f8fc0244`; er is niet gepubliceerd of teruggezet. De lokale cursistkaartstijl komt overeen met de livekaartstijl. De docentpreview miste de selectors onder `.learner-app`, waardoor luistertekst en bewaarbediening verkeerd werden weergegeven. Alleen de woordkaartselectors gelden nu voor beide weergaven via `.cp-player`. Foto's, inhoud, nieuwe oefeningen en de zestien instructiekoppelingen zijn behouden. Vergelijking met de livekaartstijl, vier schermbreedten, bewaren en Foto en geluid: `outputs/card-layout-audio-rate-20261017/card-checks.json`.

Standaard afspeeltempo is op expliciete opdracht `0.85`, met behoud van toonhoogte. Dit geldt voor de centrale speler, de oudere audioknop en eigen-opnamecontrols. Geen audiobestand opnieuw gegenereerd of gewijzigd. De bestaande afspeelwachttijd schaalt mee met het lagere tempo. Gerichte tests controleren bronwisseling, herhalen, annuleren, echte instructie-/woordaudio, docentweergave en eigen-opnamecontrols. TypeScript en productiebuild slagen; bestaande niet-gerelateerde lintmeldingen in de oude compacte speler zijn niet gewijzigd. Geen volledige app- of praktijkvrijgave afgeleid uit deze controles.

Alle negen gevraagde groepsinstructies zijn in ElevenLabs gemaakt. Instructiestem: Roland `h6uBOiAjLKklte8hdYio`. Bestaande doeltaalstem: `0qLmDzgqulxcvv0yf3kg`; de ID's verschillen. Geen losse t gegenereerd.

Productieplan, originele WAV's en individuele herstelrecords staan in `outputs/group-instruction-audio-20261017/`. Afleverbestanden staan in `public/package-audio/instructions/`. `data/klink-audio-candidates.json` verwijst ernaar; het goedgekeurde bindingsregister wordt niet automatisch gevuld.

Gecontroleerd: negen juiste bestandskoppelingen, hashes, ongewijzigde PCM na metadataherstel, Taalroute als artiest/albumartiest/uitgever, duur, niveaus, daadwerkelijk lokaal aangeboden bytes en decoderen in Chrome. Dit is **geen menselijke luisterbeoordeling**.

Nico heeft vervolgens expliciet gevraagd alle gemaakte opnamen te koppelen. De negen groepsinstructies én zeven extra instructies zijn daarom aangesloten via `data/klink-audio-bindings.json`. `review: approved` betekent hier toestemming van de eigenaar voor gebruik, vastgelegd met `approvalBasis: owner-use-authorization`; een afzonderlijke menselijke luistercontrole is niet uitgevoerd of bevestigd. Ze spelen af in de bestaande oefeningen en staan in **Docent → Media** onder **Bestand gekoppeld**. De bronrecords blijven de oorspronkelijke productiestatus bewaren. Dit is geen publicatie van de hele app.

## Zeven aanvullende instructies geproduceerd na opdracht

Nico heeft op 17 oktober expliciet geantwoord: “Ja, maak die zeven ook”. De zeven instructies zijn met dezelfde Roland-stem, hetzelfde model en dezelfde instellingen geproduceerd. Plan, originelen en herstelrecords: `outputs/extended-instruction-audio-20261017/`. Het betreft klankvergelijking, begrip, antwoordbewijs, zinsbouw, werkwoordkeuze, berichten en gespreksrollen. De gedeelde begripsinstructie luidt “Lees of luister”, zodat zij past bij zowel verhaal als gesprek. Alle zestien opnamen zijn vervolgens op gebruiksopdracht van Nico gekoppeld. De bestaande losse t blijft geparkeerd.

Daarnaast zijn 300 bronvragen, 900 antwoordopties en 120 schrijfopdrachten met vaste tekst/rol/ID geregistreerd. Dat zijn 1.320 koppelingen, niet noodzakelijk 1.320 verschillende toekomstige opnamen: exacte tekst én stemrol moeten eerst tegen de bestaande voorraad worden vergeleken.

Het actieve register bevat 3.729 ID's: 2.370 gekoppeld, drie oude klankkandidaten (a/oo/ie), één geparkeerde t en 1.355 ontbrekende koppelingen. Die laatste bestaan uit 1.320 bronvraag-/antwoord-/schrijfopdrachtkoppelingen en 35 klank-/spellingvoorbereidingen. De drie oude klankbestanden worden niet op grond van hun bestandsnaam als zuivere klank goedgekeurd. Geen bulkproductie van de voorraad aangevraagd of gestart.

## Reviews en controles

Eigen technische/inhoudelijke tegenlezing, geen externe expert- of cursistreview:

1. Alleen exact passende bestaande teksten, vragen, afleiders en schrijfdoelen importeren; provenance per CP-bron bewaard.
2. Geen willekeurige woordparen: transparante eenlettergrepige woordmodellen, één klankverschil, gelijk/ongelijk in balans. Onzekere spelling-klankconversies uitgesloten.
3. Werkwoordkeuze beperkt tot aantoonbaar eenduidige ik-vormen; zinsbouw duidelijk als gehoorde modelvolgorde benoemd.
4. Bewijszin niet als gehele tekst accepteren; antwoordbewijs na succes leesbaar laten staan.
5. Modelzin niet vóór grammaticakeuze tonen; hulp registreren.
6. Zelfgeschreven tekst niet als automatisch beoordeeld of naar een docent verzonden presenteren.
7. Geen betekenis geven aan een niet-werkende audioknop; ontbrekende stemmen blijven registraties, geen synthetische vervanging.
8. Geen nutteloze automatisch-verderknop bij opdrachten die bewust op lezen/nakijken wachten.
9. Behouden grote antwoordknoppen, toetsenbordtoegang en bereikbare Verder op tablet en mobiel.

Gerichte unit- en browsercontroles staan in `scripts/test-extended-practice*.mjs`; audio-terugleescontrole in `scripts/test-group-instruction-audio.mjs`. De uitgebreide bestaande regressiereeks wordt lokaal uitgevoerd. Geen GitHub Actions gestart.

De ontwerpbasis op Drive en lokaal is geraadpleegd. De nieuwe opdrachten hangen aan bestaande broninhoud en leesstappen. Koppeling aan een werkelijk ingeroosterde bijeenkomst, docentlesplan en toepasselijke eigen observatiepunten is daarmee niet automatisch afgerond; een echte praktijkbeoordeling is niet uitgevoerd. De opgegeven DigiBord-stijlmap was niet beschikbaar. De aanwezige rustige Klink-stijl, navigatie en compositie zijn behouden.

## Vrijgave — niet voltooid

De liveversie is opnieuw gecontroleerd: broncommit `10affc05a167a7ebba4620ce0c368346f8fc0244`, branch main, schone bron. De werkbron is een afstammeling daarvan; remote main was `949f9f75ea98736b770915f462cbdb23d60deb3e`. Er is niet gepusht of gepubliceerd.

De normale publicatiepoort blijft actief. Nieuwe combinaties, inhoudelijke vrijgave en luisterbeoordeling staan open. Daarnaast zijn losse klankpositie/synthese, lettertrajecten, bredere grammatica, uitgebreidere functionele formulieren en volledige A2/B1-opbouw niet door deze bouwronde voltooid. Deze versie mag daarom niet als het **volledige DigLin-minimum klaar** worden samengevat. De vergelijking behoudt de eerdere menubewijzen; geen nieuwe volledige DigLin-spelertest geclaimd.

Herstelkopie: bron, productiemedia/originelen en controles worden samen naar de bestaande Drive-map Alfabeta+ Klink geschreven en op hash teruggelezen. Een back-up is geen livepublicatie.
