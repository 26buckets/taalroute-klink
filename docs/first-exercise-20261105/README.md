# Klink — eerste oefening sneller na de laatste klik

5 november 2026. Alleen staging en draft PR #12; geen productiepublicatie of merge.

## Uitkomst

De laatste klik is in alle vier verse, gepaarde 3-Mbps-metingen sneller. De mediane winst is ongeveer 0,28 seconde (22%). De mediane tijd vanaf openen tot de volledige oefening inclusief afbeelding daalt slechts circa 0,15 seconde (1,5%); drie van vier paren zijn sneller, één mobiele meting is 0,15 seconde trager. Daarom geen claim dat alle netwerkpieken verdwenen zijn of dat de hele opening overtuigend veel sneller is.

| Meting (n=4 per versie) | Controle | Kandidaat | Afname |
|---|---:|---:|---:|
| Laatste klik → zichtbare oefening | 1.298 s | 1.014 s | 21.9% |
| Openen → oefening inclusief afbeelding | 10.403 s | 10.252 s | 1.5% |
| Uitgestelde oefenmodules, overgedragen body | 195.898 kB | 91.481 kB | 53.3% |

De gedownloade body tot de zichtbare eerste oefening daalt in deze flows van circa 3,419 naar 3,317 MB (circa 102 kB / 3,0%). Dit is gemeten downloadomvang, geen uitgepakte bundelmaat. De eerste landing blijft ongeveer 2,96 MB; deze wijziging concentreert zich op de laatste klik. Het geheel is nog geen kleine app-download.

Desktop (1280): laatste klik 1,666 → 1,389 s; volledige oefening 10,926 → 10,558 s. Mobiele viewport (390): laatste klik 0,923 → 0,639 s; volledige oefening 9,892 → 9,797 s. Met slechts twee paren per viewport zijn dit beschrijvende uitkomsten, geen landelijke of statistisch zekere norm. Zie viewport-summary.json voor alle paren en bereiken.

## Wat veranderde

De gewone oefening laadt niet langer ook de modules voor Alfa C, de pakketbibliotheek en Woordenmix. Die blijven beschikbaar en laden wanneer nodig. Bestaande kleine lijstafbeeldingen krijgen een lage downloadprioriteit; URL, formaat, inhoud en compositie blijven gelijk. Er is geen afzonderlijk bewezen tijdwinst voor alleen die prioriteitshint. De gemeenschappelijke speler blijft noodzakelijk en wordt behouden. De bestaande expliciete herstelroute voor mislukte JavaScript/CSS-downloads blijft werken voor beide gesplitste modules.

De bundelconfiguratie houdt bestaande routerhelpers samen met het framework. Hierdoor blijft de staging binnen de grens van 20.000 assets, zonder content of media te verwijderen. Geen extra dependency, geen gewijzigde oefeningen, antwoorden, persoonsgegevens, authenticatie, database of opslagformaat. Geen wijziging in gedeelde handschriftbestanden van de parallelle chat.

## Methode en controles

De controle is de vorige beoordeelde stagingkandidaat, niet de oudere variant van vóór het uitstellen van oefeningen. Beide staan op aparte assets-only Workers, zonder D1/KV/R2, services, secrets of eigen domein. De caches aan de serverkant zijn voor beide symmetrisch opgewarmd. Browsercontexten zijn vers; versies wisselen per herhaling. Geen denkpauzes tussen klikken, geen CPU-beperking. 3 Mbps download, 1 Mbps upload en 40 ms extra latency zijn nagebootst in Chromium, niet gemeten op een echte telefoon of Nico's netwerk.

- 16 volledige eerste-oefening/lesflows; dezelfde oefening en les, afbeelding en fonts gereed, echte browseraudio eindigt; nul fouten.
- 64 eerste/herhaalde bezoeken in Chromium en WebKit op normale verbinding; 64 in Chromium met 3 Mbps; nul fouten. Ruwe resultaten en samenvatting staan naast dit verslag. Reload-bodybytes omvatten cachedata; gebruik networkTransferBytes voor daadwerkelijk nieuw netwerkverkeer.
- 32 pixelgelijke schermparen op desktop/mobiel en licht/donker, inclusief de geraakte verzamelinglijst. 48 spelervergelijkingen behouden tekst, geometrie en uiterlijk binnen vastgelegde kanaalafronding.
- 16 laad-/herstel-/docent-isolatiepaden; 12 controles van complete databanken en CSS; 96 Alfa C-menujourneys, 180 blokopeningen/terugwegen; loader eenmaal, lokale voortgang, meerdere tabbladen, bronherhaling, lezen, spreken, audio en Woordenmix gecontroleerd.
- Volledige functionele reeks op ddbc01ea; na de enige verdere runtimewijziging (thumbnailprioriteit) zijn bundel-/data-/CSS-, 16 herstel-, 32 beeldcontroles, TypeScript en gerichte lint opnieuw uitgevoerd op d32c07e. validation.json legt dit onderscheid vast.

+Docent blijft een controlegroep: laatste lesklik rond 0,04 seconde, zonder betekenisvolle wijziging. Een lagere totale lestijd in deze beperkte reeks wordt niet als eigen optimalisatiewinst geclaimd. Inzicht is niet opnieuw veranderd of als snelheidsexperiment gebruikt.

## Basis, afstemming en publicatiegrens

- Actuele main gecontroleerd: a272037664b8db01967aba2e4d7fe181a49ee1b7.
- Werkelijk live: 8f310654410c683c772ce889b2164441b8a2a8c0; de staging bouwt daarop voort via de eerder beoordeelde PR12-basis.
- Controle runtime: eccce25160e19d883d54d75c3859af897cd7fa15; bronreview f9e4ca695f8159723e5f0aea7e106f8d520692a7.
- Kandidaat runtime: d32c07e568c29f6f1a244ef70431bb32993d8938.
- Afgestemd met 'Zet Klink-chats online', 'KLINK: IMPLEMENTEREN' en de aanvullende focuscontrolechat. De focuschat stelde zijn zware tests uit tijdens de timingproef; zijn aanvullende correctie blijft apart/lokaal. Handschriftwerk en 50 dictees niet meegenomen.
- De deploymentgeschiedenis van productie Klink, productie Inzicht en gereserveerde PR8-staging is vóór en na identiek. Zie preservation-result.json. Geen SQL-migratie, geen merge of productiepublicatie.
- Lokale controles; geen zware GitHub Actions toegevoegd of gestart. Vóór de gebundelde push worden workflows en actuele remote-head nogmaals gecontroleerd.

Staging: https://klink-pr12-candidate.nico-554.workers.dev/#learner
Docentcontrole: https://klink-pr12-candidate.nico-554.workers.dev/#teacher/plus
Controlevariant: https://klink-pr12-baseline.nico-554.workers.dev/#learner
Review: https://github.com/26buckets/taalroute-klink/pull/12

## Nog open

De volledige eerste opening blijft rond tien seconden bij deze 3-Mbps-proef. Netwerkvariatie, de gedeelde oefenspeler en de resterende initiële download zijn niet verdwenen. De eerste klik is aantoonbaar verbeterd; een kleine totale mediaanwinst is geen bewijs dat pieken voorbij zijn. Voor publicatie zijn een nieuwe concrete vrijgave en hercontrole tegen de dan actuele livebasis nodig. De huidige productiebeveiliging is niet aangepast of omzeild. Geen claim van winst op fysiek mobiel of een live-uitrol.

probes/players-only bewaart de eerdere proef zonder thumbnailprioriteit. probes/asset-limit bewaart een lokaal afgewezen configuratie; die is nooit uitgerold. Deze proeven zijn geen onderdeel van de definitieve timingreeks.
