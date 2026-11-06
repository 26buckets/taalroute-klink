# Oefenbundels gepubliceerd — 6 november 2026

Livebron `db57924f60e8d632eed0d1b75c9b48a7491da709`, Worker `8a62114e-78f9-4025-8b22-6eb3ffbd8088`, vooraf vastgestelde livebasis `cefd22e3220decc663a0e982f63d912906ac4ea9`. Gepubliceerd vanuit schone canonieke main met `npm run deploy`; de normale publicatiepoort bleef actief. Geen workflows, betaalde upgrade, extra cloudtests of omweg.

1.720 losse oefenbestanden zijn in 113 bundels opgenomen. De originele bronbestanden blijven behouden. De gepubliceerde omvang is 18.393 assets, met 1.607 vrije plaatsen tot 20.000. De lokale waarschuwing vanaf 18.000 blijft daarom terecht zichtbaar; boven 20.000 blokkeert de build.

## Geslaagde behoudcontroles

Alle 20.149 bestandscontroles kwamen bytegelijk terug: 19.955 bestaande publieke bestanden, 113 nieuwe bundels en 81 bestaande API-bestanden. De oude oefenlinks, HEAD/304/405/404, foutmelding/herstel en vier oude-clientgevallen zijn gecontroleerd. Alle 1.809 oefenblokken en 154 ingangen zijn live geopend. De twee browserengines openden samen 226 bundels. Alle 32 schermparen zijn pixelgelijk, inclusief Klink+docent, desktop/mobiel en licht/donker.

Zes opslag-, twaalf schrijf-, 48 venster- en acht Help-controles slaagden. De oorspronkelijke inhouds- en mediabestanden, app/componenten, opslaglogica en CSS zijn niet gewijzigd. De bestaande volledige lokale vrijgavecontroles en metadata-controle zijn vastgelegd in `../publication/` en de publicatielogs. Geen nieuwe audio of beelden gemaakt.

Alle 81 API-bestanden slaagden in een volledige live Node-fetchreeks: GET, HEAD en bytebereik, 243 aanvragen met exacte inhoud en grootte. De volledige herhaling achter elkaar slaagde: 268 toetsenbordstappen en 52 bladopdrachten met echte audio, in Chromium en WebKit op desktop en mobiel.

## Open stabiliteitspunt — geen volledig groene liveverklaring

Drie parallelle browserpogingen liepen vast bij het laden van een oefenblad. Ook afzonderlijke curl-aanvragen naar bestaande API-bestanden bleven soms zonder antwoord, op beide Cloudflare-adressen en met en zonder cache-omzeiling. Het serverlog liet geannuleerde aanvragen zonder foutmelding zien. Dezelfde API-aanvragen slaagden lokaal 30 maal op de oude en 30 maal op de nieuwe versie; de afzonderlijke gerichte bladcontrole en de volledige Node-fetchreeks slaagden live.

De oorzaak is niet bewezen. Dit is niet afgedaan als onschuldige testtiming en niet als opgelost gemarkeerd. De eerdere liveversie kon niet via een beschikbare versiepreview worden vergeleken; er is geen preview ingeschakeld, geen rollback uitgevoerd en geen speculatieve appwijziging gepubliceerd. Mislukte pogingen, transportmetingen en de volgorde-aanpassing van de laatste browsercontrole blijven in de herstelkopie bewaard. De seriële herhaling verandert uitsluitend de testplanning, geen eisen, audio, antwoorden of productcode.

Geen fysiek telefoontoetsenbord of schermlezer gecontroleerd; technische audiocontrole is geen nieuwe menselijke luisterreview. De bron blijft de hierboven genoemde livecommit. Deze bewijsopvolger verandert de runtime niet en mag niet opnieuw worden uitgerold voor alleen de documentatie.

## Herstel

`verification.json` bevat hashes en grootte van het volledige livebewijs. `backup.json` bevat de gecontroleerde Drive-herstelkopie; daarin staan ook alle schermbeelden, volledige bestandscontrole, publicatielogs, bronbundle en de eerder gecontroleerde lokale/publicatiepakketten. Persoonlijke aanvraagheaders en ruwe serverlogs zijn niet opgenomen; uitsluitend de relevante, opgeschoonde uitkomsten.
