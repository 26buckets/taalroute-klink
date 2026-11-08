# Audiobundels — lokaal gecontroleerd, niet gepubliceerd

Opdracht van Nico, 8 november 2026: bundelstructuur en audiokoppelingen in Klink en Klink+docent, behoud van audio, oude links, voortgang en uiterlijk, zonder nieuwe kosten. Geen publicatie.

Basis: canonieke main `a7e9a5fd405b47884fffa3bb1fa0ad42f58dcf6d`, afstammeling van de actuele livebron `99908642b4ec39b31fdeb68ce7c591271259e77e`. Beide opnieuw bevestigd na de lokale controles. Werkbranch `codex/audio-bundles-local-20261108`. De liveapp, canonieke main, workflows en publicatiegoedkeuringen zijn niet gewijzigd.

## Werking en behoud

11.724 bestaande korte MP3-/WAV-opnamen zijn verliesloos verpakt in 3.897 bestanden van maximaal 128 KiB, met 128 kleine indexbestanden. Iedere opname, inclusief ingebedde metadata, is byte voor byte gelijk aan het origineel. Brongroepen volgen de bestaande audiomappen; niet iedere groep is één les. Lange opnamen, M4A, eerdere woordbundels en de ontgrendelopname blijven in hun bestaande vorm.

De gedeelde speler en Klink+docent halen alleen de benodigde index en kleine bundel op en spelen daaruit het oorspronkelijke audiobestand. Annulering, opruimen van tijdelijke audioadressen, tempo, toetsenbordbediening en bronidentiteit blijven behouden. De bestaande losse audio is terugvaloptie bij een mislukte bundel/indexaanvraag. Een later uitsluitend gebundelde nieuwe opname heeft vanzelfsprekend geen losse terugvalkopie.

Alle 13.831 bestaande gepubliceerde audio-assets blijven op hetzelfde adres, met dezelfde bytes. Daarom bespaart deze stap nog geen plaatsen in de oude audioverzameling: oude links behouden vereist het bewaren van die bestanden. Nooit eerder gepubliceerde nieuwe korte opnamen kunnen voortaan uitsluitend als bundel worden aangeboden, terwijl hun bronbestanden in de repository blijven. Lange nieuwe opnamen blijven losse assets.

Lokaal resultaat: hoofdapp 8.587/20.000 bestanden (11.413 vrij), bestaande audiopublicatie 13.831/20.000 (6.169 vrij). De bestaande lokale limietcontrole en blokkade blijven afzonderlijk per publicatie tellen: waarschuwing vanaf 18.000, blokkade boven 20.000 bestanden. Geen extra Worker, route, R2, servicebinding, betaalde upgrade, afhankelijkheid of GitHub Actions-run toegevoegd. De bestaande gratis statische publicatieopzet wordt gebruikt. De volledige accountfactuur/budgetblokkade is niet onafhankelijk uitleesbaar; geen budgetinstelling gewijzigd.

## Lokaal bewijs

- Build, TypeScript en lint geslaagd; lint heeft twee bestaande waarschuwingen in oude diagnosebestanden.
- 13 bundel-/spelerproeven, 10 statische-publicatieproeven en 49 inhouds-/lesproeven geslaagd.
- Alle 22.418 lokaal aangeboden assets bytegelijk gecontroleerd; 25 HTTP-contracten en 39 uitgesloten/onbekende paden gecontroleerd.
- 8 echte native afspeelproeven voor cursist/docent, Chromium/WebKit en desktop/mobiel; afgespeelde bytes gelijk aan origineel. 8 aanvullende bedieningsproeven geslaagd.
- 6 opslagproeven en 4 handschrift-/IndexedDB-herlaadproeven geslaagd. Bestaande gegevensopslag niet gewijzigd.
- 40 uiterlijkparen: 39 direct pixelgelijk. Eén paar verschilde 14 schaduwpixels met één kanaalstap; hetzelfde verschil trad op tussen twee ongewijzigde referenties, de tweede referentie en de kandidaat zijn exact gelijk. Geen referentie of CSS aangepast.
- Volledige woordluisterreeks: 42 controles geslaagd, 2 fouten voor hetzelfde reeds bestaande Alfa C-probleem, in beide browsers. De compacte bronafbeelding is daar afgeknipt/niet aanklikbaar; gereproduceerd op de ongewijzigde basis. Deze volledige reeks is dus niet volledig groen. Geen visuele reparatie meegenomen.
- Eerste afspeelstart bij gesimuleerde 3 Mbps/80 ms en lege HTTP-cache: mediaan 528 ms, tegenover 266 ms in de basis (3 metingen per versie). Dit is een opslagvoorziening, geen bewezen snelheidsverbetering. Geen fysieke telefoon-/stylusproef of nieuwe menselijke luisterreview.
- De normale publicatiecontrole blokkeert terecht: de bestaande brongebonden goedkeuring dekt deze nieuwe bestanden niet. Geen beveiliging aangepast of omzeild.

Ruwe lokale resultaten, screenshots en reproduceerscripts staan in `outputs/audio-bundles/` en in de herstelback-up. `checks/preservation.json` bevat de behoudscontrole. `checks/image-baseline-limitation.json` legt de bestaande afwijking vast; `checks/benchmark.json` de snelheidsmeting.

## Herstellen en verder werken

1. Gebruik bovenstaande basiscommit of een gecontroleerde afstammeling. Het herstelarchief bevat gewijzigde/nieuwe bronbestanden, een patch, controles en alle gegenereerde bundel-/indexbestanden; het is geen volledige repositorykopie.
2. Zet de opgeslagen bronbestanden terug op hun relatieve paden. Herstel `public/audio-bundles/v1/` uit het archief vóór het wijzigen/herbouwen van de audio in een schone checkout.
3. `npm run audio:bundle:local` bouwt de oefen-/audiobundels. `npm run audio:bundle:check` en `npm run test:audio-bundles` controleren ze. Voer muterende bundeltests en builds na elkaar uit, niet tegelijk.
4. `npm run build`, `npm run audio:prepare:local` en `KLINK_PREVIEW_PORT=19145 npm run audio:preview:local` starten de geïsoleerde proefserver. Deze heeft geen publieke routes. De normale publicatieroute blijft ongewijzigd.
5. `data/klink-audio-retention.json` bewaart de 4.025 onveranderlijke lokale bundel-/indexadressen. De bouwer verwijdert deze nooit. Als een oude bundel niet meer uit de huidige bronnen kan worden opgebouwd en lokaal ontbreekt, stopt de bouwer: herstel dan de geverifieerde back-up. Dit voorkomt breuk van oude indexen/tabbladen en later uitsluitend gebundelde opnamen.
6. Voeg bij iedere toekomstige gecontroleerde vrijgave alle nieuw goedgekeurde bundel-/indexnamen aan die bewaarlijst toe; verwijder geen oudere namen. De lokale behoudscontrole blokkeert nog niet vastgelegde namen. Archiveer en verifieer de volledige bewaarlijst plus bestanden vóór publicatie. Bewaarde oude versies tellen mee in de bestandslimiet.
7. Nieuwe inhoud vraagt eigen inhouds-/audiometadatacontroles. De huidige behoudscontrole bevat bewust aantallen van deze herstelversie en moet bij echte inhoudsuitbreiding brongebonden worden bijgewerkt. Een schone checkout moet de historische livecommit beschikbaar hebben voor de oude-linkcontrole.

Publiceren vraagt een afzonderlijke expliciete opdracht, herbevestiging van de actuele livebasis, passende volledige controles en een opvolgende brongebonden vrijgave. Dit document en de bewaarlijst zijn geen publicatiegoedkeuring.
