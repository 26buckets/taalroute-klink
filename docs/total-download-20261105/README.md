# Klink — totale eerste download, 5 november 2026

**HOLD — alleen staging.** De eerste Klink-download is aantoonbaar kleiner en het startscherm verschijnt eerder. De volledige eerste oefening is niet aantoonbaar eerder klaar: de laatste klik wacht langer op de speler. +Docent heeft geen aangetoonde winst. Deze proef is daarom geen publicatieadvies. Geen merge naar main of productiepublicatie vanuit deze opdracht.

## Resultaat op 3 Mbps

Medians; 8 eerste bezoeken per portaal en variant (4 desktop, 4 mobiel). MB = 1.000.000 bytes.

| Onderdeel | Controle | Kandidaat | Verschil |
|---|---:|---:|---:|
| Klink: totale eerste download | 3.18 MB | 2.96 MB | -6.8% |
| Klink: startscherm zichtbaar | 9.50 s | 8.86 s | -6.8% |
| Klink: laatste eerste bestand ontvangen | 9.38 s | 8.90 s | -5.1% |
| +Docent: totale eerste download | 5.01 MB | 5.05 MB | +0.7% |
| +Docent: startscherm zichtbaar | 9.35 s | 9.51 s | +1.7% |
| +Docent: laatste eerste bestand ontvangen | 14.40 s | 14.62 s | +1.6% |

De download telt HTML, JavaScript, CSS, lettertypen en afbeeldingen na netwerkstilte. De zichtbare starttijd wordt in de pagina gemeten nadat de loader weg is en twee animatieframes zijn verstreken. Het ontvangen van bestanden is een andere maat dan zichtbaar of bruikbaar zijn.

### Meteen door naar de eerste oefening of docentles

Vier verse sessies per variant en portaal, twee desktop en twee mobiel; geen herladen of verzonnen denktijd vóór de volgende klik.

| Handeling op 3 Mbps | Controle | Kandidaat |
|---|---:|---:|
| Klink: laatste klik → oefening zichtbaar | 0.03 s | 1.34 s |
| Klink: opening → oefening zichtbaar | 9.72 s | 10.24 s |
| Klink: opening → oefening met afbeelding/lettertypen gereed | 10.31 s | 10.29 s |
| +Docent: lesklik → les zichtbaar | 0.03 s | 0.04 s |
| +Docent: opening → les zichtbaar | 9.58 s | 9.73 s |
| +Docent: opening → les met afbeelding/lettertypen gereed | 13.13 s | 13.15 s |

**Belangrijk:** de laatste Klink-klik neemt toe van circa 31 ms naar 1.339 ms. De oefening wordt later zichtbaar; inclusief de afbeelding is de totale tijd ongeveer gelijk (10,31 tegenover 10,29 seconden). Dat verschil is te klein om als winst te presenteren. De bronproef voldoet dus nog niet aan het doel van een snellere volledige eerste oefenstart. +Docent krijgt ongeveer 34 kB extra en wordt in deze proef iets later zichtbaar.

## Desktop, mobiel en herhaald gebruik

Alle onderstaande waarden zijn medianen. De ruwe bezoeken bevatten ook browser, volgorde, min/max en afzonderlijke bestandstijden. Geen geldige trage metingen weggelaten.

| Netwerk / scherm / portaal / bezoek | n per variant | Download controle → kandidaat (MB) | Zichtbaar controle → kandidaat (s) |
|---|---:|---:|---:|
| Normaal / 1280px / Klink / eerste | 4 | 3.17 → 2.96 | 1.43 → 1.34 |
| Normaal / 1280px / Klink / herladen | 4 | 1.55 → 1.44 | 0.77 → 0.67 |
| Normaal / 1280px / +Docent / eerste | 4 | 4.24 → 4.28 | 1.11 → 1.43 |
| Normaal / 1280px / +Docent / herladen | 4 | 2.18 → 2.19 | 0.62 → 0.61 |
| Normaal / 390px / Klink / eerste | 4 | 3.17 → 2.95 | 1.44 → 1.22 |
| Normaal / 390px / Klink / herladen | 4 | 1.55 → 1.44 | 0.67 → 0.69 |
| Normaal / 390px / +Docent / eerste | 4 | 4.24 → 4.28 | 1.26 → 1.32 |
| Normaal / 390px / +Docent / herladen | 4 | 2.17 → 2.16 | 0.59 → 0.60 |
| 3 Mbps / 1280px / Klink / eerste | 4 | 3.18 → 2.96 | 9.38 → 8.80 |
| 3 Mbps / 1280px / Klink / herladen | 4 | 3.09 → 2.87 | 0.72 → 0.69 |
| 3 Mbps / 1280px / +Docent / eerste | 4 | 5.09 → 5.12 | 9.45 → 9.45 |
| 3 Mbps / 1280px / +Docent / herladen | 4 | 4.17 → 4.20 | 0.86 → 0.92 |
| 3 Mbps / 390px / Klink / eerste | 4 | 3.18 → 2.96 | 9.55 → 8.87 |
| 3 Mbps / 390px / Klink / herladen | 4 | 3.09 → 2.87 | 0.71 → 0.72 |
| 3 Mbps / 390px / +Docent / eerste | 4 | 4.94 → 4.97 | 9.31 → 9.69 |
| 3 Mbps / 390px / +Docent / herladen | 4 | 4.02 → 4.05 | 0.74 → 0.62 |

Bij herladen kan `encodedBodySize` ook uit browsercache komen; dat is geen nieuwe netwerkdownload. `networkTransferBytes` en de afzonderlijke overdrachtstijden staan apart in `summary.json` en `viewport-summary.json`. De tabel met downloadwinst bovenaan gebruikt uitsluitend verse browsercontexten.

## Basis, afstemming en staging

- Werkelijke livebron bij de definitieve proef: `8f310654410c683c772ce889b2164441b8a2a8c0`. De afzonderlijk goedgekeurde focusreparatie is in beide varianten opgenomen. De bewijsopvolger `a272037664b8db01967aba2e4d7fe181a49ee1b7` is daarna in de reviewbranch samengevoegd; die verandert geen runtimebestanden.
- Controle: `b831ad09856b53d73b6dd1f1f6d52b5e8579e34f`; kandidaat: `eccce25160e19d883d54d75c3859af897cd7fa15`. Beide schone builds, ieder 20.000 assets.
- Kandidaat: https://klink-pr12-candidate.nico-554.workers.dev/#learner — Worker `b9d6b52e-d312-4566-ad84-1754a23487d0`.
- +Docent op dezelfde kandidaat: https://klink-pr12-candidate.nico-554.workers.dev/#teacher/plus
- Controle: https://klink-pr12-baseline.nico-554.workers.dev/#learner — Worker `a4ec1e06-8ccf-4de1-8ae4-b9b37ed9b07c`.
- Review: https://github.com/26buckets/taalroute-klink/pull/12 (draft/HOLD).
- Werkelijke bindings teruggelezen: uitsluitend ASSETS en de niet-geheime proefnaam. Geen database, KV, R2, services, secrets of productieroutes.
- Afgestemd met IMPLEMENTEREN en Zet Klink-chats online; bestaande spelerprototype overgenomen, dubbele implementatie gestopt, rustig meetvenster afgesproken. De 50 aangehouden dictees blijven offline.
- De aparte focuspublicatie door parallel werk vond tijdens deze opdracht plaats; die is niet een PR12-publicatie. Inzicht en PR8 behielden hun deploymentgeschiedenis over de hele opdracht. Klink, Inzicht en PR8 bleven alle drie exact gelijk tussen `preservation-measurement-before.json` en `preservation-after.json`.

## Uitvoering

De bestaande spelers worden pas na een oefenvormkeuze geladen. De download begint vóór de opdrachtenlijst wordt weergegeven. De basis-oefenspeler en cursistenrondes hebben aparte bundels; docentwerkruimte en cursistenstart worden afzonderlijk voorgeladen. De oude conditionele import liet de bundelaar docentafhankelijkheden voor beide ingangen voorladen; aparte aanroepen verhelpen dat.

De bestaande oefeningen, inhoud, media, antwoorden, lokale voortgang en vormgeving blijven behouden. Een gedeelde laadbelofte bewaart ook mislukte CSS-preloads. Na een fout kan de gebruiker teruggaan of expliciet opnieuw openen; uitsluitend eigen spelerbestanden worden met een vernieuwde cache opgehaald vóór herladen. Dit herstelt de daadwerkelijk gereproduceerde WebKit-cache van mislukte imports. Teruggaan breekt een lopende hersteldownload af.

## Controles en bewijs

- 54 gerichte unittests en 203 inhouds-/collectiehashes; 12 volledige gebouwde gegevenshashes in Chromium en WebKit, inclusief veldvolgorde, antwoorden en herkomst.
- Alle CSS-declaraties, selectoren en lagen behouden. 24 start/menuparen pixelidentiek, desktop/mobiel en licht/donker; 48 oefenparen met identieke tekst/geometrie en geen pixels buiten maximaal 2 kanaalwaarden afrondingsverschil.
- 12 koude, vertraagde, mislukte, herladen en geïsoleerde docentflows; 16 loader/fout/projectie/antwoordcontroles; 8 gelijktijdige entryflows en 8 loader-eenmalig-navigatieflows.
- Handleiding, 44 woordluistercontroles, 80 leesflows met echte audio en 160 verworpen foute antwoorden, 40 spreekflows met echte audio, twee synthetische microfoonproeven.
- Opslag over tabbladen, daadwerkelijke browserlocks, quotafouten en veranderende rondelengte gecontroleerd. 48 bronherhaalopdrachten in 4 rondes; 822 oude opslagsleutels bytegelijk. Alle 15 bestaande secties bereikbaar in gemengde oefening, inclusief fout-/opslagherstel en vijf schermbreedten.
- Types en gerichte lintcontrole geslaagd. Geen nieuwe dependencies of GitHub-workflows. Zware controles uitsluitend lokaal; vóór de push ontbreken workflows zowel in deze branch als main.
- Volledige functionele reeks op runtime `56aa5a681...`; daarna alleen de afzonderlijke actuele focus-CSS symmetrisch toegevoegd. Gebouwde data/CSS, 12 herstel/isolatieflows en alle 72 visuele vergelijkingen opnieuw geslaagd op definitieve runtime `eccce2516...`. De 144 remote bezoeken/flows gebruiken uitsluitend die definitieve variant. `validation.json` legt de herkomst vast.
- De focus-only publicatiecheck weigert terecht deze bredere performancebranch. Die check is niet aangepast of omzeild. Dit is een publicatieblokkade, geen geslaagde productiecontrole.

## Meetwijze en grenzen

64 gewone bezoeken in Chromium/WebKit, 64 bezoeken op 3 Mbps in Chromium en 16 verse directe vervolgflows. Desktop 1280px en mobiel 390px; speleruiterlijk ook 1366px. Varianten afgewisseld, lege browsercontexten, echte herladingen, verminderde beweging, geen CPU-beperking. 3 Mbps download, 1 Mbps upload, 40 ms extra latentie. Beide stagingedges vooraf identiek opgewarmd; een lege browsercache bewijst geen koude Cloudflare-edge. Geen gelijktijdige eigen bouwtaken, zware controles of uploads tijdens de meting.

Dit is geen fysieke telefoon, tweede fysiek netwerk, volledige toegankelijkheidsaudit, MFA-meting of menselijke luisterreview. Er zijn geen echte cursistgegevens gebruikt. Netwerkpieken zijn niet uitgesloten. De lokale flowtijd onder gelijktijdige controles is uitsluitend functioneel bewijs en niet gebruikt als snelheidswinst.

## Open en volgende concrete stap

1. Werkelijke totale wachttijd tot de eerste oefening verkorten. De huidige besparing verplaatst een deel van de download naar de volgende klik. Onderzoek daarvoor vooral de twee nog vooraf benodigde gegevensbanken en/of kleinere selectie van uitsluitend de benodigde speler; behoud alle catalogusaantallen en inhoud met bronvergelijking. Geen automatisch extra voorladen op het startscherm, want dat zou de gemeten downloadbesparing weer tenietdoen.
2. +Docent heeft geen aangetoonde winst; vermijd een publicatieclaim op basis van Klink alleen.
3. Na een nieuwe wijziging dezelfde eerste-bezoek/volgende-klikproef opnieuw, plus een fysieke trage verbinding. Pas daarna een afzonderlijk gecontroleerd publicatiecontract en expliciet publicatieakkoord.
4. Bekende herstelnavigatie: Woordenmix is lokale schermkeuze; na expliciet herladen moet de gebruiker die keuze opnieuw openen. Bewaarde antwoorden blijven behouden.

## Bewaarde proefgeschiedenis en herstel

`probes/` bewaart de afgewezen bundel- en cacheproeven; `validation-before-focus/` bewaart de gecontroleerde voorganger. Een testregex herkende gedeelde speler-CSS eerst niet doordat de bestandsnaam een punt gebruikt; die false positive is gecorrigeerd zonder de controle te verzwakken. Eerdere gedeeltelijke metingen en lokale tijden zijn uitgesloten van de eindstatistiek.

De actuele toepasbare patch en Git-herstelbundle worden in een afzonderlijk nieuw herstelpakket in de bestaande Drive-projectmap opgeslagen: https://drive.google.com/drive/folders/1DpH2ChwgYsST5Tv_Dlf64ej-sn2rCjlF . `backup-receipt.json` bevat na upload de directe link en teruggelezen SHA-256-controle. De archiefinhoud bevat alle code, tests, afbeeldingen en bewijzen via de Git-bundle, plus de losse kernrapporten en ruwe eindmetingen. Een backup is geen livepublicatie.
