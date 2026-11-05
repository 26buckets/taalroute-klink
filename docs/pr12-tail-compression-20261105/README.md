# PR 12 — wachttijd tot de eerste oefening met beeld

**Resultaat op 5 november 2026:** bij 3 Mbps werd dezelfde eerste oefening in alle acht paren sneller volledig zichtbaar. De mediaan daalde **10,24 → 8,28 s** (−1,96 s, 19%). Het traagste bezoek in deze proef daalde **10,85 → 8,87 s**. De winst per paar was 1,65–2,39 s. Dit bewijst geen bovengrens voor wachttijd buiten de proef.

| Maatstaf, mediaan tenzij anders aangegeven | Controle | Proef |
|---|---:|---:|
| Openen → oefening met beeld, alle bezoeken | 10,24 s | 8,28 s |
| Openen → oefening met beeld, desktop | 10,80 s | 8,63 s |
| Openen → oefening met beeld, mobiel scherm | 9,85 s | 7,82 s |
| Openen → oefening met beeld, traagste bezoek | 10,85 s | 8,87 s |
| Laatste klik → oefening met beeld | 1,06 s | 1,07 s |
| Alle daadwerkelijk overgedragen bytes tot het beeld (decimale MB) | 3,34 MB | 2,63 MB |
| Vier gekozen bestanden samen, alleen overgedragen inhoud | 2,51 MB | 1,81 MB |

De browserprofielen uit de vorige proef tonen dat vier grote bestanden op het kritieke laadpad zitten. Eerder beginnen met ophalen veranderde de volledige wachttijd in een kleine voorproef nauwelijks. Deze proef comprimeert die vier bestanden vooraf met Brotli. De URL’s blijven gelijk; na uitpakken zijn de bestanden identiek. Er zijn geen oefenbestanden, media, stijlen, routes, antwoorden of gegevens gewijzigd. De vier originele bestanden blijven beschikbaar voor cliënten die geen Brotli accepteren. Alleen de aparte kandidaat-Worker behandelt de vier exacte paden vóór de gebruikelijke afhandeling van statische bestanden.

## Vergelijking en controle

- Controle en kandidaat dienen exact dezelfde schone bronbouw `d32c07e568c29f6f1a244ef70431bb32993d8938` op de bestaande twee PR 12-testhosts. Controleversie `b61ee5d0-0654-4c89-bf98-687ca3d16af3`, kandidaatversie `5353cc68-cf8d-438c-9e31-16e65968cd8c`. De testconfiguratie heeft geen database, secrets of eigen domein. Dezelfde 20.000 statische bestanden blijven behouden.
- Zestien verse Chromium-bezoeken, afwisselende volgorde per paar; vier paren bij 1280 px en vier bij 390 px. Gelijkmatig opgewarmde serverkant; 3 Mbps down, 1 Mbps up, 40 ms extra latency, geen CPU-beperking en geen denkpauze tussen de drie klikken.
- Gereed betekent: dezelfde oefening aanwezig, dezelfde oefenafbeelding ontvangen en gedecodeerd, lettertypen klaar en twee beeldverversingen verstreken. Dezelfde native audio is na de tijdmeting in alle zestien bezoeken helemaal afgespeeld. Geen fouten.
- Van de 40 schermparen in Chromium en WebKit waren er 39 pixelgelijk, inclusief alle acht oefenschermparen. Eén donkere mobiele lijst verschilde op twaalf randpixels met maximaal één kleurstap; de twaalf kaarten hebben dezelfde posities, maten, stijl, inhoud en beeldpaden. Zie de [gerichte nacontrole](appearance/review.json).
- [Samenvatting met acht paren](summary.json), [ruwe browsermetingen](3mbps/visits.json), [identiteit en HTTP](staging-http.json), [terugval en caching](http-fallback.json), [schermvergelijking](appearance/comparison.json), [publicatiecontrole](preservation.json) en [dicteestatus](dictation-hold.json). De handmatige HTTP-proef vraagt expliciet Brotli; voor downloadwinst telt de echte browsermeting, niet dat afzonderlijke HTTP-totaal.
- Productie Klink, productie Inzicht en Inzicht-staging hebben dezelfde uitrolhistorie vóór en na. De zes eerder ingetrokken banken met 36 dictees geven nog 404; de overige 14 kandidaten zijn niet uitgerold. Geen publicatie, geen merge, geen workflow toegevoegd.

Een [onafhankelijke broncontrole](review-checks.json) en [onafhankelijke herberekening](independent-timing-review.json) bevestigen de werking en de meting.

De stageroute wordt voorbereid door `scripts/prepare-pr12-compression.mjs` bovenop de gebruikelijke databasevrije PR 12-configuratie. De proef is omkeerbaar via de bestaande statische afhandeling zonder wrapper. Voor een eventuele livegang moeten de gevolgen van extra Worker-aanroepen bij netwerkverzoeken (ook bij een Cloudflare-cachehit; de browsercache kan een verzoek voorkomen) en de prestaties op echte mobiele apparaten afzonderlijk worden beoordeeld. Deze stagingproef wijzigt de productieroute niet.
