# Klink — lokale samenvoeging en controles

De zelfstandige grammaticaoefeningen zijn samengevoegd met de werkelijk aangeboden livebron **0c130f80** van 1 november 2026. De livebron is via release.json teruggelezen. De eerdere bron be7d7828 is tijdens het werk opgevolgd door de goedgekeurde laadschermcorrectie; ook die zit in deze lokale versie. Lokale bron: `b51dff3809b3f7ae6dfac2653def13101977ba2c`.

## Wat behouden is

- Zelf oefenen is de hoofdroute; docenthulp blijft optioneel. De bestaande A1/A2-oefeningen en de 18 lokale Alfa A/B/C- en B1-oefeningen blijven aan hun lessen gekoppeld. De B1-les is nog een lesvoorstel.
- De rustige instructieopmaak, luisterknop links en aanklikbare woorden zonder extra audio-iconen blijven staan. De nieuwste schrijfbank, antwoordherstel, kaarttitels en muis-/pijl-/spatiebediening zijn meegenomen.
- De 18 oefenteksten en antwoorden zijn ongewijzigd. Alleen hun ontbrekende koppeling aan bestaande leerdoelen is toegevoegd: zinnen begrijpen, plaatswoorden, werkwoorden en passende B1-zinsdoelen. Geen nieuw leerdoelenregister.
- De bestaande publicatiebeveiliging en historische bronafspraken blijven actief. Er is niets gepusht of gepubliceerd; geen productiebatch, import of GitHub Actions-run.

## Uitgevoerde controles

| Controle | Uitkomst |
|---|---|
| Bron, antwoorden, routes, doelen en beveiliging | 82 geslaagd |
| Nieuwe grammatica in Chromium/WebKit, mobiel/desktop, licht/donker | 60 geslaagd |
| Aanvullende lesingangen, B1-toetsbediening en ontbrekende-audioblokkade | 12 + 2 geslaagd |
| Bestaande A1/A2-grammatica | 36 geslaagd |
| Schrijftaken, indeling en sessieherstel | 32 + 8 + 8 geslaagd |
| Korte leestitels en hervatten | 24 + 8 geslaagd |
| Gemengde muis-/toetsbediening | 8 + 4 met echte audio geslaagd |
| Instructiepanelen | 12 geslaagd, 320/390/1366 px |
| Startscherm tegenover de nieuwste livebron | 4 pixelgelijke vergelijkingen |
| Laatste laadschermcorrectie | 16 geslaagd |
| Typecontrole en productieopbouw | Geslaagd |
| Gewone volledige publicatiecontrole | Alleen de twee bedoelde lokale blokkades |

Alle 131 woordvormen van de 18 lokale oefeningen hebben een gekoppeld en aanwezig bestand. De gebruikte volledige Alfa A/B-zinsopnamen zijn werkelijk afgespeeld in beide browserengines. Alle 1.979 bestaande gekoppelde audiobestanden in de metadatacontrole slagen. Dit is geen nieuwe menselijke uitspraakgoedkeuring.

De uitgebreide grammatica-, schrijf-, titel- en toetsenreeksen zijn op de samengevoegde be7d-basis uitgevoerd. Daarna kwam uitsluitend de twee bestanden van het live-laadscherm bij de runtime. Vervolgens zijn de laadschermreeks, alle bronproeven, de volledige publicatiepoort, productieopbouw en vier actuele schermvergelijkingen opnieuw uitgevoerd.

## Open vóór publicatie

De brede repository-lintcontrole is **niet volledig groen**: 443 meldingen blijven over, tegenover 498 in de nieuwste livebron. Er zijn geen nieuwe meldingen door deze integratie. Het gaat vooral om bestaande tests/historische controles en vier bestaande verouderingsmeldingen bij afbeeldingscomponenten. Die zijn niet stilzwijgend uitgeschakeld of als geslaagd gemeld.

Verder blijven de 19 eerder geïnventariseerde ontbrekende woordopnamen in ouder A1/A2-materiaal en volledige zinsaudio voor Alfa C/B1 open. Geen nieuwe fysieke telefoon-, screenreader-, NT2- of menselijke luistercontrole uitgevoerd. De lokale oefenreeks is geen volledige methode of volledige dekking per niveau.

Publicatie vraagt een aparte concrete opdracht, een nieuwe controle van de dan geldende livebasis en brongebonden vrijgave van de lokale inhoud/audio. De huidige toestemming voor lokale integratie geeft geen publicatierecht.

## Inzien en herstel

De lokale app blijft op `http://127.0.0.1:18984`. Open `Open-oefeningen.html` voor de eerder uitgewerkte lesingangen. Screenshots en machineleesbare resultaten staan in de submappen; `controle.json` bevat bronversies en grenzen. De bronbundle en herstelarchief zijn lokale herstelbestanden, geen productie-invoer.

De herstelkopie staat in de bestaande Google Drive-projectmap en is volledig teruggelezen: [bron, media en controlebewijzen](https://drive.google.com/file/d/1kjoAtgwM-wNBCE319BuLDsMN-E_tgyye/view). De volledige ZIP en alle 147 onderdelen zijn op bestandsvingerafdruk gecontroleerd. Dit is uitsluitend een back-up; de app is niet gepubliceerd. Zie ook backup-controle.json.
