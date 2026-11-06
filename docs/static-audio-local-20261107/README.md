# Gratis statische audio — alleen lokaal, 7 november 2026

Opdracht: een gratis statische audio-oplossing vanaf de actuele livebasis uitwerken, de proefserver herstellen en lokaal behoud controleren. Geen publicatie.

## Basis en resultaat

Livebron bij begin en eind: `8d73a0bda6ba3d13344f319e6863f6f74acb69c3` (release van 6 november 17:45:24 UTC). Canonieke main: `a503cc2ccdde2f29aae87afa5700ae8a015c73e7`; tussen beide uitsluitend publicatiebewijs/documentatie, geen runtimewijziging. Werkbranch: `codex/free-static-audio-20261107`.

De huidige 18.393 aangeboden bestanden worden lokaal verdeeld in 4.562 appbestanden en 13.831 statische audiobestanden. Bij de gratis grens van 20.000 per Worker blijven respectievelijk 15.438 en 6.169 plaatsen vrij. Dit bespaart bestandsplaatsen in de app, geen geluidskwaliteit of inhoud. Audio bevat 13.759 losse opnamen en 72 bestaande bundels. Geen bronbestand wordt verwijderd, hernoemd of gehercodeerd; ingebedde metadata blijven bytegelijk.

`/package-audio/*` gaat in de lokale proef naar een tweede asset-only configuratie, zonder Worker-script, R2, database of proxy in de cloud. Alle andere routes blijven bij de ongewijzigde app. Volledige audiopaden blijven bestaan, inclusief bestaande bundels. Het browseradres en de opslag-oorsprong veranderen niet. De lokale gateway is uitsluitend een simulatie van Cloudflare-routering; hij wordt niet gepubliceerd.

## Lokaal gebruiken

Vanaf deze branch, met de bestaande projectdependencies en voor browsercontroles een beschikbare Playwright-installatie:

1. `npm run build`
2. `npm run audio:prepare:local`
3. `npm run audio:preview:local`
4. Open `http://127.0.0.1:19135`.
5. `npm run test:static-audio`; voor HTTP-vergelijking tevens de ongewijzigde basis lokaal op poort 19134 en `npm run test:static-audio:http`.

De voorbereider leest standaard `dist`; een andere bestaande build kan als argument mee. Hij schrijft uitsluitend naar `outputs/static-audio-local`, met behoud van `dist`. Hij controleert de oorspronkelijke publicatie-uitsluitingen, hashes, 20.000-bestandsgrens, waarschuwing vanaf 18.000 en 25 MiB per bestand. Een bestaand doel wordt alleen vervangen met de eigen `LOCAL-ONLY`-markering. Beide configuraties hebben geen live routes. De preview bindt uitsluitend aan localhost en gebruikt lokale opslag.

De proefserver gebruikt de reeds geïnstalleerde Wrangler-API, lokale polling en geen inspector. Zonder polling mislukte starten met de grote macOS-bestandsboom; de eerdere inspectorproef liep bij zware belasting uit geheugen. De herstelde server doorstaat de volledige belasting. Geen nieuwe dependencies, geen ruimere geheugenlimiet, geen wijzigingen in productiecode.

## Werkelijk gecontroleerd

- Gewone productiebuild geslaagd; oorspronkelijke waarschuwing bij 18.393/20.000 blijft werken.
- 10 unit-/regressietests geslaagd, waaronder uitsluitingen, paden, behoud van bron, maximale bestandsgrootte, veilige doelmap en bestaande oefenbundels/Worker-routering.
- Zowel een kopie van de exacte livebuild als een verse build: alle 18.393 aangeboden bestanden via HTTP opgehaald en SHA-256/omvang gecontroleerd. Nul verschillen met hun bron.
- 25 HTTP-contractvergelijkingen voor MP3/WAV/M4A/bundel/grootste bestand: HEAD, Range, suffix, query en eigen ETag/304. ETag-waarden mogen tussen builds veranderen; cachegedrag en bytes blijven behouden. Statische Range-antwoorden blijven 200 zoals de basis, zonder nieuwe betaalde Worker-afhandeling.
- 39 ingetrokken/onbekende audioadressen blijven 404.
- Verse build: 4.312 aanvragen met 24 gelijktijdige verbindingen, 48 afbreekpogingen en 24 herstelverzoeken geslaagd. Ook vóór de verse build geslaagd.
- 203 volledige inhouds-/collectievergelijkingen met apart uit de ongewijzigde actuele main vastgelegde bron. Daarnaast 1.242 bestaande inhoudsvergelijkingen en 9 lege-pakketcontroles geslaagd.
- Chromium en WebKit: opslag over tabbladen, daadwerkelijke schrijfraces en rondewijzigingen geslaagd; antwoorden en voortgang behouden.
- Acht desktop/mobiel Klink/+docent-scenario's: stille knoppen, werkende bediening en echte woord-/luisteraudio tot einde geslaagd. Zes aanvullende native MP3/WAV/M4A-decoderingen geslaagd.
- Acht actuele muis/Enter-oefenstromen geslaagd: verkeerde antwoorden, ingedrukte Enter, dialogen, focusverlies en opgeslagen gegevens. Geen toetsenbordcode gewijzigd.
- Twee beperkte-netwerkproeven: Help blijft stil zonder audio-download; PR12/snelheidsherstel behouden.
- 40 schermparen: Chromium/WebKit, 1280/390, licht/donker, start/cursist/docent/lijst/oefening. 39 direct pixelgelijk. Eén lijstverschil van 10 pixels verdween in de gerichte herhaling met 500 ms stabilisatie; die herhaling volledig pixelgelijk. Geen vormgevingsreferentie bijgewerkt.
- Gerichte codecontrole en `git diff --check` geslaagd. App-, inhouds-, media-, voortgangs-, Worker- en stijlsources ongewijzigd.

## Eerlijke grenzen en oude controles

De algemene lintcontrole heeft 11 reeds bestaande fouten in andere hulpscripts; dezelfde fouten zijn op ongewijzigde main vastgesteld. De vijf geraakte scripts zijn groen. Dit werk noemt de hele repository dus niet lint-vrij.

Enkele historische tests passen niet bij de huidige liveversie: de inhoudsfixture van een oudere release wijkt af (vervangen voor deze vergelijking door een apart vastgelegde actuele basis, historische fixture intact); twee oude toetsenbordtests falen identiek op de ongewijzigde basis en de kandidaat; zes vroeger ingetrokken oefenlinks zijn inmiddels gepubliceerd en leveren op beide versies dezelfde 200/bytes. Deze resultaten zijn bewaard, niet als geslaagd geboekt. Actuele Enter-/opslag-/audio-/inhoudscontroles hierboven zijn wel geslaagd.

De gewone publicatiepoort is uitgevoerd en blokkeert deze ongecommitteerde ontwikkelbranch/gewijzigde bronbindingen zoals bedoeld. Geen vrijgavegegevens aangepast, geen poort omzeild. Dit is geen publicatievrijgave. Geen fysieke telefoon of menselijke luisterreview; browseremulatie en echte technische playback wel uitgevoerd.

## €0 en latere publicatie

Cloudflare documenteert statische assetverzoeken als gratis/onbeperkt en assetopslag zonder extra kosten. Deze oplossing gebruikt die categorie, zonder R2 of nieuw betaald abonnement, en zonder `run_worker_first` voor audio. Geen cloudresources, routes, betalingen, GitHub Actions of publicaties zijn uitgevoerd. De bestaande accountfactuur/abonnementsstatus is niet met beschikbare rechten vastgesteld; er wordt geen uitspraak gedaan over een eventueel reeds bestaand abonnement.

Bronnen gecontroleerd 7 november 2026:
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/configuration/routing/routes/

Een latere expliciete publicatieopdracht moet eerst de dan actuele livebasis en het €0-accountbeleid controleren, de twee artefacten via de bestaande publicatiepoort vastleggen en de specifieke route `klink.taalroute.nl/package-audio/*` bevestigen. Eerst audio gereed en teruggelezen, dan routering gecontroleerd, pas daarna audio uit de apppublicatie weglaten. Bij terugval eerst de volledige app herstellen, daarna de audioroute verwijderen. Zo bestaat geen moment waarop oude links zonder bron zitten. De echte Cloudflare-routeprioriteit kan zonder publicatie niet lokaal bewezen worden. De normale `npm run deploy` is bewust ongewijzigd en publiceert deze splitsing dus niet per ongeluk.

Bewijs en reproducerende proefscripts staan in `outputs/static-audio-20261107` en in de gecontroleerde projectback-up. Bestaande media zijn niet gedupliceerd naar een nieuwe clouddienst; hun hashes en de exacte broncommits zijn vastgelegd.
