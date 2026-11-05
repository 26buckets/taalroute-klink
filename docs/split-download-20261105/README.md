# Resterende oefendownload splitsen — PR12, uitsluitend staging

## Aantoonbaar resultaat

| Eerste bezoek, tenzij anders vermeld | Controle | Kandidaat |
|---|---:|---:|
| Grootste ontvangen JavaScriptbestand | 2,109 MB | 1,203 MB |
| Alle ontvangen JavaScript samen | 2,874 MB | 2,889 MB |
| Klink zichtbaar en bruikbaar, mediaan | 1,384 s | 1,134 s |
| Klink maximaal waargenomen in deze reeks | 1,583 s | 1,311 s |
| Klink na echt herladen, mediaan | 0,729 s | 0,712 s |
| Klink+docent eerste opening, mediaan | 1,107 s | 0,949 s |
| Klink bij 3 Mbps, mediaan | 9,315 s | 9,326 s |

Het grootste bestand is 43,0% kleiner; de normale eerste Klink-opening is in deze reeks 18,1% sneller en Klink+docent 14,3% sneller. De **totale download is 0,5% groter**, vrijwel gelijk. Dit is splitsing en snellere opening in de gemeten omgeving, geen claim van minder totale bandbreedte. Bij 3 Mbps is er geen aantoonbare tijdwinst: circa 11 ms verschil op 9,3 s. De verbinding blijft daar bepalend.

De volgende hoofdstukklik blijft nagenoeg gelijk: 32 → 34,5 ms normaal en 25,6 → 25,9 ms bij 3 Mbps. Beide afgesplitste banken waren in alle eerste Klink-bezoeken al ontvangen vóór het gereedmoment. Geen extra inhoud naar die klik verschoven. Langste Chromium-mainthreadtaak: 399 → 419 ms; geen claim dat alle afzonderlijke CPU-pieken kleiner zijn geworden.

Per variant zijn er acht eerste Klink-bezoeken en acht eerste +docent-bezoeken in de normale reeks; de 3Mbps-reeks heeft acht eerste Klink-bezoeken per variant. Kleine steekproeven, dezelfde computer/browserversies en geëmuleerde schermmaten; geen universele of statistisch zekere tijdgarantie. Ruwe data en beide samenvattingen staan in final-staging/ en final-3mbps/.

**Nog niet naar productie gepubliceerd.** Voor trage verbindingen blijft een echte verkleining van de totale eerste download open; daarvoor moet de bestaande synchrone beschikbaarheid van niveaus, aantallen, oefenkeuzes en oude links behouden blijven wanneer later inhoud op aanvraag wordt geladen. Deze proef voegt dat uitstel niet toe.


Deze proef bouwt voort op de voorafgaande compacte lexiconproef. De resterende grote browserbundel wordt verdeeld in twee zelfstandige bron-/woordbanken en de overige gedeelde oefencode. Alle benodigde oefengegevens zijn nog steeds geladen voordat de werkplek zichtbaar wordt; geen nieuwe wachtrij bij de volgende keuze. Vite verwerkt JSON rechtstreeks met JSON.parse. De canonieke inhoud, antwoordregels, audio, opslag en UI-bronnen zijn ongewijzigd.

De enige runtimewijziging voor deze vervolgproef staat in vite.config.ts. De bronbank bevat imported-practice/word-use-self; de woordbank bevat curriculum, lexicon, woordmedia en de kleine curriculumhelper. De woordmedia zitten bij de curriculumhelper om een circulaire moduleafhankelijkheid te voorkomen. Bestaande audiohelpers, die al bij de eerste pagina samen werden geladen, zitten bij de gedeelde UI. Daardoor blijven beide bouwvarianten binnen de bestaande grens van 20.000 assets; geen media verwijderd en geen limiet verhoogd.

## Basis en afstemming

- PR12: https://github.com/26buckets/taalroute-klink/pull/12
- Kandidaat: https://klink-pr12-candidate.nico-554.workers.dev/#learner
- Controle: https://klink-pr12-baseline.nico-554.workers.dev/#learner
- Actuele canonieke main: fc51e7c5501f5bf410ee96e569e3676b51d65568, alleen publicatiebewijs bovenop onderstaande livebron.
- Inhoudsbasis/livebron van de afzonderlijke leespublicatie: 93d69b044b5e3a5bf177c88cb0cfd2fe0bb03402.
- Kandidaat runtime: 1e1d919c08c2a61f0b17f7601f510c227b44035f; Worker 04cc8d5e-1f43-4c17-8443-ef1d3f909a57.
- Controle runtime: cbb8d41612c115c50829ff339c5eb1023e8f1865; Worker e56bea88-3d03-484d-81ff-0f758db46470.
- Hun bronbomen verschillen uitsluitend in vite.config.ts. Beide builds zijn sourceClean:true.
- Afgestemd met ‘KLINK: IMPLEMENTEREN’ en ‘Zet Klink-chats online’. De andere chat publiceerde afzonderlijk twintig A1/A2-leesvragen via main, zonder PR12; die inhoud is in beide proefvarianten gereconcilieerd.
- Alleen twee bestaande PR12-workers.dev hosts gebruikt. Werkelijke bindingcontrole: ASSETS plus de niet-geheime proefnaam. Geen database, secret, productie-route, PR8 of Inzicht-deploy vanuit deze taak.

## Controles

- 45 oefen-/bank-/compactie-unittests plus het contract van de twintig nieuwe leesvragen.
- 203 volledige collectie-/oefenhashes gelijk aan de actuele controlebasis.
- 12 volledige gecompileerde bronbankhashes in Chromium/WebKit, inclusief iedere tekst, elk antwoord en veldvolgorde. Banken onafhankelijk importeerbaar; geen oefen-/woordbibliotheekbank op de startpagina.
- Alle gebouwde CSS bytegelijk; 24 exact gelijke desktop-/mobielschermparen in licht/donker.
- 8 controles op parallel laden, 16 op laden/projectie/antwoorden, 4 handleidingroutes, 8 loadernavigaties met opslagbehoud en 44 audiocontroles.
- 80 lees-/woordaudio-/antwoordstromen, 160 afgewezen afleiders, 8 volledige rondes met gedeeltelijk/volledig herladen.
- 40 spreekoefeningen, bestaande native audio, 4 rondes/herladen en 2 synthetische microfoonproeven.
- Typecheck en gerichte lint; 18 HTML/RSC/HTTP/API-controles; 20.105 bestaande publicbestanden bytegelijk; 35 versiegebonden cache-URL’s zonder uitbreiding naar HTML/API.
- Brede tests lokaal; geen GitHub Actions-run of productiepublicatie.

## Meetmethode en behouden voorlopige proeven

De eindproef vergelijkt 64 bezoeken in Chromium en WebKit, op 1280/390 px, met verse browsercontexten en echte herlaadbezoeken, wisselende volgorde en twee herhalingen per combinatie. Daarbovenop volgt een aparte Chromium-proef met 32 bezoeken bij 3 Mbps download/1 Mbps upload en 40 ms toegevoegde vertraging. Dit is netwerkemulatie, geen tweede fysiek netwerk. Geen CPU-vertraging ingesteld; verminderde beweging in beide varianten.

Beide hosts zijn vooraf symmetrisch bezocht met vier afzonderlijke contexten. Dat is een lege browsercache tijdens de metingen, geen koude-edgeproef. Andere chats pauzeerden builds, zware controles en grote uploads tijdens het afgesproken eindvenster. Het in-page meetmoment gebruikt zichtbare werkplek, verdwenen loader en twee renderframes; de tragere automatische selectorwaarneming blijft afzonderlijk in de ruwe data staan.

EncodedBodySize is de werkelijk gecodeerde inhoudsgrootte; decodedBodySize is uitgepakte code en transferSize bevat ook protocoloverhead. Het downloadoverzicht telt bij eerste bezoeken uitsluitend JavaScript dat vóór het in-page gereedmoment voltooid was. Herladen wordt apart getoond. Ook de volgende hoofdstukklik is gemeten.

De lokale proeven blijven bewaard als verkenning. De eerste remote meetreeks is na 43 bezoeken afgebroken omdat de voorafgaande opwarming een te brede lesknopselector had en niet volledig was afgerond. De genoteerde gesloten-browserfout komt door die bewuste onderbreking. Deze reeks is uitgesloten van de eindclaim. De opwarmselector en contextscheiding zijn hersteld vóór de nieuwe eindreeks. Geen metingen achteraf uit een voltooide eindreeks geselecteerd.

De leespublicatie heeft een afzonderlijke vrijgaveassertie die ongewijzigde runtime ten opzichte van oudere main vereist. Die past niet bij de cumulatieve snelheids-PR en is bewust niet versoepeld. Het oorspronkelijke foutlog blijft behouden; het inhoudscontract, de volledige actuele A/B-collectiehashes en de 80 echte browserstromen controleren het behoud binnen deze taak. Zie reconciliation.json en probes voor overige afgewezen voorbereidingsproeven.

Geen claim over fysieke telefoons, menselijke beluistering, MFA-prestaties of blijvend verdwenen netwerkpieken. Meetwinst wordt pas op productie getoetst na een afzonderlijke publicatieopdracht op de dan actuele goedgekeurde basis.

## Geverifieerde herstelback-up

Drive: https://drive.google.com/file/d/1FEl20wW7Sop12cd4Nm-TY6fw0jOSGDi9/view?usp=drivesdk

89.742.908 bytes, 153 payloads; SHA-256 24267f9f91451254199b52a866443ce76b2ad0ac02e8d2f16d92f56731a3412e. Hele upload teruggelezen en alle payloads tegen het manifest gecontroleerd. De volledige binaire patch past op canonieke main fc51e7c5; de Git-bundle met kandidaat en controle is geverifieerd. Het pakket bevat reviewbron 44fff8c1 en alle uitgevoerde bewijsstukken; de daaropvolgende ontvangstregistratie verandert geen runtime. Zie backup.json.
