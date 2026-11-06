# Klink: actuele livebasis en resterende openingstijd — 6 november 2026

Alleen staging en review. Deze taak heeft niets naar productie gepubliceerd, geen main-push gedaan en geen D1 gewijzigd. De parallel gepubliceerde timeoutreparatie is behouden.

## Actuele basis en eindresultaat

- Productie: `7e87eca15c1e5d63fe2b68d6623d9cce0334bce2`, gebouwd 2026-11-06T12:42:36.045Z.
- Canonieke main: `78d139ae947e6a46dc3a0a06d4fc5c74fce2786d`, uitsluitend documentatie na die runtime. Beide geïntegreerd; nieuwe oefenindeling, Help, focusreparaties en 50 goedgekeurde woordvragen blijven behouden.
- Schone stagingruntime: `59976d9e6c8f3a163af43794a7e0ee2a978dd7cc`; Worker `ac93456e-0aa5-4dad-b896-0eea341ef31b`.
- [Klink staging](https://klink-pr12-candidate.nico-554.workers.dev/#learner) en [Klink+docent staging](https://klink-pr12-candidate.nico-554.workers.dev/#teacher/plus).
- [Controlehost](https://klink-pr12-baseline.nico-554.workers.dev/#learner): `6b112ca1e91b688898bd7726c0967ec2d445f8f5`, Worker `57989bc8-e780-4b82-8508-3e760dbbfaa7`. De uiteindelijke kandidaat heeft dezelfde runtime als deze controle: het extra voorladen is verworpen.
- Beide staginghosts hebben uitsluitend assets/proefmetadata, geen D1, secrets of productieroutes. Inzicht/PR8-uitrol niet gewijzigd; geen nieuwe Inzicht-prestatieclaim.

## Gemeten winst van het volledige bestaande PR12-voorstel

16 bezoeken: vier per versie en portaal, afwisselende volgorde, verse Chromium-contexten, breedtes 1280 en 390. Nagebootst 3 Mbps download, 1 Mbps upload, 40 ms toegevoegde vertraging, geen CPU-vertraging. Geen fysieke telefoon of echt mobiel netwerk. De tijd begint vóór navigatie en eindigt na de laatste klik, met zichtbare afbeeldingen gedecodeerd en lettertypen klaar. Geen verzonnen leestijd tussen klikken. Dezelfde oefening/foto vergeleken; echte oefenaudio daarna volledig afgespeeld.

| Onderdeel | Huidige productie | Staging | Verschil |
|---|---:|---:|---:|
| Klink eerste volledige oefening, mediaan | 14,01 s | 8,08 s | −5,93 s / −42% |
| Klink+docent eerste volledige les, mediaan | 15,40 s | 11,03 s | −4,37 s / −28% |
| Klink voltooide overdracht bij gereedheid | 3,56 MB | 2,54 MB | −1,02 MB |
| Klink+docent voltooide overdracht bij gereedheid | 3,99 MB | 2,98 MB | −1,01 MB |

Dit bevestigt het bestaande PR12-pakket op de nieuwste livebasis. Het is geen extra winst van de nieuwe voorlaadproef: die is verwijderd. De productieroute en stagingroute hebben verschillende hosts/Worker-configuraties; cijfers zijn deze gemeten eind-tot-eindvergelijking, geen geïsoleerd causaal effect van één regel code. Vier waarnemingen per cel is een kleine steekproef, geen percentielgarantie. Ruwe data en condities: `delivery/vs-production/visits.json`, samenvatting `delivery/summary.json`.

Klink staging varieerde 7,28–8,75 s; productie 11,43–15,56 s. Docent staging 10,97–11,20 s; productie 14,83–17,47 s. Netwerkpieken zijn niet bewezen verdwenen. De laatste Klink-klik inclusief foto duurt circa 1,06 s versus 0,57 s op productie: uitgesteld laden verplaatst dus een deel van de wachttijd naar die klik, maar de totale gemeten opening blijft circa zes seconden korter. Bij docent is de laatste klik ongeveer gelijk (3,34 s).

## Wat deze iteratie heeft gedaan en verworpen

De eerdere portaal-/databank-/spelersplitsing, compacte woordenbank, uitgestelde Alfa C-audiolijsten en voorbereide Brotli-bestanden zijn opnieuw geïntegreerd. De nieuwe gedeelde oefenindeling en nieuwste Worker-timeoutreparatie zijn behouden. De stagingadapter behoudt nu ook de overige exporthooks van de app. De meetscriptopties ondersteunen een docent-only proef en read-only vergelijking met actuele productie.

Vroeg voorladen leek aanvankelijk circa 0,2 s te helpen. Na herhaling op de nieuwste basis waren slechts vier van acht leerlingparen sneller; de eerste docentvariant werd circa 0,75 s trager. Daarom is de volledige helper verwijderd. Er is geen nieuwe speculatieve aanvraag in het eindresultaat. Een generieke JSON-verpakking en groter Brotli-venster leverden offline geen zinvolle aanvullende winst en zijn niet toegepast. Onder `latest/` staan de afgewezen voorlaadproef en hercontrole; uitsluitend `delivery/` is de eindmeting. Oudere mappen bewaren tussenstappen en mogen niet als eindversie worden gelezen.

De resterende circa acht seconden zijn nog open. Circa 2,54 MB bij 3 Mbps vraagt rekenkundig al ongeveer 6,8 s overdracht, los van pagina-/netwerkwachttijd en afhankelijkheden. Een volgende gerichte stap is minder gegevens nodig hebben vóór de eerste oefening; de grote route-/bron-/woordenbanken zijn vastgelegd in `module-sizes.json`. Geen inhoud of beeldkwaliteit is opgeofferd om dit getal te drukken.

## Afbeeldingen en serverkosten

De vorige gecontroleerde beeldinventaris blijft geldig omdat `public`-media byte-identiek zijn aan actuele main: de eerste oefenfoto is WebP, 31.162 bytes, 640×640; lijstfoto's circa 9–74 kB. Dat zijn al compacte bestanden. Het grootste resterende pakket bestaat uit code en gegevens, niet deze ene foto. Compressie bewijst geen gegarandeerd snelle hele pagina; aantallen, afhankelijkheden en verbinding blijven meetellen. Broninventaris: `docs/eight-seconds-20261105/images.json`.

Het bestaande compressievoorstel bedient vier bestaande JS-URL's via de Worker. Het voegt geen extra browserdownloadrondes toe, maar wel vier Worker-uitvoeringen per koud bezoek tegenover statische afhandeling. Eindcontrole op beide portalen: vier koud, nul warm voor deze bestanden; geen voorlaadhelper (`delivery/cache.json`). Geen compressie tijdens het verzoek en geen databasequery. Andere pagina-aanvragen zijn hiermee niet uitgesloten. Voltooide resources bij gereedheid zijn geen telling van alle mogelijke achtergrondaanvragen.

Volgens [Cloudflare static-assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) zijn statische aanvragen gratis en telt Worker-uitvoering mee; `run_worker_first` activeert die uitvoering. De werkelijke abonnementsruimte/kosten konden niet worden vastgesteld. Geen budget, abonnement of betaalde dienst gewijzigd. Voor deze iteratie geen nieuwe afhankelijkheid; het eerdere PR12-pakket bevat al `@vinext/cloudflare`.

## Behoud en controles

- 203 volledige gegenereerde oefen-/collectievergelijkingen met de ongewijzigde livebron; alle 50 goedgekeurde vragen in negen banken exact teruggelezen uit de gebouwde server.
- Data en publieke media gelijk aan huidige main; `worker.ts` exact gelijk aan de nieuwste live-timeoutreparatie. 18.393 assets; eind-CSS byte-identiek aan de controlebuild. Definitieve runtime gelijk aan controle zonder voorlaadhelper.
- Nieuwe oefenindeling: 24 stromen in Chromium/WebKit en vier afmetingen, inclusief bediening, pauze, voortgang en auto-verder. Opslagcontrole in beide engines, inclusief twee tabbladen, herladen en gewijzigde rondegrootte. Echte Chrome-audio en fullscreen gecontroleerd.
- Hoofdschermen: 32 paren desktop/mobiel, licht/donker, Chromium/WebKit. Eén initiële 14-pixelafwijking verdween na expliciete beelddecodering; hercontrole nul verschil. Spelerschermen: 24 paren, 22 exact; twee paren hadden drie hoekpixels verschil, visueel bekeken. Geen volledige pixelidentiteit voor die twee geclaimd.
- Laatste lokale unitrun: 10/10, inclusief bundelintegriteit, oude URL's, ranges, corruptie, geannuleerde verzoeken, app-handlerisolatie, compactie-roundtrip en stagingguard. TypeScript en schone build geslaagd.
- Lokale stresstest op de geïntegreerde nieuwste Worker: 4.312 aanvragen, 24 verbindingen, 48 annuleringen, 24 herstelverzoeken, nul fouten; p95 circa 64 ms. Dit is lokale servercapaciteit, geen bewijs over het publieke netwerk. Daarna uitsluitend speculatieve clienthelper verwijderd; servercode bleef gelijk.
- Zware controles lokaal. Geen workflows in geïnspecteerde main of head; geen nieuwe workflows, zware Actions-runs of budgetwijziging.

## Open punten vóór eventuele publicatie

1. Geen toestemming voor productie in deze opdracht. Normale publicatiecontrole opnieuw op de dan actuele canonieke main; de bestaande allowlist accepteert dit gecombineerde PR12-pakket nog niet. Geen guard versoepeld of omzeild.
2. Geen bewezen aanvullende daling onder circa acht seconden; geen garantie dat netwerkpieken weg zijn. Fysieke telefoon en werkelijke trage verbinding nog niet getest.
3. Bestaande Alfa C-testbevinding: de knop “Naar de opdracht” is in de eerste dagles bij 1280×720 en versnelde gesimuleerde audio niet klikbaar door overlap. Zowel ongewijzigde livebron als kandidaat reproduceren dit. Gemeld aan de chat voor de oefenindeling; niet als snelheidsregressie vastgesteld. De volledige oude 288-casusrun is op deze basis niet geslaagd en wordt niet zo gerapporteerd. Bewijs: `alfa-baseline-check.json`.
4. Werkelijke Cloudflare-kostenruimte nog niet bevestigd. Geen kosteloosclaim.
5. GitHub PR12-metadata en pull-ref bleven tijdens inspectie achter op de echte featurebranch. Gebruik het geverifieerde actuele commit-/branchadres voor review; geen merge bij een verouderd PR-overzicht. Controle na push volgt in opleverreceipt.

Afstemming: chats voor oefenindeling, implementatie, 50 dictees en codekwaliteits-/timeoutwerk rechtstreeks geïnformeerd. Geen dubbel ontwerp of parallelle productie-uitrol gestart. Bronpatch, Git-herstelbundle, meetdata, logs en screenshots worden in de bestaande Drive-projectmap geback-upt en teruggelezen. De opleverreceipt bevat de actuele links en hashes.
