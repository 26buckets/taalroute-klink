# Klink — vormgevingsronde 14 oktober 2026

Productie: https://klink.taalroute.nl, Cloudflare Worker `taalroute-klink`.
Bron: GitHub `26buckets/taalroute-klink`. Geen GitHub Actions-workflows.
Voorafgaande herstelcommit: `3667044bd92d1e375a65face6e1d467bcaac7df1`.

## Interface

- Entree met foto, twee vierkante boekknoppen voor Cursist en Docent, en de vijf leerhandelingen van Klink.
- De SVG voor de browsertab gebruikt hetzelfde bestaande Klink-symbool als het appicoon. De metadataverwijzing heeft een nieuwe cacheversie.
- Tijdens de les één werkvlak, compacte stappenrail en vaste bediening. Op kleine schermen kan lange opdrachtinhoud binnen het werkvlak schuiven; de pagina zelf blijft staan.
- Gelijke beeldkaders zonder rekken of afsnijden. De beelden zelf zijn niet als nieuwe, consistente serie geproduceerd.
- Bij Beeld en audio staat de opbouw van los woordbeeld naar context, handeling en geheel. Ontbrekende stappen worden niet als bestaande beelden voorgesteld.

## Audio en beelden

De woordopname van boek is in CP001 en CP002 afgekeurd en ontkoppeld. Oude bestanden blijven als herstelmateriaal behouden. CP001 heeft 326 gekoppelde audiobestanden; CP002 heeft 19. Alle overige woordopnamen houden een open luistercontrole. Geen claim dat alle audio nieuw of origineel is: stem-ID's en complete generatieregisters zijn niet bewezen. Zie `word-audio-audit.json` voor hashes en gevonden bronovereenkomsten van alle twintig CP002-woorden.

De herkomst en stijl van de CP002-woordbeelden lopen uiteen. Harmonisatie van het kader is afgerond; volledige inhoudelijke en visuele harmonisatie van de bronbeelden staat open.

## Controle

Lokaal: catalogusvalidatie, TypeScript, productiebuild en browsercontrole met 18 componentfamilies en 52 opdrachtvarianten. Entree op 1440×1000, 1366×768 en 390×844; lesbediening en audio op desktop en mobiel. Controle op vierkante boekknoppen, horizontale overloop, pagina-overloop in lessen en zichtbaarheid van vaste bediening.

Gerichte lintcontrole op de gewijzigde bestanden slaagt. De volledige lintcontrole meldt bestaande fouten in ongewijzigde UI-bibliotheekbestanden en `compact-learner-app.tsx`; deze ronde herstelt die niet. Geen cloudtestworkflow toegevoegd.

Bron, webmedia, dit register en herstelgegevens worden gezamenlijk in de bestaande Drive-projectmap Alfabeta+ Klink bewaard. Een Drive-back-up is geen livepublicatie.
