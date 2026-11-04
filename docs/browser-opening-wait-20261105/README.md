# Resterende wachttijd bij openen — stagingproef 5 november 2026

## Uitkomst en grenzen

De oefenomgeving doet minder dubbel rekenwerk en hergebruikt versiegebonden programmabestanden bij herladen. De gerichte mobiele proef eindigt met **20/20 kandidaat-herlaadbeurten onder één seconde**. Dat bewijst winst in deze proef, niet dat toekomstige netwerk- of browserpieken onmogelijk zijn. Klink+docent blijft functioneren; daar is geen overtuigende aanvullende snelheidswinst aangetoond. De aparte Inzicht-app is niet gewijzigd.

**Productie, main, de bestaande PR8/Inzicht-staging en alle databases blijven ongewijzigd. Geen merge of productiedeploy.**

- Concept-PR: https://github.com/26buckets/taalroute-klink/pull/12
- Kandidaat: https://klink-pr12-candidate.nico-554.workers.dev/#learner
- Controle: https://klink-pr12-baseline.nico-554.workers.dev/#learner
- Actuele main: `b085d626f591342e0be3aa32faa3bfe85342d5e9`.
- Reviewbasis vóór deze taak: `9589290d6975463bffc676e019e9834ced59ca04`; runtime van die eerdere schone stagingbouw: `c266bef2739509be3dc08d606a461fc978d6c759`.
- Rekenreparatie: `7455aa84a96ea419b9defa73e5ca481b65b08c66`.
- Definitieve schone stagingruntime inclusief cachebeleid: `66ee8c5b571dbc4137de8c7588f707dba05dc1f4`.
- Latere commits voegen alleen tests en bewijs toe; beide vooraf gecontroleerde runtimes zijn expliciet vastgelegd in `staging-config.json` en hun releasebestanden.

## Diagnose van de 4,1 seconden

De historische uitschieter was Chromium, 390 px, cursist, herladen: automatische eindmeting 4.105 ms, eerste byte na 47 ms. Er was toen geen resource-/CPU-profiel van die ene aanvraag, dus de precieze verdeling achteraf is niet bewijsbaar.

Nieuwe profielen tonen drie echte rekenkosten: iedere bestaande zin werd voor iedere vergelijking opnieuw getokeniseerd; dezelfde markeeropdracht werd tweemaal opgebouwd; les-, woord- en bronlidmaatschap werd telkens met herhaalde scans bepaald. Het grote oefenbestand is circa 24,67 MB uitgepakt en circa 2,38 MB browseroverdracht. Bij eerste bezoek na de eerdere deployments kostte de download 1,7–2,2 seconden. Bovendien had versiegebonden programmatuur het beleid `max-age=0, must-revalidate`: bij de onderzochte Chromium-herlaadbeurten werd het grote bestand opnieuw gevalideerd, met transferSize 300 en 156–272 ms verzoekduur.

De automatische browsercontrole kan na het werkelijk zichtbare scherm nog wachten op haar volgende controle-interval. In de laatste reeks was dit verschil maximaal circa 0,49 seconde. Daarom zijn zowel de ongewijzigde historische eindmeting (`readyMs`) als een binnen de pagina gemeten moment na twee renderframes (`paintReadyMs`) bewaard. Geen van beide betekent dat alle toekomstige achtergronddownloads klaar zijn; de werkplek is zichtbaar, de loader verdwenen en de volgende hoofdstukklik is gecontroleerd.

## Kleine wijzigingen, inhoud behouden

1. `lib/group-practice.ts`: bestaande kandidaatzinnen één keer splitsen per berekening; dezelfde volgorde, alternatieven en seed blijven behouden.
2. `lib/extended-practice.ts`: hetzelfde zuivere markeerresultaat hergebruiken voor titel en opdracht.
3. `lib/imported-practice.ts`: les-/woord-/bronsets één keer opbouwen binnen een berekening. Geen globale cache: een later gewijzigd pakket wordt opnieuw gelezen. De eerste passende bron en alle bestaande matchregels blijven gelijk.
4. `public/_headers`: uitsluitend `/_next/static/*` krijgt langdurige browsercache. Alle 36 betrokken JS/CSS/font/manifest-URL's bevatten een inhoudshash of build-ID. Gewijzigde builds krijgen andere URL's. Het bestaande afbeeldingenbeleid blijft exact behouden. HTML, releasegegevens, API's, aanmelding en cursistgegevens krijgen geen lange cacheduur.

Er is geen oefenwerk uitgesteld tot de volgende klik, geen inhoud/media geschrapt en geen nieuwe dependency toegevoegd. Loader, vormgeving, routes, antwoorden, lokale voortgang en beveiliging zijn behouden. Het serverpakket blijft circa 6,2 MB en de bestaande grens van 20.000 assets blijft intact.

## Laatste vergelijkbare stagingreeks

64 eerste/herhaalbezoeken, twee browsers (Chromium/WebKit), 1280/390 px, Klink en +Docent, twee onafhankelijke contexten per combinatie en variant, wisselende volgorde. Herhalen is een echte reload in dezelfde context. Verminderde beweging voor vergelijkbare timing, geen CPU- of netwerkvertraging toegevoegd, dezelfde computer en hetzelfde netwerk. Eerste bezoek betekent lege browsercache, niet gegarandeerd een koude Cloudflare-edge. Beide hosts/assets waren ook in de eerdere proef gebruikt; het kandidaatcachebeleid is vooraf met HEAD gecontroleerd. Alle uitschieters en nulwaarden zijn behouden.

| Werkplek en bezoek | n per variant | Automatische meting vóór | Automatische meting na | In pagina klaar vóór | In pagina klaar na |
|---|---:|---:|---:|---:|---:|
| Klink oefenen, eerste bezoek | 8 | 2,31 s | 1,69 s | 1,85 s | 1,51 s |
| Klink oefenen, herladen | 8 | 1,44 s | 0,78 s | 1,17 s | 0,70 s |
| Klink+docent, eerste bezoek | 8 | 1,78 s | 1,65 s | 1,50 s | 1,38 s |
| Klink+docent, herladen | 8 | 0,95 s | 0,96 s | 0,74 s | 0,62 s |

De in-page medianen geven de zuiverste vergelijking van het zichtbare scherm. De oude eindmeting blijft daarnaast staan voor aansluiting op de historische 4,1 s. Bij de cursist daalt de in-page eerste-openingmediaan ongeveer 19% en de herlaadmediaan ongeveer 40%. De gemeten automatische cursistmaxima in deze reeks zijn 2,71 → 2,27 s bij eerste bezoek en 1,95 → 0,82 s bij herladen.

Chromium: mediane som lange taken 483 → 349 ms, langste taak 618 → 363 ms. De volgende hoofdstukklik blijft snel: mediaan 30 → 25 ms (8 per variant). De app wordt dus niet alleen sneller zichtbaar terwijl deze klik extra werk krijgt. Die lange-takenmeting is niet voor WebKit beschikbaar; er wordt geen nul-CPU-claim voor WebKit gedaan.

Bewijs: `staging-measurement/visits.json`, `staging-measurement/summary.json`, `staging-measurement.log`.

## Gerichte herhaalproef van de oorspronkelijke cel

Chromium, 390×900, cursist: twintig onafhankelijke eerste/herhaalcontexten per variant, telkens in wisselende volgorde. Alle 80 bezoeken zijn bewaard, geen retry van voltooide metingen.

- Controle, herladen: mediaan 1,63 s, maximum 1,93 s.
- Kandidaat, herladen: mediaan 0,78 s, maximum 0,99 s; 20/20 onder één seconde.
- Groot oefenbestand uit lokale browsercache bij herladen: controle 0/20, kandidaat 20/20.
- Geen uitschieter boven 4,1 seconden in deze aanvullende reeks, ook niet in de controle. Daarom is afwezigheid van die zeldzame piek op zichzelf geen bewijs van definitieve eliminatie.

Na 20 voltooide bezoeken bleek een testaanname te ruim: een later geprefetchte stylesheet die op het eerste bezoek nog niet binnen was, werd ten onrechte als reeds gecachet verwacht. De app werkte, de controle faalde. Het oorspronkelijke bestand/log is bewaard als `targeted-mobile-reloads-initial.*`. De assertion controleert nu alleen eerder volledig ontvangen bestanden. Alle twintig eerdere bezoeken zijn ongewijzigd behouden; alleen de resterende zestig zijn uitgevoerd. `harnessCorrection` legt dit vast. Dit is geen verwijderde netwerkuitbijter of herhaalde geslaagde proef.

Bewijs: `targeted-mobile-reloads.json`, `targeted-mobile-summary.json`, `targeted-mobile-reloads.log`.

## Eerdere fasen blijven zichtbaar

- Eerste diagnose: `diagnosis/` (12 bezoeken, waarvan vier CPU-profielen); de historische 4,1 s trad daarin niet opnieuw op. Profielmetingen zijn diagnostisch en tellen niet als onbeïnvloede snelheidsvergelijking.
- Alleen rekenreparatie: `compute-only-staging-measurement/`. Hier waren nog eerste-openingspieken van 4,45 s vóór en 3,78 s na. Resource-timings tonen de grote download; deze serie is niet vervangen door de gunstigere laatste reeks.
- Lokale vergelijking: 32 bezoeken en 8 volgende-klikken. Automatische openingsmediaan 1,34 → 1,10 s, herladen 0,95 → 0,82 s. De schone Node-berekening van dezelfde verzamelingen daalt mediaan 707 → 459 ms (7 gepaarde processen per variant).
- `cpu-exploratory-during-build.json` liep tegelijk met een build en is niet gebruikt voor de winstclaim. De latere geïsoleerde reeks staat in `cpu-final-isolated.json`. De oude bronwerkboom voor deze Node-proef heeft exact dezelfde `lib` en `data` als de reviewbasis.
- Een offline compressieverkenning is bewaard in `compression-diagnosis.json`; er is geen afwijkend afleverformaat of aangepaste compressor gepubliceerd. De normale Cloudflare-compressie blijft behouden.
- `diagnosis-after/` bevat aanvullende CPU-profielen op de laatste stagingversie; ook deze zijn diagnostisch.

## Behoud en veiligheid

- 203 volledige oefen-/verzamelingsuitkomsten exact gelijk, inclusief bronkoppelingen, opties, antwoorden, instructies, media en volgorde.
- 1.242 exacte vergelijkingen van bestaande uitgebreide oefeningen plus 9 lege pakketten; 42 gerichte unitcontroles; 8 lege/gewijzigde-pakket-/matchcontroles.
- TypeScript, gerichte lint en gewone productiebuild geslaagd. Geen claim van een volledig schone repo-lint; bestaande brede bevindingen zijn niet opnieuw onderzocht.
- 8 parallel-laadcontroles, 16 laad-/fout-/antwoord-/projectiecontroles, 4 handleidingflows, 8 loader/navigatie/opslagflows en 44 audiocontroles geslaagd.
- 24 pixelgelijke schermparen desktop/mobiel, licht/donker, Chromium/WebKit op de rekenreparatie. De daaropvolgende cachewijziging verandert geen JS-/CSS-/UI-bron; de volledige stagingmatrix controleert beide browsers opnieuw.
- 20.104 openbare bestanden exact behouden. Alleen release-provenance en het apart volledig gecontroleerde `_headers`-beleid zijn uitgezonderd; geen audio-/beeldwijziging.
- 18 extra stagingverzoeken: HTML, RSC, query's, bestaande handleidingroutes, HEAD, 404 en oude opslag-API's (410). 36 versiegebonden cache-URL's gecontroleerd; HTML, release en API blijven buiten langdurige cache.
- Alle nieuwe stagingbezoeken gebruiken synthetische/lege browserstaat. Geen echte cursistgegevens, SQL, D1-bindingen, accounts of gedeelde leerdercaches toegevoegd.

Afgestemd met ‘KLINK: IMPLEMENTEREN’ en ‘Zet Klink-chats online’. Geen wijzigingen aan hun actieve werkbomen, spelers, teacher-classroom/CSS of schrijf-/spellingcontent. De 50 dictees blijven onder hun bestaande HOLD. Alleen de eigen PR12-branch en de twee afgesproken PR12-testhosts gebruikt.

Cloudflare-deploymenthistorie vóór/na is identiek voor Klink-productie, Inzicht-productie en PR8-staging. Het productie-releasebestand is bytegelijk; live Klink-bron blijft `dc37a479a7a6f148d61ffb5140dfd79112331f85`. Bewijs in `preservation-before/after.json` en `production-release-before/after.json`. Laatste stagingbron is via het werkelijk aangeboden releasebestand teruggelezen.

Geen GitHub Actions-workflows op gecontroleerde main/PR12, geen zware cloudtests, geen gewijzigd budget. Alles lokaal uitgevoerd; alleen gerichte stagingdeploys en leescontroles naar Cloudflare.

## Nog open

Een lege browsercache moet nog ongeveer 2,38 MB voor het grote oefenbestand downloaden. Een nieuw netwerk, trage verbinding, cacheverwijdering, browserbelasting of koude edge kan dus nog een langere eerste opening geven. De exacte oorzaak van de ene historische 4,1 s is niet met terugwerkende kracht vastgesteld; de huidige reken- en cachekosten zijn wel rechtstreeks aangetoond en verbeterd.

Geen tweede fysiek netwerk, echte telefoon, langdurige belastingproef of aparte Inzicht-MFA/databaseproef uitgevoerd. Mobiel betekent een smalle viewport. Publicatie vereist een aparte concrete opdracht, afstemming en hercontrole van de dan actuele livebasis. De publicatiepoort blijft intact.

Herstelback-up hoort in de bestaande projectmap: https://drive.google.com/drive/folders/1DpH2ChwgYsST5Tv_Dlf64ej-sn2rCjlF . De uiteindelijke PR-status bevat de gecontroleerde ZIP-link en checksum.
