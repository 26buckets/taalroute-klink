# Gepubliceerd — aanvullende klikrandenreparatie

Livebron `60c12280847ee54725df9830f1666a7ebfdcfa58`; Worker `9dde3e87-e714-4e8b-bada-63242a54f3fd`, 100%. Via schone canonieke main en `npm run deploy`, vanaf werkelijke livebron ca2633c1 met de 50 dictees.

Alleen drie runtimebestanden veranderen. Ongewenste aanwijzerranden verdwijnen bij de Klink+docent-hulpmiddelen, Delen en uitlegvensters. Toetsenbordfocus blijft zichtbaar, ook bij terugkeer uit de uitlegvideo. De bestaande audiofeedback blijft intact. De identieke focusfunctie zit in het bestaande MotionFeedback-bestand, waardoor geen extra asset nodig is. Geen inhoud, media, voortgang, database, afhankelijkheid, publicatieconfiguratie of overige vormgeving veranderd. Help in de oefenbalk, appel en peer en alle 1.809 banken inclusief 50 nieuwe dictees behouden.

Voor publicatie: types, lint, 49 curriculumproeven, 52 negatieve vrijgaveproeven in vijf gerichte guards, gewone publicatiepoort/build, 64 vensterproeven, 8 schermparen, 2 aanraakstromen en 8 Help-/contextproeven geslaagd.

Na publicatie in Chromium/WebKit: 64 vensterproeven, 8 Help-/contextproeven, 6 opslagproeven (tabbladen, echte schrijflocks, veranderende rondegrootte), 12 schrijfproeven (concepten, eerste/laatste antwoord, oude geschiedenis, opslagweigering/herstel). Acht echte voor/na-livebeelden op desktop/mobiel, licht/donker: nul overige pixelverschillen. Twee aanraakstromen en twee echte audiostromen inclusief actieve speelmarkering en opruimen na einde. Alle 8.134 mediabestanden exact teruggelezen; 81 API-bestanden exact inclusief HEAD en bytebereik. Alle 50 dictee-opnamen exact met ingebedde Taalroute-merkvelden en volledige decode. Opslagproeven gebruiken gesimuleerde audio; de aparte audioproeven gebruiken echte weergave.

De eerste live-uitlegproef drukte Escape terwijl de iframe-HTML al aanwezig maar de scriptinitialisatie nog niet klaar was. Ruwe vier Chromium-diagnoses bewaard. De gecorrigeerde proef wacht op DOMContentLoaded, behoudt alle origin-/source- en toetsenbordasserties en slaagt alle 16 gevallen. Dit veranderde alleen de proef, niet de app.

De eerdere uitrol van 52ddc17c was vóór assetupload geblokkeerd op 20.001 bestanden; geen livewijziging. De huidige normale route is geslaagd met 22 geüploade en 19.978 behouden assets: 20.000 totaal. Geen betaald abonnement, budgetwijziging of workflow toegevoegd. Deze limiet biedt nu geen vrije bestandsruimte; toekomstige uitbreidingen moeten binnen de bestaande bundelstrategie passen.

Geen fysieke telefoon-, schermlezer- of nieuwe menselijke luisterreview. Bestaande inhoudelijke reviewbeperkingen blijven eerlijk bewaard. Volledige bron/herstelketen via ../publication-final/backup.json, ../backup.json, de dictee-publicatieback-up en de oorspronkelijke volledige media-/bronback-up. Het eindarchief en de terugleescontrole staan in backup.json. Deze bewijsopvolger verandert geen runtime; niet opnieuw deployen.
