# KLINK D — officiële app, 24 oktober 2026

Nico heeft het officiële logo D ook voor de zelfstandige Klink-app goedgekeurd. De twee bestaande logo-SVG’s krijgen exact de canonieke lettercontouren, kleuren en onderlinge afstanden uit Studio. Het bestaande vectoronderschrift blijft staan; het volledige logo behoudt zijn kader en headerformaat.

## Behoud

De actuele livebasis is vastgelegd in live-before.json en worker-before.txt. De bron op main is een afstammeling daarvan. Alleen de twee volledige logo-SVG’s en de drie bestaande browser-/appicoonbestanden veranderen in de uitvoerbare app. De SVG-iconen gebruiken bytegelijk de canonieke D-bron; het ICO-bestand bevat exports op zes echte icoonformaten. Geen wijzigingen aan appcode, lessen, beelden, audio, routes, lokale opslag of inhoudsakkoorden. Werkversies uit andere chats zijn niet meegenomen.

De vier gepubliceerde Studio-assets zijn opnieuw bytegelijk aan de goedgekeurde D-bronnen bevonden. De tien andere onderzochte appbronnen bevatten geen afzonderlijke Klink-logoasset of woordmerkverwijzing; zie other-app-logo-inventory.json.

## Visuele controle

Desktop en mobiel: volledig logo en onderschrift, oorspronkelijke headermaat en indeling. De startpagina en docentpagina hebben geen horizontale overloop, JavaScriptfouten of ontbrekende afbeeldingen. De bestaande volledige foto blijft onaangeroerd.

## Bestaande aandachtspunten

Axe meldt op de startpagina één bestaand contrastpunt: de kleine tekst ‘Nederlands, stap voor stap’ (.landing-eyebrow). Exact dezelfde melding staat op de livebasis, bij desktop en mobiel. De docentpagina heeft geen gemelde WCAG A/AA-overtredingen in deze scans. Dit is geen volledige toegankelijkheidscertificering.

De algemene lintcontrole rapporteert 45 bestaande meldingen, uitsluitend in ongewijzigde bestanden. De nieuwe logotest heeft geen lintmeldingen. Deze beperkte logopublicatie brengt geen overige, ongepubliceerde appwijzigingen mee.

Tests en uiteindelijke publicatie worden apart in het vrijgaveregister vastgelegd.

## Herstelde testbronnen

De volledige regressiereeks liep aanvankelijk vast op ontbrekende historische audiocontrolerapporten in de schone clone. Zestien originele JSON-rapporten zijn teruggehaald uit de bestaande publicatiewerkkopie. Tekst en SHA-256 zijn vergeleken met de vastgelegde audiokandidaten en de daadwerkelijke bestaande audiobestanden. Alleen de oorspronkelijke rapporten zijn toegevoegd; audio en goedkeuringsstatus zijn ongewijzigd. Zie restored-test-records.json. Het onderbroken posttest-deel is opnieuw uitgevoerd. Daarna is ook het oorspronkelijke toelatingsrapport admissions.json hersteld: SHA-256 gelijk aan het eerder gepubliceerde bronarchiefmanifest. De volledige content-importgroep is opnieuw geslaagd. Alle onderdelen van de regressiereeks zijn daarmee afgerond.
