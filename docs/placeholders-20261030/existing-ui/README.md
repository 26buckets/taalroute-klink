# Klink bèta, oefenvlak en Klink Plus docent — 30 oktober 2026

Status: lokaal gecontroleerde ontwikkelversie; niet gepusht of gepubliceerd.
Bronbasis: 89f288115793a6a0521e57e60598785b3bb123ab (48 audiowoordenlijsten, 96 collecties).
Laatste gecontroleerde livebron vóór ontwikkeling: 89fe121338c1c08ed7238dceaba794a953c7fec2. Publicatie vraagt opnieuw controle van de actuele goedgekeurde livebasis en de bestaande publicatiepoort.

## Wijzigingen
- Gedeelde header houdt BETA zichtbaar, ook bij lage schermen.
- Tijdelijke aantallen bij oefenkeuze, hoofdstuk, oefenvorm en lijst. Dezelfde niveau-, hulp- en herhaalfilters als de werkelijk beschikbare collecties. Aantallen zijn oefenplaatsen, niet unieke woorden. showBetaCounts in practice-chapters.tsx schakelt alle tellers uit.
- Vaste beschikbare hoogte van het oefenvlak, rekening houdend met header, feedback en mobiele navigatie. Losse centrale luisterknop linksboven; 2×2 foto's en koppelopdrachten schalen mee. De rij voor de weergavekeuze blijft gereserveerd bij wisselen tussen oefenvormen.
- Klink Plus docent in het hamburgermenu. Bestaande les mat met woord, zin en tekst en afzonderlijke werkbladen, gericht overgenomen uit e88781b115d5de09210166832e06dff53df828b5. Geen oude appbasis of accountbackend meegenomen. Handleiding blijft naar Studio gaan.
- Bestaande voortgang en lesherstel blijven behouden. De actieve docentles schermt docentmateriaal af bij teruggaan en herladen.

## Controle
- 16 lokale inhoud-/navigatie-/docenttests.
- 18 gecombineerde controles in Chromium en WebKit: 60 schermgevallen voor 6 woordoefenvormen op 1366×768, 1280×720, 1024×600, 768×1024 en 390×844; geen intern scrollen, gelijkblijvende hoogte, geen horizontale overloop, luisterknop linksboven. Plus niveau-afhankelijke aantallen voor Alfa C/A1/A2/B1 en menu-ingang.
- 51 luisterbrowsercontroles, inclusief alle 96 nieuwe collecties en complete rondes, fouten, toetsenbord en hervatten.
- 6 volledige docentlesroutes in twee browsers op desktop/tablet/mobiel; 8 randgevallen waaronder geblokkeerde opslag en afscherming.
- Bestaande stabiliteitscontrole: 5 vensterformaten tot 320×640 en 844×390, foutafhandeling audio en bereikbaarheid van knoppen.
- Typecontrole, lint, diffcontrole en productiebouw lokaal geslaagd. Geen GitHub Actions gestart.

## Grenzen en bronbehoud
Alle bestaande foto's en opnamen zijn ongewijzigd. De inhoudelijke audio-/metadatacontrole staat in docs/audio-words-20261030. Er is één complete docentles aangetroffen: mat, met drie stappen; geen verdere lessen verzonnen. Losse klankopnamen m/a/t staan in de bestaande docentmanifest nog op null en worden eerlijk als niet beschikbaar behandeld.
Zeer lage vensters en lange teksten/werkbladen mogen blijven scrollen om tekst en bediening bereikbaar te houden. De zes geteste woordoefenvormen passen vanaf de hierboven gecontroleerde vensters zonder intern scrollen; geen garantie voor het fysieke schoolscherm zonder praktijktest.
De opgegeven DigiBord-stijlmap bestond lokaal niet. De bewaarde DigiBord-instellingenreferentie uit 27 september is visueel bekeken; bestaande lettertypes, rustige gewichten, Lucide-knoppen en de appcompositie zijn behouden.
De testnabootsing van audio is aangevuld voor de bestaande opruimacties load/removeAttribute; de echte audioplayer hoefde hiervoor niet te worden aangepast.

## Herstel
De ontwikkelbron staat tijdelijk buiten de gesynchroniseerde Documents-map omdat macOS het lezen van enkele bronbestanden blokkeerde. Git en de afleverreservekopie bevatten alle wijzigingen. Geen gebruikersgegevens of livebronnen gewijzigd. Het reservepakket bevat de eerdere volledige luisterlevering plus deze bronwijzigingen en controles.
