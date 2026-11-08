# Alfa C-klikherstel en snellere audiostart — lokaal

Opdracht van Nico, 8 november 2026: herstel het Alfa C-klikprobleem, onderzoek een snellere audiostart, behoud alle audio, oude links, voortgang en uiterlijk, zonder nieuwe kosten. Niet publiceren.

Dit is de lokale opvolger van `docs/audio-bundles-local-20261108/`. Werkbranch: `codex/audio-bundles-local-20261108`; basis `a7e9a5fd405b47884fffa3bb1fa0ad42f58dcf6d`, livebron `99908642b4ec39b31fdeb68ce7c591271259e77e`. De wijzigingen zijn lokaal en niet gepusht. De canonieke main en liveapp blijven onaangeraakt.

## Herstel

Een algemene regel in `app/exercise-flow.css` maakte de Alfa C-werkruimte hoogte-afhankelijk van de inhoud. De bestaande paginapanelen bevatten absoluut geplaatste inhoud; daardoor werd hun hoogte nul en was de bronafbeelding niet zichtbaar/aanklikbaar. Uitsluitend deze werkruimtes krijgen hun bestaande beschikbare hoogte terug. Op lage vensters wordt ook de al goedgekeurde compacte terugknopweergave hersteld, zodat formulierlabels en invoervelden bereikbaar blijven. Bestaande stijlregels, kleuren, typografie, iconen, knoppen, inhoud en opslag zijn niet herschreven. Dit is het functionele herstel van de bestaande documentopzet, geen nieuwe indeling.

De eerdere extra audiowachttijd kwam door de indexaanvraag en het ophalen van een volledige bundel vóór afspelen. Bestaande losse bestanden moeten toch blijven bestaan voor hun oude links. De gedeelde speler en Klink+docent gebruiken die daarom weer rechtstreeks. De bouwer registreert afzonderlijk welke nooit eerder gepubliceerde nieuwe opnamen uitsluitend in bundels worden aangeboden; alleen daarvoor wordt de index/bundel geladen. Ook bestaande expliciete byteverwijzingen blijven werken. Annulering, ingetrokken audio, bronidentiteit, afspeeltempo en opruimen van tijdelijke audioadressen blijven beschermd.

De 11.724 verpakte opnamen, 3.897 bundels en 128 indexbestanden uit de vorige stap blijven bytegelijk aanwezig; de bewaarlijst blijft intact. Alle 13.831 oude audio-assets en hun directe links blijven behouden. De bundelstructuur is beschikbaar voor nieuwe korte opnamen; oude bestanden worden niet verwijderd om een besparing te suggereren. De nieuwe leveringsregistratie verandert geen oefeninhoud of voortgangs-ID.

Geen extra Worker, route, R2, afhankelijkheid, betaalde dienst of GitHub Actions toegevoegd. De bestaande gratis statische hosting en lokale waarschuwing bij 18.000/blokkade boven 20.000 bestanden blijven behouden. Hoofdapp: 8.587 bestanden, 11.413 plaatsen vrij. Audiopublicatie: 13.831 bestanden, 6.169 plaatsen vrij. Er zijn geen budgetinstellingen gewijzigd; de volledige accountfactuur is niet onafhankelijk gecontroleerd.

## Gecontroleerd

- Build, TypeScript en lint geslaagd; lint houdt de twee bestaande waarschuwingen in historische diagnosebestanden.
- 13 audio-/bundel-/spelerproeven, 10 statische-publicatieproeven, 49 inhouds-/lesproeven en 7 paneel-/Alfa C-unitproeven geslaagd.
- Alle 144 documentopdrachten gecontroleerd in Chromium en WebKit, op desktop en mobiel, plus aanvullende lage/liggende schermen: 1.200 paneelcontroles geslaagd.
- De volledige woordluisterreeks is nu groen: 44 controles, nul fouten. De eerdere Alfa C-uitzondering is vervangen door verplichte zichtbaarheid en echte hit-testing van afbeelding en woord.
- Aanvullende native Alfa C-proeven toetsen de werkelijke afbeeldingstik, toetsenbordselectie met Alt+W/pijlen/Spatie, afspeeleinde en behoud van voortgang na herladen, ook op kleine/liggende schermen en in licht/donker. Het exacte aantal en de geslaagde resultaten staan in `checks/source-click.json`.
- 16 native audioproeven voor cursist/Klink+docent, beide browserengines en desktop/mobiel: acht directe afspeelgevallen en acht expliciete testgevallen voor uitsluitend gebundelde audio. Voor die laatste gevallen wordt alleen de leveringsregistratie in de testbrowser aangevuld en wordt de losse URL onbereikbaar gemaakt. De daadwerkelijk afgespeelde bytes zijn gelijk aan het oorspronkelijke bestand. Dit zijn testfixtures, geen nieuwe gepubliceerde opnamen.
- Vier echte Alfa C-interactieproeven met native audio, toetsenbord, aanraken en opgeslagen formulierantwoorden; vier aanvullende echte handschrift-/IndexedDB-herlaadproeven. De interactietest wacht nu op de daadwerkelijke knopstatus na een tik, zodat een nog niet afgeronde schermupdate geen schijnfout geeft.
- 40 voor/na-paren van de overige schermen zijn pixelgelijk, in beide browserengines, desktop/mobiel en licht/donker. Deze vergelijking gebruikt 900px hoge vensters; de laatste aanvullende CSS-reparatie geldt uitsluitend tot 700px hoogte. Die lage vensters zijn afzonderlijk volledig gecontroleerd. Geen vaste uiterlijkreferentie gewijzigd.
- Alle 22.418 aangeboden assets bytegelijk teruggelezen op de uiteindelijke lokale proefserver; 25 HTTP-contracten en 39 uitgesloten/onbekende paden gecontroleerd.
- De normale publicatiecontrole blokkeert terecht op de ontbrekende brongebonden publicatievrijgave voor deze nieuwe wijzigingen. Geen publicatiebeveiliging aangepast of omzeild.

De mobiele snelheidsproef gebruikt 3 Mbps, 80 ms gesimuleerde vertraging, uitgeschakelde HTTP-cache en drie metingen per versie. Eerste afspeelstart van het woord **keuken** via de echte cursisteninterface: mediaan **525 → 273 ms**, 48% korter. De ongewijzigde referentie mat 266 ms vóór en 278 ms na de wijziging. Dit is een indicatieve lokale meting van bestaande direct beschikbare audio, geen garantie voor alle opnamen, netwerken of nieuwe bundel-only-audio.

Geen fysieke telefoon/stylus, nieuwe menselijke luisterreview of livebelastingstest uitgevoerd. Alle opnamen en ingebedde metadata zijn ongewijzigd; er is niets opnieuw gegenereerd of gehercodeerd.

## Voorbeelden en reproductie

Werkelijke lokale screenshots staan in `outputs/audio-start-click-repair/source-click/` (onder meer mobiel 390px, desktop 1280px en liggend 740px), met afzonderlijke lage-schermvoorbeelden in `alfa-c-full/`. De volledige bewijzen en testhulpmiddelen staan in `outputs/audio-start-click-repair/`; compacte uitkomsten staan hier in `checks/`.

Normale lokale voorbereiding: `npm run audio:bundle:local`, `npm run build`, `npm run audio:prepare:local`, daarna `KLINK_PREVIEW_PORT=19145 npm run audio:preview:local`. De uiteindelijke gecontroleerde sessie draait geïsoleerd op poort 19155, uit `outputs/audio-start-click-repair/preview/`, om eerdere vergelijkingsservers intact te houden. Alle configuraties zijn lokaal, zonder publieke routes of externe database. Voer builds en muterende bundeltests na elkaar uit.

Het herstelarchief van deze stap bevat alle gewijzigde/nieuwe bronbestanden ten opzichte van de basis, de actuele patch en de nieuwe controlebewijzen. De 4.025 onveranderde mediabundel-/indexbestanden blijven in de vijf eerder volledig geverifieerde Drive-archieven; hun hashes zijn opnieuw vergeleken. Herstel eerst alle vijf eerdere delen op de basischeckout, pak daarna dit opvolgende herstelarchief over dezelfde relatieve paden uit. Bewaar beide generaties. De verwijzingen en hashes staan in `checks/media-backup-preservation.json` en `backup-verified.json` zodra de terugleescontrole is afgerond.

Publicatie blijft een aparte opdracht: dan eerst opnieuw de actuele livebasis bevestigen en de gewone brongebonden vrijgaveketen afronden. Dit verslag is geen publicatiegoedkeuring.
