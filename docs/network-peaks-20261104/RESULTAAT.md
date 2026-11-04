# Klink: eerste opening en netwerkpieken — 4 november 2026

**Lokaal gebouwd en gecontroleerd; niet gepubliceerd of gemerged.** Opdracht: resterende pieken onderzoeken en beperken, vooral bij de eerste opening van de oefenomgeving, afstemmen en niets opnieuw live zetten.

## Actuele basis en afstemming

- Canonieke main: `b085d626f591342e0be3aa32faa3bfe85342d5e9`.
- Werkelijk live: `dc37a479a7a6f148d61ffb5140dfd79112331f85`, Worker `886d4b64-a6bc-42bb-92f2-41ff7bb91dfb`. De latere main-commits bevatten uitsluitend de eerdere meetcorrectie/bewijzen.
- Eigen branch: `codex/klink-network-peaks-20261104`; eigen werkkopie. Canonieke main, PR8, staging en de afzonderlijke Inzicht-app blijven ongemoeid.
- Rechtstreeks afgestemd met de chats **Zet Klink-chats online** en **KLINK: IMPLEMENTEREN**. Zij werken aan inhoud en bronregisters; deze branch beheert alleen de eerste opening en de beschreven berekening. Geen dubbel inhoudswerk.
- Geen wijzigingen aan data, afbeeldingen, audio, CSS, authenticatie, opslag, D1, configuratie of publicatiepoorten. De 36+14 dictees blijven HOLD. Geen remote SQL.

## Twee gerichte verbeteringen

1. Het gekozen cursisten- of docentonderdeel begint tegelijk met de gedeelde werkruimte te downloaden. Voorheen startte die tweede aanvraag pas na laden én verwerken van de gedeelde inhoud. De bestaande provider, foutafhandeling van de laadgrens en loader blijven behouden. Dit geldt zowel voor een directe link als voor binnenkomst via Start/Begin.
2. Bij het samenstellen van oefenvormen worden ongeschikte brontypen eerder overgeslagen. De koppeling tussen bronnen en lessen wordt eenmaal per samenstelling geïndexeerd, in plaats van de hele oefeningenlijst voor iedere bron opnieuw te doorzoeken. De oorspronkelijke bronvolgorde en seed-index blijven intact.

De inhoud is niet uitgesteld naar de volgende knop. Alle 1.242 pakket/oefenvorm/seed-combinaties (69 pakketten, negen vormen, twee seeds; 12.180 resultaatrecords) zijn vergeleken met de ongewijzigde basis: volledige geordende JSON, inclusief antwoorden, media, bronlessen, voorwaarden en ID's, is gelijk. Negen lege-pakketgevallen slagen eveneens.

## Aantoonbare metingen

Alle cijfers zijn milliseconden of hieronder omgerekend naar seconden. `summary.json` bevat de exacte waarden; de ruwe metingen blijven behouden. Een eerste bezoek gebruikt een nieuwe browsercontext. Herladen gebruikt een nieuwe documentklok met behouden HTTP-cache; alle 24 document-ID's per lokale reeks zijn uniek.

| Proef | Voor, mediaan | Na, mediaan | Verandering | Langzaamste voor → na |
|---|---:|---:|---:|---:|
| Eerste bezoek, lokaal, Chromium + WebKit, desktop + mobiel, n=12 per versie | 1,625 s | 1,189 s | circa 27% sneller | 1,787 → 1,353 s |
| Echt herladen, dezelfde lokale reeks, n=12 per versie | 1,349 s | 0,848 s | circa 37% sneller | 1,620 → 1,320 s |
| Desktop netwerkprofiel, Chromium, gzip, 150 ms latency / 12 Mbps, n=3 per versie | 4,772 s | 4,383 s | circa 8% sneller | 4,783 → 4,386 s |
| Mobiel netwerkprofiel, Chromium, gzip, 150 ms latency / 6 Mbps, n=3 per versie | 7,194 s | 6,871 s | circa 4% sneller | 7,197 → 6,885 s |
| Gedeeld bestand opzettelijk 1,2 s vertraagd, beide browsers en schermmaten, n=12 per versie | 2,822 s | 2,379 s | circa 16% sneller | 2,918 → 2,511 s |

De netwerkprofielen gebruiken een lokale gzip-proxy met vooraf gecomprimeerde bestanden; 64 werkelijk aangeboden scripts/styles zijn teruggelezen en bytegelijk aan de bouwbestanden. De versies wisselen in meetvolgorde. Alleen Chromium gebruikt netwerkemulatie; WebKit draait in de gewone lokale en vertraagde-bestandsproeven. De vertraagde-bestandsproef onderschept verkeer en heeft daarom uitdrukkelijk **geen warme-cacheclaim**. Een mobiel profiel is geen meting op een fysieke telefoon. De kleine netwerksteekproeven bewijzen geen landelijke p95 of gegarandeerde maximumtijd.

Bij de vertraagde-bestandsproef start de geselecteerde app in alle twaalf nieuwe gevallen vóór afronding van het gedeelde bestand; bij de oude versie gebeurt dat niet. De volgende handeling, Woorden bekijken, blijft snel: mediaan ongeveer 61 → 62 ms in die proef. De winst wordt dus niet naar deze volgende knop verplaatst.

Elke verbetering is afzonderlijk onderzocht: `parallel-only/` bevat de eerste downloadwijziging zonder rekenwijziging. Een afzonderlijke JSON-verpakkingsproef (`json-only/`) gaf weinig tijdwinst en een groter bestand; die configuratiewijziging is niet opgenomen.

## Wat de live-diagnose nog laat zien

Twaalf nieuwe eerste bezoeken aan de **ongewijzigde** liveversie zijn gemeten zonder onderschepping of vertraging. Mediaan gereed: 4,586 s; langzaamste: 6,804 s. Bij dat langzaamste bezoek kwam de eerste HTML-respons pas op 4,541 s. Ook twee andere langzame bezoeken wachtten ongeveer 3,8–4,0 s vóór de HTML binnenkwam. Zie `live-diagnosis/measurements.json` en de drie voorbeelden in `summary.json`.

Dit plaatst een belangrijk deel van de resterende piek vóór het downloaden en uitvoeren van de oefenomgeving. Deze browsermeting onderscheidt transport, Cloudflare-afhandeling en eventuele externe vertraging niet verder. Er is geen bewijs om één daarvan als oorzaak aan te wijzen. In zes vers geïsoleerde lokale Worker-instanties blijft de eerste HTML-afhandeling ongeveer 37 ms vóór en 41 ms na de wijziging; herhaalde aanvragen ongeveer 3 ms. Dat is **geen serverwinst** en geen maat voor een Cloudflare cold start: de lokale opstart bevat ook meetgereedschap. Zie `origin.json`.

De nieuwe code is niet live getest, omdat publiceren uitdrukkelijk niet is toegestaan. Er is geen claim dat de externe pieken verdwenen zijn. Na afzonderlijk publicatieakkoord zijn een actuele broncontrole, opvolgende normale vrijgave en herhaling van dezelfde live-metingen nodig; bij aanhoudende HTML-pieken is gerichte request-/edge-diagnose nodig.

## Behoud en controles

- Normale productiebuild en TypeScript geslaagd; gerichte lintcontrole geslaagd.
- 23 bestaande inhouds-, groeps-, hoofdstuk- en audioregistertests geslaagd.
- 1.242 exacte inhoudsvergelijkingen en negen lege-pakketgevallen geslaagd.
- Acht echte Start/Begin- en oorspronkelijke docententreecontroles bevestigen parallel laden, zichtbaar wachten en daarna openen.
- Zestien laad-, fout-, projectie- en antwoordbehoudcontroles geslaagd.
- Acht echte loader/navigatiecontroles geslaagd; latere loaders blijven op het eindbeeld.
- 24 pixelgelijke vóór/na-schermparen in Chromium/WebKit, desktop/mobiel en licht/donker. Geen nieuwe vormgevingsreferentie gemaakt.
- 44 browsercontroles voor woordaudio geslaagd, nul fouten.
- 19.999 aangeboden assets; grootste bestand 24.666.765 bytes. Geen betaald limietverzoek of media verwijderd.
- Geen GitHub-workflows in de huidige main of werkbranch; alle zware controles lokaal. Geen cloudrun gestart.
- De bestaande publicatiepoort blokkeert deze nieuwe, niet vrijgegeven bronwijziging. Dat is vastgelegd in `publication-gate.log`; de poort is niet aangepast of omzeild.

## Herhalen en herstellen

Gebruik de bewaarde basisbuild op poort 19122 en de kandidaat op 19120 met `scripts/serve-performance.mjs`. `scripts/measure-performance.mjs` meet echt eerste/herhaald gebruik. `scripts/measure-network-peaks.mjs` meet de request-volgorde, HTML-timing en gereedmomenten. Voor de gecomprimeerde netwerkproef start `scripts/serve-network-benchmark.mjs` met `KLINK_NETWORK_BASELINE_BUILD`, en gebruik `KLINK_NETWORK_DELAY=0 KLINK_NETWORK_THROTTLE=1`. Dit zijn uitsluitend lokale meetservers; geen publicatieroute.

De volledige wijziging, tests en bewijzen worden gebundeld voor de bestaande Klink-projectmap in Drive. De afzonderlijke ontvangstcontrole en exacte hash staan in `backup.json` zodra de upload is teruggelezen. Het archief is een herstelkopie, geen livepublicatie. Persoonlijke MFA, echte cursistgegevens en fysieke telefoons zijn niet getest.
