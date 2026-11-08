# Gratis statische audio bijgewerkt — 8 november 2026

Alleen lokaal. Geen publicatie, push, Cloudflare-routewijziging, nieuwe dienst of GitHub Actions-run.

## Actuele basis

Livebron opnieuw gecontroleerd: `693b58c192cc1a480c5ac5266f102933aa8c4b3d`, release van 7 november 2026, 00:45:53 UTC. Remote main: `98568bd3543e056a38f9427b5c331a8f7cf793d0`, uitsluitend een bewijsopvolger van die liveversie. Deze main is opgenomen in `codex/free-static-audio-20261107`, met behoud van de bestaande lokale audio-oplossing. De compacte oefenfooter en vaste mobiele Verder-knop zijn dus aanwezig.

Geen eigen wijziging in app-, component-, stijl-, inhouds-, media-, opslag- of Worker-code tegenover de actuele main. De goedgekeurde vormgevingsvloer en vrijgavebestanden zijn ongewijzigd.

## Herstelde controlefouten

De eerder genoemde 11 lintfouten waren door de recentere publicatiecontrole inmiddels 13 meldingen. Alle 13 zijn opgelost in zeven bestaande hulpscripts, met 14 regels vervangen door 14 regels:

- Controle van voorbereide inhoud gebruikt de waarden uit `Object.entries`, met exact dezelfde controles van velden, volgorde, audio en herkomst.
- De Help-netwerkproef doorloopt tekstknooppunten met een gewone lus.
- De lokale compressievoorbereider gebruikt een andere variabelenaam; het uitvoerveld `module` en de bestanden blijven identiek.
- Sorteerfuncties vergelijken tekenreeksen expliciet in dezelfde UTF-16-volgorde als de oorspronkelijke standaardsortering.
- Alfa C-testgevallen gebruiken benoemde velden, zodat soort, inhoud en opslagsleutel correct worden afgeleid.
- De browserproef bewaart de oorspronkelijke audiomethode via haar eigenschapsdescriptor; echte afspeelwerking wordt daarna exact hersteld.

Geen lintregel uitgezet, geen controlegeval geschrapt en geen publicatiebeveiliging verruimd. De algemene lintcontrole eindigt met nul fouten; TypeScript en productiebuild slagen. De eerste lintuitvoer vermeldde ook twee bestaande waarschuwingen in historische staging-documenten; die bronnen zijn niet gewijzigd.

## Statische verdeling en €0-grens

Het gebouwde totaal blijft 18.393 bestanden: 4.562 bij de app en 13.831 bij statische audio. Dat laat 15.438 en 6.169 plaatsen vrij bij een grens van 20.000 per afzonderlijke publicatie. Alle 13.831 audio-opnamen/bundels zijn bytegelijk aan de actuele basis; opnamen en ingebedde metadata zijn niet gewijzigd.

De aparte audio-configuratie bevat alleen assets, geen Worker-script, R2, betaalde proxy of nieuwe database. Bestaande `/package-audio/*`-adressen blijven gelijk. De lokale gateway simuleert uitsluitend de latere routering; de normale publicatieroute is ongewijzigd. Er is geen betaald onderdeel geactiveerd en geen accountbudget gewijzigd. De eerder onderzochte gratis statische assetcategorie blijft de gekozen oplossing; een eventueel bestaand accountabonnement is niet als €0 geverifieerd.

Voorbereiden: `npm run build`, `npm run audio:prepare:local`, `npm run audio:preview:local`. De proef staat op `http://127.0.0.1:19135`. Oude build/bronbestanden blijven intact. De herstelde lokale server blijft polling gebruiken en schakelt de debug-inspector uit.

## Uitgevoerde controles

Alle onderstaande proeven zijn lokaal uitgevoerd:

- Volledige build, algemene lintcontrole, TypeScript en diffcontrole geslaagd.
- Tien unit-/regressietests voor splitsing, bestandsgrootte/-limiet, uitsluitingen, veilige doelmap, oefenbundels en openbare Worker-afhandeling geslaagd.
- Alle 18.393 aangeboden bestanden via HTTP opgehaald en exact tegen de kandidaatbron gecontroleerd; 25 HTTP-contracten vergeleken met de actuele basis; 39 uitgesloten/onbekende audioadressen blijven 404.
- 18.371 gedeelde bestanden exact gelijk aan de actuele buildbasis, waaronder alle 13.831 audio-assets. Alleen interne gegenereerde buildnamen, manifests en release-identificatie verschillen. Alle oorspronkelijke app-/inhoudsbronnen en inhoudskenmerken in release.json zijn gelijk.
- 4.312 aanvragen bij 24 gelijktijdige verbindingen, 48 afbreekpogingen en 24 herstelverzoeken geslaagd.
- 203 complete inhouds-/collectievergelijkingen met een aparte snapshot uit de actuele main; 1.242 bestaande inhoudsvergelijkingen en negen lege-pakketcontroles geslaagd.
- De gewijzigde controle voor voorbereide inhoud slaagt inclusief negatieve invoerproeven; de twee samengestelde gegevensbanken slagen in beide browsers op twaalf volledige bronhashes en ongewijzigde CSS-declaraties.
- Opslagbehoud in Chromium en WebKit geslaagd, inclusief tabbladen, schrijfraces en gewijzigde rondeomvang.
- Acht Klink/Klink+docent desktop-/mobiele audioscenario's, echte audio tot einde, acht Enter-/focusstromen, zes native audiodecoderingen en twee Help-proeven op beperkt netwerk geslaagd.
- De actuele mobiele Verder-reeks slaagt op 22 situaties in Chromium/WebKit, 320/390/1366 px, inclusief gesimuleerde toetsenbordruimte, verschuiven, sluiten en aantikken.
- Veertig schermparen voor start, cursist, docent, lijst en oefening op desktop/mobiel in licht/donker. 38 direct pixelgelijk. Twee minieme rasterverschillen (12 en 3 pixels) gericht onderzocht: lijst bij herhaling exact, oefening bij een tussenherhaling negen pixels met één kleurstap aan kaartranden. De laatste onafhankelijke diagnose toont dezelfde geometrie, teksten en stijlen en volledig pixelgelijke basis/basis/kandidaatbeelden. Geen referentie of appstijl aangepast.
- De gewijzigde publicatiecontrole is als testmodule tegen de ongewijzigde canonieke bron uitgevoerd: 94 bron-, toestemming-, bewijs- en herstelmutaties terecht geweigerd. De feitelijke publicatiepoort van deze ontwikkelbranch blijft blokkeren, zoals bedoeld; geen nieuwe publicatievrijgave gemaakt.
- De gewijzigde historische compressievoorbereider is uitsluitend in een tijdelijke lokale map getest: vier exacte compressie/decompressierondes en vijf productie-/verkeerde-hostweigeringen geslaagd. De compressiewrapper is niet gebruikt in app of audio-oplossing.

De aanvullende Alfa C-audioreeks is volledig geslaagd: **288 hervatte dagelijkse/functionele situaties in Chromium en WebKit**, zonder browserfouten. Zie `result.json` en de ruwe logs in de back-up.

## Bestaand aandachtspunt, niet verhuld

De oorspronkelijke Alfa C-muistest loopt bij `LES-01` tegen een balk die de knop ‘Naar de opdracht’ overlapt. Dit is afzonderlijk gereproduceerd op zowel kandidaat als ongewijzigde actuele livebasis; geen regressie door de audioverdeling of lintreparatie. De oorspronkelijke test en foutlogs zijn bewaard. De aanvullende volledige audioreeks gebruikt echte toetsenbordactivering van de bestaande knoppen; dat bewijst audiokoppelingen en hervatten, niet dat de muisoverlap is hersteld. Geen wijziging van het vastgezette uiterlijk uitgevoerd.

Geen fysieke telefoonproef of nieuwe menselijke luisterreview. Browseremulatie, echte technische playback en bytebehoud zijn wel uitgevoerd. De echte Cloudflare-routering is nog niet aangelegd of live gecontroleerd. Een latere publicatie vereist de dan actuele basis, een opvolgende concrete vrijgave en terugleescontrole via de normale route; deze lokale opdracht publiceert niets.

Zie `result.json` voor samenvatting, `backup.json` voor de volledig teruggelezen projectback-up. De historische uitwerking van 7 november blijft bewaard in `docs/static-audio-local-20261107/`.
