# Klink Inzicht — resterende stagingpieken, 4 november 2026

**De waargenomen startpieken zijn in de nametingen verdwenen. Productie is ongewijzigd.** Eén gerichte wijziging voorkomt dat uitsluitend in de browser gebruikte oefencode wordt opgenomen in de serverbundel. Geen sessies gecachet, MFA versoepeld, tijdslimieten verruimd of wachttijd met een loader verborgen.

Staging: https://inzicht-staging.taalroute.nl/inzicht . Het bestaande workers.dev-adres blijft beschikbaar. Runtimebron `dcf0afb0369fc31bdb30e3cca5db1befe27dedeb`, Worker `df43bc2e-594a-4057-8d47-45febc92c1e6` op 100%. Dezelfde EU-D1, schema 7, secrets en twee staginghosts. Geen migraties.

## Bevinding en reparatie

`SchoolPlayer` importeerde zijn oefenmodule al uitsluitend vanuit een browser-effect. Toch nam de bundelaar die dynamische import ook op in het serverpakket: 22.047.694 bytes oefencode die daar niet werd gebruikt. De servermodulegrafiek woog 24.070.070 bytes. Een compileertijdcontrole voor serverrendering verwijdert die overbodige serverimport; de browserimport en bestaande foutafhandeling blijven intact.

De servercode weegt nu 2.022.018 bytes: **91,6% minder**. Cloudflare rapporteert voor de nieuwe upload 20 ms startup. De browsermodule blijft 22.047.769 bytes en is inhoudelijk identiek na normalisatie van uitsluitend gegenereerde importbestandsnamen. Dit is dus geen verplaatsing van serverwerk naar een nieuwe browserdownload; die download bestond al.

De bronwijziging bestaat uit de controle in `components/inzicht/school.tsx`, Vite-typen in `tsconfig.json`, een server/browser-importregressietest en meet-/uitvoerondersteuning in de bestaande oefenherstelproef. Geen inhoud, media, vormgeving, routes, gegevensmodel, authentificatie of productieconfiguratie veranderd.

## Vergelijkbare metingen

De andere Klink-chat heeft bevestigd geen gelijktijdige stagingtests of deployments uit te voeren. Elke browser-, MFA-, oefen- en HTTP-reeks draaide afzonderlijk. Dezelfde Mac, huidige verbinding, Chromium/WebKit, schermbreedtes 1280/390 px en meetmethode. Tijdstempels in de JSON-bestanden zijn UTC; de lokale dossierdatum is 4 november.

| Controle | Vóór | Na |
| --- | ---: | ---: |
| Langste browserstart | 1.425 ms bij 32 bezoeken | 433 ms bij 64 bezoeken |
| Browserstarts boven 1 seconde | 4/32 | 0/64 |
| Langste HTTP-aanvraag | 2.199 ms bij 48 aanvragen | 462 ms bij 48 aanvragen |
| HTTP-aanvragen boven 1 seconde | 10/48 | 0/48 |

De eerste nameting herhaalt exact de 32 bezoeken. Een latere bevestigingsreeks herhaalt die 32 opnieuw en heeft een maximum van 427 ms. Een nieuw browserprofiel betekent geen bewezen koude Worker. Het eindpunt is een zichtbaar inlogformulier met aangesloten React-verzendfunctie, niet alle optionele afbeeldingen of beschermde rapportages.

Voor het nieuwe stagingadres afzonderlijk, acht bezoeken per cel:

| Bezoek | Mediaan vóór / na | Maximum vóór / na |
| --- | ---: | ---: |
| Eerste bezoek | 263 / 241 ms | 1.292 / 297 ms |
| Herhaald bezoek | 197 / 110 ms | 1.243 / 324 ms |

De HTTP-reeks gebruikt per host vier rondes met een anonieme accountaanvraag, HTML, gecomprimeerde HTML, HEAD, een RSC-headercontrole en een statisch bestand. De RSC-headercontrole antwoordt met 307 en is geen volledige RSC-navigatie. Statische bestanden bleven ook vóór de reparatie snel. Van de 40 Worker-aanvragen vóór zijn 39 traceerbaar; de tail was voor de eerste aanvraag nog niet aangesloten. Na zijn alle 40 gekoppeld aan de juiste nieuwe Worker-versie. De acht statische aanvragen per reeks lopen buiten de Worker.

De gecontroleerde verandering en de nametingen onderbouwen het onnodig zware serverpakket als een verholpen bijdrage aan de pieken. De exacte afzonderlijke Cloudflare-stap voor moduleverspreiding, initialisatie of transport is niet apart gemeten. Geen garantie dat elke toekomstige verbinding of koude start onder een vaste grens blijft; dit is geen SLA of betrouwbare p95.

## Behoud en herstel

- 29 lokale beveiligings-, MFA-, Worker- en importgrensgevallen slagen; typecontrole, gerichte lint, gewone volledige appbouw en stagingbouw slagen.
- Vier echte synthetische MFA-stromen slagen in beide browsers en formaten, inclusief herladen, schoolafscherming en afmelden. MFA-antwoord mediaan 155 ms, maximum 164 ms; geen aparte causale MFA-snelheidsclaim.
- Twee proeven met bewust vertraagde accountantwoorden herstellen na MFA en herladen zonder hergebruik van de MFA-code of verlies van de sessie.
- Acht desktop/mobiel-licht/donker-schermparen zijn pixelgelijk aan de bestaande goedgekeurde stagingversie. Ook de anonieme start en controle bij aanwezige sessiecookie slagen.
- Oefeningen herstellen in beide browsers na een bewust mislukte download, zonder een oefenpoging te schrijven. Hersteltijden vóór 1.558/1.526 ms; na 2.411/1.406 ms. **Geen versnelling van de oefendownload geclaimd.** De bestaande browserpayload blijft behouden; de overige appbrede snelheidswijzigingen blijven apart.
- Klink- en Inzicht-productie-releasebestanden zijn bytegelijk teruggelezen. Main blijft `3f58c2136346e9dbe369b07610b7a12b570fea48`; PR10 blijft ongepubliceerd. De bestaande synthetische PR8-staging is geen vervanging voor de afzonderlijke productie-Inzicht-app.

Zware controles lokaal uitgevoerd. Vóór push geen GitHub-workflows aanwezig; geen betaalbudget gewijzigd. Geen fysieke telefoon/tablet, langdurige storingsproef of nieuwe volledige Klink/+docent-productiejourney getest. Voor productie blijven de afzonderlijke integratie-/vrijgavepunten en Nico's publicatiebesluit gelden.

## Bewijs en herhalen

`result.json` bevat de samenvatting. `browser-before.json`, `browser-after.json` en `browser-confirm.json` zijn de volledige geschoonde browsermetingen. De HTTP- en Worker-bestanden bevatten gekoppelde ray-ID's en tijden, geen credentials, cookies, IP-adressen of ruwe authenticatielogs. `appearance/` bevat de acht schermen en pixelvergelijking. Het volledige eerdere dossier blijft behouden.

Gebruik de bestaande `scripts/inzicht/latency-browser.mjs` met een nieuwe `KLINK_LOGIN_OUTPUT`-map. Voer andere netwerk-/browsertests pas daarna uit. Kopieer voor de HTTP-diagnose `probe.py` naar een privé-werkmap buiten Git en start een tijdelijke, op de vaste diagnostische header gefilterde Wrangler-tail. Bewaar ruwe headers/tail niet in het dossier; neem uitsluitend de geschoonde meetvelden op. MFA- en oefenproeven gebruiken de bestaande privé-testfactoren en uitsluitend de toegestane staginghost.

Herstelbasis: PR8 `43a4560957bd775052530e779397b17fb8254996`. De aanvullende herstelkopie bevat een daarop gecontroleerde patch en exacte gewijzigde bestanden; de eerdere volledige bronkopie `12FBKl5OsShSv7GkgnDnkrIwUP2bEi8rj` blijft bestaan. Een eventuele terugval naar een eerdere Worker-versie vereist een afzonderlijk beoordeelde opdracht; dit dossier voert geen rollback uit.
