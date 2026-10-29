# Vast docentkader en informatieverdeling

28 oktober 2026. Lokale wijziging, niet gepubliceerd.

## Uitgevoerd

De vier dagelijkse docentopties delen TeacherWorkspaceFrame: vaste titel Docentomgeving, expliciete aangemelde docentnaam, vaste navigatie, één hoofdkaart en Overzicht op dezelfde plek. Op desktop blijven de buitenmaten gelijk en schuift langere inhoud binnen de kaart; op mobiel blijft dezelfde kolomindeling behouden en kan de pagina groeien. De drie startkeuzes blijven aanwezig.

Klink+docent en Werkbladen vallen nu ook binnen dit kader. De actieve bordles behoudt de afgesproken schermvullende lesweergave zonder docentnaam/cursisten. Les sluiten keert terug naar Klink+docent binnen het kader; Overzicht sluit de les en keert direct terug naar het overzicht. Terugknop, herladen en routewijzigingen blijven tijdens een actieve les fail-closed. Het algemene menu is in de docentwerkplek beschikbaar en wordt bij projectie afgeschermd.

De naam is variabel en komt uit de aangemelde docentgegevens. Nico is door de bouwer aangemaakt voor deze lokale testtoegang en eerder in de browser geopend; dit was geen automatische identiteitsherkenning of zelfstandige registratie door de gebruiker. De interface noemt nu expliciet Aangemeld als. Met een andere ingerichte docentcode verschijnt de naam van die docent. Geen registratieflow of wijziging van docentgegevens toegevoegd.

## Advies, inhoud nog niet verplaatst

- Cursisten en groepen: namen, groepsindeling en oefencodes, omdat de docent hier handelt.
- Opdrachten: doelgroep, gekozen leesstap en afronding, omdat de docent hier werk klaarzet en terugziet.
- Klink+docent: de les openen en op het bord uitvoeren; geen verplichte voorbereiding.
- Werkbladen: materiaal, ondersteuning, voorbeeld en afdrukken; korte aanwijzingen die direct nodig zijn voor dat blad.
- Bij deze les, uitklapbaar: specifiek lesdoel, benodigde woorden/voorkennis, materiaal en concrete observatiepunten. Dit verschilt per les en hoort dicht bij het materiaal.
- Studio-handleiding: algemene uitleg over Alfa A/B/C, acht fasen, hulpkeuzes, observatieprincipes en het gebruik van Klink. Algemene didactiek hoeft niet op ieder printscherm opnieuw zichtbaar te zijn.

De huidige Werkbladen-pagina bundelt algemene uitleg, lesvoorbereiding, technische mediacontrole en afdrukken te veel. De inhoud is behouden; deze opdracht gaf toestemming om de schermstructuur gelijk te trekken en vroeg advies over de inhoudsverdeling. Er is geen tekst naar Studio verplaatst en geen lesinformatie verwijderd.

## Controle

- De echte database-browserketen blijft werken: groepen, cursisten, individuele/groepstoewijzing, oefencode, mat-les afronden, codeherstel en uitloggen.
- Aanvullend alle vier docentopties op 1280, 1024 en 390 px: dezelfde kaartpositie/-breedte, gelijke desktophoogte, vaste Overzicht-positie, één main-element, juiste aangemelde naam en geen horizontale overloop.
- Zes volledige bordreizen in Chrome/WebKit op drie schermmaten, met terugkeer uit de bordles en uit de bordstart naar Overzicht.
- Acht bestaande randgevallen en 222 routecontroles.
- Negen bestaande A4-afdrukken: alle één pagina, geen navigatie/kop/accountgegevens op papier. Alfa C-werkblad visueel gecontroleerd. Dit zijn regressiebewijzen, geen nieuwe drukuitgave.
- Typecheck, gerichte lint en productiebuild geslaagd. Geen publicatie, nieuwe dependencies of cloudworkflows. Geen fysieke bord-/telefoonproef of klasproef.
