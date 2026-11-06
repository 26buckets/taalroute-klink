# Klink PR12: gecontroleerd gepubliceerd — 6 november 2026

Nico’s opdracht: “Neem aan dat alles online is, zorg dat alles online staat.” Publicatie via schone canonieke main en de normale `npm run deploy`. Livebron `8d73a0bda6ba3d13344f319e6863f6f74acb69c3`, Worker `6910338c-5fb6-4cff-af3f-483c3abd5596`, gebouwd 2026-11-06T17:45:24.129Z. Afstammeling van de laatst gecontroleerde productiebron `7e87eca15c1e5d63fe2b68d6623d9cce0334bce2`; PR12 is op GitHub als merged bevestigd.

## Wat online staat

Klink en Klink+docent: gesplitste oefencode, compacte woordenbanken, vooraf berekende oefengegevens en voorbereide openbare pagina’s. Gewone bediening spreekt de knoptekst niet meer uit; gewone tekst en expliciete luisterknoppen blijven hoorbaar. De nieuwe oefenindeling, 50 goedgekeurde woordvragen, inhoud, media, opslag en vaste vormgeving blijven behouden.

- https://klink.taalroute.nl/#learner
- https://klink.taalroute.nl/#teacher/plus
- https://inzicht.taalroute.nl/ — bestaande afzonderlijke productieapp; aanmeldscherm bereikbaar, niet gewijzigd.

## Gemeten op de echte website

Verse Chromium-contexten, desktop 1280 px en mobiel 390 px, 3 Mbps down / 1 Mbps up, 40 ms extra vertraging, geen CPU-vertraging. Dezelfde eerste oefening/les, inclusief gedecodeerde beelden en lettertypes. Per onderdeel twee livebezoeken voor en twee na publicatie; kleine steekproef, geen fysieke telefoon. Geen andere browserproeven tijdens de nameting. Afwisselende staging-controlebezoeken staan ook in de ruwe resultaten. Geen claim dat netwerkvariatie overal verdwenen is.

| Volledig eerste onderdeel gereed | Vorige liveversie | Nieuwe liveversie |
|---|---:|---:|
| Klink, mediaan | 15,51 s | 8,94 s |
| Klink+docent, mediaan | 16,50 s | 12,00 s |
| Klink, mediaan opgehaalde gegevens | 3,56 MB | 3,01 MB |
| Klink+docent, mediaan opgehaalde gegevens | 3,98 MB | 3,43 MB |

Dit is een voor/na-meting op verschillende momenten, geen garantie voor elke verbinding. Ruwe gegevens: `speed/visits.json` en de voorpublicatieproef in `../normal-vs-live/visits.json`; berekening in `speed-summary.json`.

De echte Help-knop opent op desktop en touch zonder woordleesverzoek en zonder audiobundel. De eerder aantoonbare onbedoelde download van 2.084.715 bytes vervalt; de 600 ms nacontrole is geen gemeten nieuwe openingsduur.

## Behoud en controles

- Normale publicatiepoort en build geslaagd; 94 negatieve mutaties van bron, akkoord en herstelbewijs geweigerd. Bestaande inhouds-/media-/audiometadatacontroles uitgevoerd, inclusief 1.979 audiobestanden.
- Live: acht Chromium/WebKit-scenario’s, desktop/touch × leerling/+docent. Knoppen stil, functies behouden; echte audio tot einde, expliciet luisteren en toetsenbordbediening geslaagd.
- Live: 18 openbare pagina/RSC/API/HEAD-controles; 20.218 bestaande bronassets exact gelijk aan vorige build; 18.393 gepubliceerde assets. 21 nieuwe livebundels/releasemarker exact teruggelezen; alle inhoudskenmerken gelijk.
- Live: 32 schermparen in Chromium/WebKit, desktop/mobiel en licht/donker. 31 direct pixelgelijk. Eén Chromium-kaartschaduw verschilde op 14 pixels; detailuitsneden gecontroleerd. De gerichte herhaling met 1 seconde uittekentijd is volledig pixelgelijk. Oorspronkelijke foutlog behouden, geen referentie aangepast. Voorpublicatie waren alle 32 paren pixelgelijk.
- Concrete livevoorbeelden van beide apps en de Inzicht-login vastgelegd; vier actuele oefen-/lesopeningen zonder paginafouten.
- Eerste browseraanroep vanuit de canonieke checkout miste de afzonderlijke lokale Playwright-tooling. Identieke tests vervolgens uitgevoerd vanuit de bestaande ingerichte testcheckout; geen productwijziging of dependency toegevoegd. Beide oorspronkelijke logs behouden.

## Serverkosten en grenzen

Geen nieuwe dienst, R2, migratie, abonnement of budgetverhoging. Normale hostingconfiguratie behouden, nul toegevoegde Worker-first-routes. De staging-Brotli-wrapper is niet gepubliceerd. Eerste-openingaanvragen dalen in deze proef: Klink 53/49 naar 46/38, +docent 77/71 naar 71/64. Geen nieuwe betaalde route; het totale accountverbruik is hiermee niet gegarandeerd €0. Geen GitHub Actions-workflows op de gecontroleerde branches; zware controles lokaal uitgevoerd.

## Wat nog openstaat

De afzonderlijke PR8-uitbreiding van Inzicht staat niet live: andere authenticatie/databasebasis, eerst compatibel integreren en gegevensherstel/security controleren. Alleen de bestaande productie-login is hier gecontroleerd, geen ingelogde schoolgegevens.

Resterende netwerkvariatie en echte telefoons zijn niet volledig afgedekt. De bestaande mobiele Alfa-C-footer/ondersteuning-overlap en de historische test die één specifieke oude bundelnaam verwacht, zijn geen nieuwe regressies en niet gerepareerd. De nieuwe compacte onderbalk uit het parallelle werk wacht nog op Nico’s eigen visuele akkoord en is niet meegenomen. Geen inhoud of uiterlijk aangepast om tests passend te maken.

## Herstel

Voorpublicatiepakket: https://drive.google.com/file/d/1SerLMm4-13mOYRBBWNE_3Y7fYKsky_rU/view — 34.441.962 bytes, volledig teruggelezen; 172 payload-hashes gecontroleerd. De definitieve aanvullende cloudcontrole komt in `backup.json`. Deze postflight-bestanden wijzigen geen runtime en vragen geen nieuwe deploy.
