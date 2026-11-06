# Oefenbestanden gebundeld — lokaal, niet gepubliceerd

Basis: canonieke main `a31d800770cb03a4275f033b2c1534aef873e4dd`, afstammeling van de gecontroleerde livebron `cefd22e3220decc663a0e982f63d912906ac4ea9`. Werkbranch: `codex/practice-bundles-20261106`.

1.720 bestaande bestanden worden zonder inhoudswijziging geleverd in 113 bundels van maximaal 1 MiB. De bestaande bundellezer blijft in gebruik. Alleen de gekozen oefening wordt geladen; Start haalt geen oefenbundels op. Het aparte afleverregister wijzigt geen bronindex, oefen-ID, voortgangssleutel, antwoord, media of vormgeving.

De oorspronkelijke bestanden blijven in Git en de herstelkopie. Hun exacte paden worden uitgesloten van de statische upload. Gerichte middleware levert op diezelfde oude adressen de oorspronkelijke bytes terug, inclusief HEAD, cachecontrole en correcte foutmeldingen. Onbekende en al eerder uitgesloten bestanden blijven onbereikbaar. Bestaande API-bestanden blijven ongewijzigd. De middleware is nodig omdat de publieke-bestandsrouter vóór gewone approutes komt.

`npm run build` maakt de bundels deterministisch en telt na de bouw de werkelijk publiceerbare bestanden volgens de Wrangler-uitsluitingen. Vanaf 18.000 volgt een waarschuwing; boven 20.000 faalt de bouw. De normale publicatieroute blijft daardoor ook tegen overschrijding beschermd. Los tellen: `npm run check:assets`. Niets is gepusht of gepubliceerd; geen cloudcontroles, abonnementen of budgetwijzigingen.

Resultaat: **20.000 → 18.393 bestanden; 1.607 plaatsen vrij**. Het blijft boven de waarschuwingsgrens. De gewone app haalt de nieuwe bundels statisch op. Alleen oude losse bestandsadressen gebruiken voortaan de bestaande Worker; dat vraagt Worker-uitvoeringen. Er is geen betaalde capaciteit aangezet.

Controles: deterministische herbouw, bytegelijkheid van alle bronnen, volledige HTTP-teruglezing van 19.955 bestaande publieke bestanden, 113 bundels en 81 API-bestanden; 1.809 oefenblokken in Chromium; 226 extra bundelopeningen in Chromium/WebKit; oorspronkelijke clients met oude links; fout/herstel; 32 gelijke schermparen (desktop/mobiel, licht/donker, cursist/docent); opslag, schrijfgeschiedenis, 42 formulieren, 48 focus-/dialoogproeven, acht Help-proeven en 268 + 52 handelingen met echte audio. Types, lint, 49 curriculumproeven en 11 formulier-/navigatieproeven zijn groen. Lokale Wrangler-proef verpakt zonder upload (gzip 6.237,25 KiB).

Testscripts: `test-practice-bundles.mjs`, `test-practice-bundles-http.mjs`, `test-practice-delivery-browser.mjs`, plus bestaande behoudtests. Browservergelijkingen gebruiken de ongewijzigde basis op localhost:19127 en de kandidaat op localhost:19128. Ruw bewijs staat in `outputs/practice-bundles-20261106/` en in de gecontroleerde Drive-herstelkopie. `verification.json` bevat de tellingen. De bestaande publicatieakkoorden, historische bewijsbestanden en liveversieregisters zijn niet vervangen.

Tijdens de testontwikkeling bleek een algemene audiomock de ongewijzigde docentbasis al te laten mislukken. De docentvergelijking gebruikt daarom echte browseraudio. Extra geldige achtergrondverzoeken van de oude client worden toegelaten, terwijl de bedoelde oude bestandslinks expliciet moeten terugkomen. Geen appgedrag aangepast voor deze testproblemen.

Niet gecontroleerd: een fysieke telefoon en livegedrag na publicatie. Geen nieuwe menselijke luisterreview; geen nieuwe of gewijzigde audio. Herstel: gebruik de basiscommit en het herstelpakket; de oorspronkelijke bestanden en index zijn behouden. Een eventuele latere publicatie vereist opnieuw de actuele livebasis en de normale publicatiepoort.
