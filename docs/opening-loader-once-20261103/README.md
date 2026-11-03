# Laadanimatie één keer — 3 november 2026

De bestaande animatie speelt eenmaal per geopend appdocument. Daarna toont ieder volgend laadmoment direct het bestaande eindbeeld met de punt op de i. Het eerste beeld blijft na afloop van zijn animatie eveneens op dat eindbeeld staan, zolang er nog wordt geladen. Volledig herladen begint een nieuw bezoek.

De SVG speelde al één keer per afbeelding; verschillende laadcomponenten konden haar opnieuw starten. De gedeelde component bewaart nu uitsluitend in het geheugen van het geopende document dat zij al is getoond. Geen nieuwe afbeeldingen, afhankelijkheden, opslagvelden of extra wachttijd. De bestaande voltooiingscallback, decode-afhandeling en timeropruiming blijven intact. De drie bestaande aanroepplaatsen delen dezelfde component.

Basis: main c53e3cdb045f9e42df3ad7c85a99d9bf15dc0fb4; werkelijk gecontroleerde livebron b0763872c76c319e02d4464b57b7afcb02d21ed3. Afgestemd met de inhoudschat: geen parallel loaderwerk. De eerdere performance-PR10 en Inzicht-PR8 zijn niet gewijzigd.

Lokaal gecontroleerd met de echte React-component: 16 gevallen in Chromium en WebKit, 1280/390 pixels, licht/donker en normale/minder-bewegingstand. Eerste animatie beweegt; twee opeenvolgende hermontages tonen direct het eindbeeld; ook na een volledige volgende animatiecyclus blijft het beeld pixelgelijk. Het statische beeld is pixel voor pixel gelijk aan de laatste animatieframe. Voltooiingscallback en annulering zijn inclusief React StrictMode gecontroleerd. Nul paginafouten. TypeScript, gerichte lint en diffcontrole geslaagd. Logoassets, CSS en alle aanroepplaatsen bytegelijk aan de basis; zie preservation.json. Eindbeeld op mobiel in Chromium/licht en WebKit/donker visueel bekeken.

Geen productiedeployment of merge uitgevoerd. Nico's eerdere stagingvoorwaarde voor publicatie blijft open. Dit is een aparte reviewbare wijziging; integratie in de actuele canonieke publicatieketen en volledige vrijgavecontrole horen bij latere publicatie. Geen volledige nieuwe app-/les-/audio-/MFA-reeks, fysieke telefoon of onafhankelijke toegankelijkheidsaudit uitgevoerd. Geen nieuwe GitHub-workflows; vóór push zijn nul workflows aangetroffen.
