# Leesbare zinnen bij Kijk en luister — 29 oktober 2026

Basis: main 84fc8980, afstammeling van actuele livebron 4970049f7831d020f52218e39c192368bb371f23. Gerichte proefcorrectie; niet gepubliceerd.

Bij Winkel en boodschappen (production:meet:alfa-c:KEL_C01) gebruikte een volledige zin de woordgrootte van 72 px. De eerste zin nam op 1366×768 twee regels in; het einde lag onder de rand van het oefenvlak. Zinnen krijgen nu 24–36 px met regelhoogte 1,4. Hetzelfde oefenvlak groeit bij langere tekst mee; geen afgesneden einde of eigen schuifvlak voor deze modelzinnen. Losse woorden houden hun bestaande grootte. Inhoud, beelden, geluid, menuopbouw en voortgang zijn ongewijzigd.

Gecontroleerd: 64 gevallen (alle acht winkelzinnen, Chromium en WebKit, 1366×768, 768×1024, 390×844 en 320×568). Elke volledige zin en alle tekstregels passen binnen het oefenvlak, zonder interne overloop of horizontale paginaoverloop. Audioaanroepen zijn met een afspeelstub gecontroleerd; audio is niet gewijzigd of opnieuw inhoudelijk beluisterd. De losse woordkaart blijft in beide browsers 44 px. Desktop en smal WebKit-voorbeeld visueel bekeken. TypeScript, gerichte lint, route-unitcontrole en diffcontrole slagen.

De oudere algemene Alfa C-integratietest stopt op zijn oorspronkelijke verwachting van nul gewone Alfa C-categorieën; de huidige goedgekeurde productiebron biedt er twee. Die test is hier niet aangepast en geldt niet als geslaagd. De gerichte tekstcontrole dekt de daadwerkelijke actuele Winkel en boodschappen-reeks. Geen fysieke apparaatproef of cursistenproef geclaimd.

De opgegeven DigiBord-stijlreferentiemap was op deze machine niet aanwezig. Deze correctie gebruikt de bestaande applettersoort, gewichten, knoppen en schermindeling; alleen zinsgrootte en beschikbare tekstruimte veranderen.
