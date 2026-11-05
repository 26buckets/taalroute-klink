# Kleinere eerste download — definitieve stagingproef op actuele basis

## Resultaat

Het grote oefenbestand is **11,3% kleiner op het netwerk**; alle JavaScript dat vóór het gemeten openingsmoment ontvangen is samen **8,5% kleiner**. De laatste vergelijkbare Klink-eerste-openingmediaan is **1,59 → 1,43 seconde**. Dat is een bescheiden gemeten tijdwinst, geen garantie voor elke verbinding of een verdwenen netwerkpiek.

| Meting | Controle | Kandidaat |
|---|---:|---:|
| Groot oefenbestand, gecodeerd | 2.38 MB | 2.11 MB |
| Alle ontvangen JavaScript, gecodeerd | 3.14 MB | 2.87 MB |
| Klink in pagina klaar, eerste bezoek (n=8 per variant) | 1,59 s | 1,43 s |
| Klink in pagina klaar, herladen (n=8 per variant) | 0,73 s | 0,66 s |
| Klink+docent in pagina klaar, eerste bezoek (n=8 per variant) | 1,32 s | 1,22 s |

De volgende hoofdstukklik blijft snel: mediaan 27 → 23 ms, maxima 44 → 32 ms. Geen inhoud of rekenwerk naar een volgende klik uitgesteld. Het grote bestand is uitgepakt circa 24,67 → 19,01 MB. De oorspronkelijke 4.769 woordbouwopdrachten blijven exact behouden.

**Deze snelheidswijziging staat uitsluitend op de twee PR12-staginghosts. Geen productiepublicatie, merge naar main, PR8/Inzicht- of databasewijziging vanuit deze taak.** De andere chat publiceerde afzonderlijk de goedgekeurde Spreken A1-inhoud; die actuele inhoud is nu ook in beide testvarianten behouden.

## Actuele bron en afstemming

- PR: https://github.com/26buckets/taalroute-klink/pull/12
- Kandidaat: https://klink-pr12-candidate.nico-554.workers.dev/#learner
- Controle: https://klink-pr12-baseline.nico-554.workers.dev/#learner
- Actuele canonieke main: `ebe45d6f5be44fa0cb49cc5ff1b15a9512420632`.
- Afzonderlijk gepubliceerde inhoudsbron: `8589a60a02117dfce87c44a833341796eed8b2c1`, productie-Worker `bd45ccf8-6ab7-437a-ba7b-dabea96619a5`.
- Schone kandidaatbouw: `29e02a49986d3ec4f18feb58a8c61f23454b17e7`, staging-Worker `3975b433-b56e-4102-9771-0093e0e27222`.
- Schone controlebouw: `ad4406d5a6a19db4a10400cdece5aa9b95e842c9`, staging-Worker `2fc7c1ef-c04d-41eb-a090-b8e3862d12e1`.
- Latere reviewcommits voegen uitsluitend bewijs en testhelpers toe.

De bronbomen van controle en kandidaat verschillen **uitsluitend door de twee regels die de compactieplugin inschakelen**. Beide bevatten dezelfde nieuwe tien spreekoefeningen, dezelfde goedgekeurde spelerwijziging en dezelfde bundelindeling. De oude op c47 gebaseerde integratiepatch, PR8, MFA, observaties, SQL en D1 zijn niet betrokken.

Afgestemd met ‘KLINK: IMPLEMENTEREN’ en ‘Zet Klink-chats online’. Hun actieve schrijf-/spellingwerkbomen blijven ongemoeid. De kopie van de werkelijk gepubliceerde bouw 8589 is afzonderlijk behouden voor uiterlijkvergelijking; de originele productiebouw is niet aangepast. Het laatste meetvenster is expliciet vrijgegeven zonder andere zware lokale tests of builds. Een volgende inhoudspublicatie van de andere chat moet deze PR bij integratie opnieuw op de dan actuele basis beoordelen.

## Kleine ingreep en veilig behoud

`scripts/compact-lexicon-module.mjs` factoriseert tijdens de gewone bouw uitsluitend de herhaalde structuur van `data/klink-lexicon-wordbuild-rest.json`. De canonieke JSON verandert niet. Iedere opdracht wordt tijdens bouwen volledig terugvergeleken, inclusief veldvolgorde. 4.750 opdrachten passen exact op hetzelfde recept; 19 afwijkingen blijven volledig opgenomen. Een afwijkende of gewijzigde toekomstige opdracht valt terug op het volledige oorspronkelijke record. Objecten en arrays blijven onafhankelijk, zonder gedeelde mutabele opdrachten. Geen nieuwe dependency, API, import-/inhoudsschema of browserverzoek.

De parallelle inhoudspublicatie voegde één publiek bankbestand toe. De stagingguard blokkeerde terecht de eerste integratie met 20.001 assets. Reeds bij de eerste pagina gebruikte afbeelding-/loaderhelpers en hun bestaande image-adapter zijn daarom in de bestaande gedeelde bundel samengevoegd. Niets verwijderd, geen limiet verhoogd: beide definitieve bouwvarianten hebben **20.000 assets**. Alle tien gebouwde CSS-bestanden blijven qua bytes gelijk als verzameling. Een extra ingangstest controleert dat deze bundelindeling geen oefenwerkruimtes voortijdig op de startpagina downloadt.

De nieuwe main bevatte aanvankelijk een `.tsx`-herstelkopie die onterecht door TypeScript werd meegenomen. De verantwoordelijke chat hernoemde die bytegelijk naar `.tsx.backup` en legde dat op main vast. Die exacte herstelcommit is overgenomen; geen typecheck uitgesloten of publicatiepoort omzeild. De eerste foutlogs blijven bewaard.

## Laatste meting

`reconciled/staging-measurement/`: **64 bezoeken**, Chromium/WebKit, 1280/390 px, Klink/+docent, twee onafhankelijke contexten per combinatie en variant, wisselende volgorde, lege browsercache gevolgd door echte reload, verminderde beweging, geen CPU-/netwerkemulatie. Voor beide hosts zijn symmetrisch het publieke document en grote programmabestand opgevraagd; dit is een vergelijking van lege browsercache, **geen koude-edgeproef**. Werkelijke releasecommits en schone bronstatus zijn teruggelezen. Browserversies, UTC-tijden, alle resources, foutlijst en volgende-klikken zijn opgeslagen.

Het primaire schermmoment is een meting binnen de pagina na twee renderframes bij zichtbare werkplek en verdwenen loader. De ongewijzigde automatische selectorcontrole blijft daarnaast staan (Klink eerste bezoek 2,00 → 1,65 s); die kan later eindigen door haar controle-interval. De in-page maxima zijn 1,74 → 1,63 s. Acht eerste bezoeken per variant bewijzen geen universele of statistisch zekere tijdwinst. De bytewinst is rechtstreeks gemeten; alle oorspronkelijke inhoud blijft aanwezig.

De eerdere 160 stagingbezoeken en 32 lokale bezoeken zijn behouden in `PHASE-1.md` en de bijbehorende bestanden. Een deel daarvan overlapte met een andere lokale controle of met uploads; die tijdsresultaten zijn niet als definitieve claim gebruikt. De laatste 64 bezoeken zijn vooraf als beslissend gekozen wegens de nieuwe actuele inhoud. Geen uitschieters verwijderd of individuele geslaagde bezoeken opnieuw uitgevoerd om een gunstiger resultaat te krijgen. In totaal 224 stagingmeetbezoeken in deze taak.

## Afgeronde controles

- Gewone schone bouw van beide actuele varianten; finale TypeScript en gerichte lint geslaagd. Geen claim van een schone brede repo-lint.
- Alle 4.769 bronopdrachten volledig gelijk; negen uitzonderings-/toekomstvarianten, lege banken en mutatie-isolatie getest.
- Op de actuele inhoud opnieuw 203 complete collectie-/oefenhashes gelijk. De fixture is vastgelegd op controle a252; `lib` en `data` daarvan zijn bytegelijk aan definitieve controle ad4406.
- Eerder 47 gerichte unitcontroles; na reconciliatie zeven extra lexicon/SprekenA1-controles geslaagd.
- **24 pixelgelijke actuele desktop/mobiel/licht/donker-schermparen tegenover de werkelijk gepubliceerde 8589-bouw.** De eerdere 36 schermparen en 24 brongebonden woordbouwantwoorden blijven als voorafgaand bewijs behouden.
- Op de actuele bouw 40 Spreken A1-stromen, vier rondes/herlaadproeven, native audio en twee synthetische microfoonopnamen; nieuwe content en bestaande antwoorden behouden.
- Actuele 8 parallel-laad-, 16 fout/projectie/opslag- en 8 loader/navigatie/opslagstromen geslaagd; aanvullende ingangstest bewaakt de kleine startpagina. Eerdere 44 audiocontroles en vier handleidingstromen behouden; audio is niet gewijzigd.
- **20.105 bestaande publieke bestanden bytegelijk** tegenover actuele productiebouw; alleen release-provenance en afzonderlijk getoetst headersbeleid uitgezonderd. Geen audio-/beeldwijziging.18HTML/RSC/query/HEAD/404/API-verzoeken geslaagd; 35 versiegebonden static-URL's gecontroleerd. Serverpakket blijft circa 6,2 MB.
- Stagingconfig beperkt tot ASSETS en een niet-geheime rondevariabele, zonder routes of D1/KV/R2/service-/secretbindingen. Bestaande cachebeleid en publicatiepoort blijven intact.
- In `reconciled/preservation-before/after.json` en `production-release-before/after.json` is de actuele productie-/Inzicht-/PR8-staat vóór/na deze laatste proef vastgelegd. Geen productieactie door deze taak.
- Geen GitHub Actions-workflows op gecontroleerde main/PR12, geen zware cloudtests of gewijzigd budget. Controles lokaal; alleen gerichte stagingdeploys en leescontroles naar Cloudflare.

## Herstel en open punten

De volledige toepasbare patch tegen main ebe45, Git-bundle met kandidaat én controlebranch, scripts en alle meet-/schermbewijzen worden in de bestaande Drive-projectmap teruggelezen en per payload geverifieerd. De PR bevat de definitieve ZIP-link en checksum. Oudere bewijzen blijven in de geschiedenis beschikbaar.

Het grote bestand is nog circa 2,11 MB. Verder splitsen per oefenonderdeel, echte telefoons, een tweede fysiek netwerk, lange duurproef en aparte Inzicht/MFA/databaseproeven zijn niet uitgevoerd. Trage verbindingen kunnen nog steeds seconden wachten. Productie vraagt een afzonderlijke concrete opdracht en nieuwe controle van de dan actuele goedgekeurde basis.
