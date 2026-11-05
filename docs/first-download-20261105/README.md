# Eerste download verkleinen — uitsluitend PR12-staging, 5 november 2026

## Uitkomst

Het grote oefenbestand daalt in de beslissende browserreeks van **2,38 naar 2,11 MB werkelijk gecodeerde overdracht** (11,3%). Alle JavaScript dat vóór het gemeten openingsmoment binnenkomt daalt van **3,14 naar 2,87 MB** (8,5%). Uitgepakt wordt het grote bestand 24.666.901 → 19.006.594 bytes: 5,66 MB minder JavaScript.

Op het huidige netwerk is de tijdwinst klein: het zichtbare Klink-scherm is mediaan na 1,36 → 1,30 seconde klaar. Geen claim van een structurele secondenwinst of verdwenen netwerkpieken. Klink+docent is gecontroleerd; de aparte Inzicht-app is niet gewijzigd.

**Alleen de twee PR12-testhosts zijn gewijzigd. Geen productiedeploy, mainwijziging, merge, PR8-mutatie, SQL of D1-mutatie vanuit deze taak.**

- PR: https://github.com/26buckets/taalroute-klink/pull/12
- Kandidaat: https://klink-pr12-candidate.nico-554.workers.dev/#learner
- Controle: https://klink-pr12-baseline.nico-554.workers.dev/#learner
- Getoetste main: `b085d626f591342e0be3aa32faa3bfe85342d5e9`.
- Reviewbasis vóór deze taak: `23a1b2ab1a3f4ccc735b49c29af01eb7889bdee0`.
- Vooraf bestaande schone stagingruntime: `66ee8c5b571dbc4137de8c7588f707dba05dc1f4`.
- Nieuwe schone stagingruntime: `a63de9ebc096e240cf0aefdb7621a842385c0a10`.
- Controle-Worker: `06200a8d-3776-4578-acfe-761092c7ad14`; kandidaat-Worker: `63327c2f-43ac-4ba5-9dcc-284b62f1b1f5`.
- Opvolgende reviewcommit(s) voegen alleen tests, meethelpers en bewijs toe.

## Wat verandert

De canonieke `data/klink-lexicon-wordbuild-rest.json` blijft bytegelijk. Tijdens de gewone bouw factoriseert `scripts/compact-lexicon-module.mjs` uitsluitend de herhaalde woordbouwstructuur. Een gewone JavaScript-functie bouwt in de browser dezelfde afzonderlijke objecten op. Dit voegt geen netwerkverzoek, dependency, niveaukeuze of uitgestelde oefeninhoud toe. Er wordt geen inhoud naar de volgende klik verschoven.

Van de 4.769 opdrachten passen 4.750 exact op hetzelfde recept. Negentien afwijkende opdrachten blijven volledig in de bundel staan. Iedere opdracht wordt tijdens de bouw gereconstrueerd en met haar complete oorspronkelijke JSON vergeleken, inclusief veldvolgorde. Iedere afwijking valt terug op het volledige bronrecord. Feedback, opties, antwoordvolgorde, bron-ID's, niveaus, woorden en tekens blijven dus behouden. Geneste objecten blijven onafhankelijk; een wijziging in één opdracht wijzigt geen andere opdracht of woord.

De bron-/importschema's voor toekomstig inhoudswerk blijven ongewijzigd. Gewoon de bestaande JSON bewerken; er hoeft geen compacte afgeleide bron te worden bijgehouden. De plugin draait uitsluitend bij bouwen en uitsluitend voor deze ene JSON-module. Node-tests en ontwikkeling lezen de oorspronkelijke data. `vite.config.ts` voegt alleen deze plugin toe; componenten, CSS, auth, data, public-media, loaders, cachebeleid en publicatiepoort blijven ongewijzigd.

Een proef met de gewone JSON-bundelinstelling leverde geen bytewinst op. Algemene object-/stringfactorisatie leverde te weinig transportwinst op en is niet toegepast. Alleen de gerichte woordbouwvariant is gebouwd. De verkenningslogs blijven bewaard.

## Beslissende tijdvergelijking

`staging-quiet-measurement/`: **64 bezoeken** in een afgestemd rustig lokaal meetvenster, Chromium en WebKit, 1280/390 px, Klink en +docent. Twee onafhankelijke contexten per combinatie/variant, lege browsercache gevolgd door echte reload, wisselende vóór/na-volgorde, verminderde beweging, geen CPU- of netwerkvertraging. Alle bezoeken 200, geen browserfouten of horizontale overflow. Browserversies en UTC-start/eindtijd staan in het ruwe bestand.

Eerste bezoek betekent lege browsercache, geen gegarandeerd koude Cloudflare-edge. Beide versies waren vóór deze beslissende reeks al op staging gebruikt. Hetzelfde netwerk en dezelfde computer; geen laboratoriumclaim over alle achtergrondbelasting of andere gebruikers.

| Scherm en bezoek | n per variant | In pagina klaar vóór | In pagina klaar na | Automatische controle vóór | Automatische controle na |
|---|---:|---:|---:|---:|---:|
| Klink oefenen · Eerste bezoek | 8 | 1.36 s | 1.30 s | 1.72 s | 1.78 s |
| Klink oefenen · Herladen | 8 | 0.69 s | 0.67 s | 0.76 s | 0.74 s |
| Klink+docent · Eerste bezoek | 8 | 1.23 s | 1.09 s | 1.50 s | 1.37 s |
| Klink+docent · Herladen | 8 | 0.61 s | 0.60 s | 0.95 s | 0.93 s |

Het in-page moment ligt na twee renderframes bij zichtbare werkplek en verdwenen loader; de automatische selectorcontrole kan daarna tot ongeveer een halve seconde op haar volgende controle-interval wachten. Beide definities zijn behouden. De automatische Klink-eerste-openingsmediaan is hier **1,72 → 1,78 seconde**, dus die teller bewijst geen verbetering. Het in-page verschil is circa 54 ms, klein en met slechts acht eerste bezoeken per variant geen bewijs van universele tijdwinst.

Klink eerste-openingmaxima in-page: 1,66 → 1,41 s. De volgende hoofdstukklik blijft rond 23 → 24 ms (8 per variant; maxima 58 → 31 ms). Chromium mediaan totale lange taken: 344 → 312 ms; langste taak 375 → 374 ms. WebKit ondersteunt deze lange-takenmeting niet. De tijd tot de eerste byte verandert niet overtuigend (Klink mediaan 92 → 96 ms); deze reparatie betreft de browserpayload.

`network-payload.json` bevat de werkelijke `encodedBodySize` per reeks. In de rustige reeks: groot bestand 2.376.575,5 → 2.108.508,5 bytes mediaan, en alle vóór het meetmoment voltooide JS-bestanden 3.140.995,5 → 2.872.980,5 bytes. Halve bytes zijn uitsluitend het gemiddelde van de twee middelste steekproefwaarden. Dit is geen optelling van alle mogelijke latere audio, beelden of achtergronddownloads. Servercompressie kan per aanvraag licht verschillen; minimum en maximum zijn bewaard.

## Overige reeksen, niet weggelaten

- `staging-measurement/`: eerste 64 bezoeken. Een andere chat bleek deels een lokale publicatiecontrole te hebben uitgevoerd. Daarom is vóór de herhaling afgesproken dat de rustige reeks de primaire tijdvergelijking zou worden, ongeacht de uitkomst. De eerste gunstigere Klink-mediaan (1,56 → 1,42 s) is niet als eindclaim gebruikt.
- `throttled-measurement/`: 32 aanvullende bezoeken in Chromium, twee viewportbreedtes, vier contexten per variant/breedte. Browsernetwerkemulatie van 3 Mbps download, 1 Mbps upload en 40 ms extra vertraging, geen CPU-vertraging. In-page eerste-openingmediaan 10,01 → 9,24 s (8 per variant), reload 0,74 → 0,70 s. Dit is een aanvullende simulatie, geen tweede fysiek netwerk; het begin kan eveneens overlap hebben gehad met de andere lokale controle en telt niet als volledig geïsoleerd tijdsbewijs.
- `local-measurement/`: 32 lokale bezoeken plus acht volgende-klikken. Een deel liep tijdens staginguploads; daarom uitsluitend functionele controle, geen primaire snelheidsclaim.

Alle voltooide bezoeken en eventuele fouten blijven bewaard. Geen uitschieters verwijderd, geen individuele geslaagde bezoeken opnieuw uitgevoerd om een mooiere uitkomst te krijgen. In totaal 160 stagingbezoeken en 32 lokale meetbezoeken.

## Behoudscontroles

- Gewone schone bouw en TypeScript geslaagd; gerichte lint geslaagd. Geen claim van een volledig schone repo-lint. Een vroege lintbevinding over `Function` in de bouwhelper is opgelost met Node's begrensde VM; er staat geen eval/VM-code in de browserrecepten.
- Alle 4.769 complete bronopdrachten exact teruggelezen; negen afwijkende/toekomstige varianten, lege banken en mutatie-isolatie getest. Volledige bankhash in `lexicon-roundtrip.json`.
- 203 complete oefen-/collectie-uitvoerhashes behouden; 47 gerichte unitcontroles geslaagd.
- 24 echte brongebonden woordbouwantwoorden in Chromium/WebKit op desktop/mobiel; oorspronkelijke lettervolgorde en juiste antwoorden gecontroleerd.
- **36 pixelgelijke schermparen:** 24 bestaande openingsschermen in licht/donker en 12 echte woordbouwschermen. Geen vloerreferentie aangepast.
- 8 parallel-laad-, 16 laad/fout/projectie/opslag-, 4 handleiding-, 8 loader/navigatie/opslag- en 44 audiocontroles geslaagd.
- 20.104 publieke bestanden bytegelijk; release-provenance en apart getoetste headers zijn uitgezonderd. Headers zijn in deze taak niet gewijzigd. Alle browserworkspaces behouden; server-JS blijft 6.248.646 bytes.
- 18 extra stagingverzoeken voor HTML/RSC/query/HEAD/404/API; 36 versiegebonden cache-URL's gecontroleerd. HTML/auth/API niet langdurig gecachet. Precies 20.000 toegestane assets; geen limiet verhoogd.
- Stagingconfig én werkelijke Cloudflare-instellingen bevatten uitsluitend ASSETS en de niet-geheime rondevariabele. Geen D1/KV/R2/service-/secretbinding toegevoegd. Ongeldige commit en onjuiste baseline worden vóór configmutatie afgewezen.
- Productie-releasebestand en deploymenthistorie voor Klink, Inzicht en PR8 zijn op de vastgelegde vóór/na-momenten identiek; werkelijk aangeboden kandidaat-release teruggelezen met juiste schone broncommit.

## Afstemming, publicatie en herstel

Afgestemd met ‘KLINK: IMPLEMENTEREN’ en ‘Zet Klink-chats online’. Hun werkbomen/spelers/schrijf- en spellinginhoud blijven ongemoeid. De andere chat heeft een afzonderlijke Spreken A1-publicatieopdracht; die neemt PR12 niet mee. Tijdens onze eindcontrole staat main nog op b085d626 en live op dc37a479. Een latere afzonderlijke publicatie verandert niets aan het stagingkarakter van deze PR; vóór eventuele productie moet de dan actuele goedgekeurde basis opnieuw worden gereconcilieerd en gecontroleerd.

Geen GitHub Actions-workflows op gecontroleerde main/PR12, geen zware cloudtest, geen budgetwijziging. Alle uitgebreide controles lokaal. Nieuwe bewijs-/helpercommits worden één keer gebundeld gepusht.

Volledige toepasbare patch tegen de getoetste main, Git-bundle, bronhelpers, screenshots en meetbewijs gaan naar de bestaande projectmap https://drive.google.com/drive/folders/1DpH2ChwgYsST5Tv_Dlf64ej-sn2rCjlF . De PR-status bevat de teruggelezen en per payload gecontroleerde ZIP-link/checksum.

## Nog open

Het grote bestand is nog circa 2,11 MB op het netwerk; verder splitsen per oefenonderdeel is niet gedaan. Daardoor kan een trage verbinding nog steeds seconden wachten. Geen echte telefoon, tweede fysiek netwerk, lange duurproef of afzonderlijke Inzicht/MFA/databaseproef uitgevoerd. Geen garantie dat de historische 4,1-secondenpiek verdwijnt. Geen productie- of mergegoedkeuring uit deze opdracht afgeleid.
