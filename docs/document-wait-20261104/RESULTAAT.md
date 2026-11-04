# Wachttijd vóór ontvangst van de pagina — review, niet gepubliceerd

Onderzocht op 4 november 2026. Aanvulling op draft PR #12, niet op main of de afzonderlijke Inzicht-app. Afgestemd met de chats ‘Zet Klink-chats online’ en ‘KLINK: IMPLEMENTEREN’. Geen deployment, merge, SQL-migratie of wijziging van budgetten/limieten uitgevoerd. De livebron blijft dc37a479a7a6f148d61ffb5140dfd79112331f85; main blijft b085d626f591342e0be3aa32faa3bfe85342d5e9. De directe vergelijkingsbasis is de eerdere PR12-head 27b78204e2fa317cbf0cd650b45495d7430203a8, inclusief de reeds gecontroleerde parallelle downloads en snellere oefenindex.

## Wat het onderzoek aantoont

Zes afwisselende paren op hetzelfde live domein, via dezelfde Amsterdamse Cloudflare-locatie:

- Vier HTML-cachemissers: 2.077–2.414 ms tot het eerste paginabyte. Twee treffers: 72 en 84 ms.
- Het statische releasebestand: 67–156 ms. TLS-opbouw circa 23–33 ms.
- Vijf aanvullende, uitsluitend eigen gemarkeerde aanvragen zijn gekoppeld aan gefilterde Worker-metingen. Vier trage aanvragen hebben 151–278 ms Worker-walltijd en 128–229 ms CPU-tijd; de snelle aanvraag 14/10 ms. De bijbehorende cliëntwachttijd loopt bij de trage aanvragen tot 3.762 ms.

Dit is sterk bewijs dat de pieken samenhangen met een ontbrekende paginacache. De standaardcache wordt per serverinstantie in geheugen opgebouwd. De geregistreerde handlerduur verklaart echter **niet de volledige vertraging van meerdere seconden**. Opstarten/aanroepen/routering buiten die gemeten handler is een kandidaat, geen bewezen volledige verklaring. De conclusie ‘het is alleen het wifi-netwerk’ wordt door deze metingen niet gedragen. Er is niet op een tweede fysiek netwerk gemeten.

Bewijs: `curl-pairs.json`, `tagged-requests.json`, `worker-timings.json`. Alleen geselecteerde timing- en cachegegevens zijn bewaard; geen ruwe verzoekheaders, IP-adressen of inloggegevens. De tijdelijke gefilterde logstream is gestopt.

## Gerichte wijziging

De bestaande build bereidt openbare HTML- en RSC-pagina’s voor. De officiële, exact op 1.1.0 vastgezette `@vinext/cloudflare`-adapter leest die voorbereiding via de bestaande Cloudflare Static Assets. Dit staat in het CDN-cachevak; de gewone datacache wordt niet vervangen. Een nieuwe serverinstantie hoeft de startpagina daardoor niet opnieuw te renderen. Er is geen extra Worker, KV, Durable Object, opslagdienst of database toegevoegd.

De voorbereide inhoud bestaat uitsluitend uit `/`, `/docenten`, `/proef-alfa-c` en de openbare foutpagina. API’s zijn uitgesloten. Dynamische handleidinghoofdstukken blijven via de bestaande afhandeling lopen. Build-ID en exacte HTML-inhoud zijn gecontroleerd tegen de build-output; de adapter levert in deze versie geen build-ID-responsheader, dus die header wordt niet als bewijs gebruikt. Wijzigingen worden bij een volgende reguliere build opnieuw voorbereid; dit is geen cache van persoonlijke voortgang.

Om de acht cachebestanden binnen de bestaande grens te houden, zijn kleine onderdelen van de al aanwezige startschermcode gebundeld. Er zijn **20.000 aangeboden bestanden bij dezelfde uitsluitregels**. Er is niets aan inhoud, media, vormgeving, authenticatie, voortgang of bestaande uitsluitregels gewijzigd. De grens heeft nu geen vrije bestandsruimte; een toekomstige toevoeging vraagt opnieuw een capaciteitscontrole. De lokale Wrangler-proef slaagt: 6.130,95 KiB gecomprimeerde Worker, uitsluitend bestaande DB plus ASSETS-binding. De melding ‘Read 20280 files’ in die proef betreft gelezen bestanden vóór de bestaande uitsluitregels, niet de berekende aangeboden set.

Een eerdere proef met alleen `prerender: true` bleek onvoldoende: de Worker gebruikte de voorbereiding niet. Die onvolledige variant is niet het voorgestelde eindresultaat.

## Nieuwe metingen tegenover de eerdere PR12-kandidaat

| Meting | Voor | Na | Omvang |
|---|---:|---:|---|
| Eerste HTML-aanvraag, nieuwe lokale Worker, mediaan | 35 ms | 14 ms | 6 instanties per versie |
| Grootste eerste HTML-wachttijd | 42 ms | 15 ms | dezelfde reeks |
| Cachetreffers bij eerste aanvraag | 0/6 | 6/6 | dezelfde reeks |
| Herhaalde HTML-aanvraag, mediaan | 3 ms | 3 ms | 6 per versie |
| Oefenomgeving gereed, lokale browser, mediaan | 1.140 ms | 1.134 ms | 12 per versie |
| Volgende knop, lokale browser, mediaan | 60 ms | 60 ms | dezelfde reeks |
| Desktopprofiel, 150 ms / 12 Mbps, gereed | 4.382 ms | 4.281 ms | 3 per versie |
| Mobielprofiel, 150 ms / 6 Mbps, gereed | 6.881 ms | 6.843 ms | 3 per versie |

De serverproef is zonder extern netwerk, met een nieuwe lokale Worker per herhaling en afwisselende volgorde. Initialisatie van de lokale testomgeving is apart vastgelegd en is geen schatting van Cloudflare-opstarttijd. Browserproeven gebruiken verse contexten, Chromium/WebKit en breedtes 390/1280; de bandbreedteproef gebruikt Chromium, vooraf gecomprimeerde bestanden en geen CPU-vertraging. De tweede knop blijft 53–55 ms in de netwerkprofielen. Kleine verschillen in de complete browserstart zijn **geen bewijs van een merkbaar sneller live openingsscherm**; de lokale maximumtijd stijgt zelfs licht, 1.313→1.331 ms. Het harde resultaat is de verdwenen eerste cachemisser en circa 60% lagere lokale eerste serverwachttijd.

Ruwe gegevens: `origin.json`, `browser/measurements.json`, `mobile-desktop-network/measurements.json`; compacte cijfers in `summary.json`. De eerdere PR12-winst staat afzonderlijk in `../network-peaks-20261104/` en wordt hier niet opnieuw als winst van deze wijziging geteld.

## Behoud en controles

- 18 verzoekcontroles: gewone pagina’s, synthetische cookies/autorisatie, query’s, RSC, HEAD, 404 en de bestaande 410-antwoorden op beide uitgeschakelde opslag-API’s. Alleen openbare pagina’s in de voorbereidingslijst.
- 20.105 bestaande niet-gegenereerde bestanden bytegelijk met de bewaarde PR12-build, inclusief niet-aangeboden bronbestanden. Bestaande bestanden onder `_next/` en het gegenereerde release-/entrymanifest zijn hiervan uitgezonderd.
- 24 pixelgelijke schermparen: Klink-start, cursist en +docent; Chromium/WebKit, desktop/mobiel, licht/donker.
- 8 controles op parallel laden, 16 op laden/fouten/antwoorden/projectie, 4 handleidingnavigaties, 8 loadernavigaties met behoud van opslag, 44 audiocontroles.
- 23 gerichte unittests; 1.242 exacte inhoudsvergelijkingen en 9 lege-pakketgevallen.
- Productiebouw, TypeScript, lockfile-validatie en lint van alle geraakte code slagen. De volledige repository-lint meldt 56 bestaande fouten in 18 ongewijzigde bestanden (`lint-existing.json`); die zijn niet stilzwijgend opgelost of als geslaagd gerapporteerd.
- De bestaande publicatiecontrole blijft blokkeren omdat deze nieuwe scope buiten de historische vrijgave valt. De beveiliging is niet gewijzigd of omzeild. Geen GitHub Actions-workflows aanwezig op main of deze branch; alle zware controles lokaal.

## Aanvullende lokale opstartproef

De officiële geïnstalleerde Wrangler-opstartprofiler is één keer per versie lokaal uitgevoerd. Deze bouwt uitsluitend met `--dry-run` en profileert daarna de module-import in Miniflare. Beide profielen bevatten circa 11,4 ms niet-inactieve samples; de totale profielen van circa 228/230 ms bestaan grotendeels uit inactieve profilerwachttijd. Dit toont **geen extra winst of oorzaak van secondenlange vertraging bij de lokale module-initialisatie**. Het is geen meting van de volledige Cloudflare-opstart en wordt daar niet als vervanging voor gebruikt. Ruwe profielen en uitleg: `startup-before.cpuprofile`, `startup-after.cpuprofile`, `startup.json`.

## Open vóór publicatie

1. Deze kandidaat in een afzonderlijk afgestemde stagingproef meten: meerdere verse serverinstanties, dezelfde cacheheaders, cliënt-TTFB én Worker-timing, over meerdere momenten/netwerken. Pas dan kan de resterende Cloudflare-/netwerkcomponent worden vastgesteld en de echte piekvermindering worden geclaimd.
2. Zo nodig vervolgdiagnose van het verschil tussen cliëntwachttijd en gemeten Worker-handlerduur; dat verschil is nu niet volledig verklaard.
3. Bij publicatievoorbereiding actuele main/livebron, bestandsruimte en de normale vrijgavecontrole opnieuw beoordelen. Deze beurt heeft uitsluitend een reviewkandidaat opgeleverd; staging en productie zijn ongewijzigd.

Reproductie: bewaar een build van PR12-head 27b78204..., bouw de kandidaat met `npm run build`, start beide met `scripts/serve-performance.mjs` op 19122/19120 en de passende `KLINK_PERF_BUILD_ROOT`. `scripts/test-prepared-pages.mjs` gebruikt `KLINK_NETWORK_BASELINE_BUILD`. `scripts/measure-network-origin.mjs` gebruikt dezelfde basis en `KLINK_NETWORK_ORIGIN_OUTPUT`; de andere uitvoerpaden staan expliciet in de betreffende scripts. Gebruik geen echte cursistgegevens. De lokale browserhulpmiddelen zijn dezelfde bestaande Playwright-installatie als bij PR12; ze zijn niet als extra applicatieafhankelijkheid toegevoegd.
