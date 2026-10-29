# Klink-contentimport — contract v1

Status op 28 oktober 2026: technische basis lokaal getest; geen echte productiebatch geïmporteerd, geen livewijziging. De bestaande spelers, routes, media, voortgang en publicatiepoort blijven de uitvoeringsbasis.

## Start met uitsluitend een batchcode

1. Lees het centrale `production-register.json` uit de Drive-map **Integratie en publicatie / 01 Productieregister en batches**. Gebruik `locate` om exact één actieve versie te vinden. Geen overeenkomst of meerdere actieve versies betekent stoppen en het conflict registreren; kies nooit op bestandsdatum of gelijkende titel.
2. Haal het manifest op via `manifestDriveFileId`; vergelijk de werkelijke bestandshash met `manifestSha256` in het register. Lees metadata en download elk genoemd bestand met de verbonden Google Drive-tool, behoud de bytes onder het opgegeven `files/`-pad en controleer de hash. Leg de daadwerkelijke Drive-ID, wijzigingsversie, ontvangsttijd en SHA256 vast. Een naam of downloadlink alleen bewijst geen ontvangst. Native Docs eerst naar een vast bronbestand exporteren; review het geëxporteerde bestand.
3. Lees alle inhoud, contentkaarten, softwarekaarten, afhankelijkheden, drie reviewbewijzen en herstelgegevens. Controleer bij de onafhankelijke AI-review de werkelijk afzonderlijke proces-/chatidentiteit en de inhoud van het bewijs. Alleen een opgegeven proces-ID of `accepted`-veld bewijst geen echte review. Vraag zo nodig een afzonderlijke reviewer in het integratieproces; geef brongebonden herstel terug aan de producerende chat zoals door Nico opgedragen. Menselijke inhouds-, audio-, rechten- en praktijkreview blijven afzonderlijke poorten.
4. Controleer de actuele repository, live-marker en publicatiedocumentatie opnieuw. Neem de bronwaarden over uit `snapshot`. Verander geen oude hashes om een reeds beoordeelde batch alsnog passend te laten lijken: inhouds-/plaatsingswijzigingen vereisen een nieuwe versie en hercontrole.
5. Voer `stage` uit. Een structureel ongeldig pakket stopt met exitcode 1; een compleet gelezen maar geblokkeerd pakket bewaart alle bytes en bevindingen en eindigt met exitcode 2. Alleen een pakket zonder bevindingen krijgt een `proposed-bank.json`.
6. Controleer de voorgestelde bank en maak vervolgens een schone, afzonderlijke `codex/`-branch. `apply` schrijft uitsluitend lokaal naar `data/klink-imported-practice.json`, met de oude bank als bytegelijke herstelkopie en de importversies in dezelfde atomair vervangen JSON. Het commando publiceert en pusht niet.
7. Test de relevante echte schermen, fout/herstel, docentafscherming, navigatie, voortgang, hulp en media. Bewaar logs en volledige review-/herstelbestanden op Drive. Werk het register pas bij op basis van de werkelijk behaalde stap. Een lokaal geïmporteerde bank is nog niet getest, vrijgegeven of gepubliceerd.
8. Bereid daarna pas een concreet publicatiebesluit voor. Alleen na expliciete vrijgave van Nico en alle toepasselijke acceptatiecriteria: canonieke `main`, actuele liveafstamming, bestaande `npm run deploy`, terugleescontrole van release, bundel en betrokken media. Behoud de bestaande beveiligingen. Upload het exacte publicatiebewijs en controleer de cloudbestanden.

De CLI werkt op lokaal opgehaalde, versievast gemaakte pakketten; OAuth-inloggegevens of een tweede Drive-client zijn bewust niet ingebouwd. De Workchat verzorgt ophalen, afzonderlijke reviews, registerbeheer en archivering via de verbonden Drive-tools. Daardoor blijft de menselijke opdracht beperkt tot de batchcode, terwijl ontbrekende inhoud of vrijgave zichtbaar kan blokkeren.

## Bestanden en opdrachten

Uitvoerbare schemas: `scripts/content-batch-schema.mjs`. De bijbehorende uitwisselbestanden zijn `batch.schema.json` en `register.schema.json` in deze map. De volledige inhoud van payloads en bewijs staat in bestanden, niet uitsluitend in een voortgangssamenvatting.

```sh
node scripts/import-content-batch.mjs locate /pad/production-register.json BATCHCODE
node scripts/import-content-batch.mjs snapshot
node scripts/import-content-batch.mjs stage /pad/batch /pad/nieuw-stagingbewijs
node scripts/import-content-batch.mjs apply /pad/batch /pad/nieuw-importbewijs
npm run test:batch-import
```

Een batchmap bevat `manifest.json` en alle bijbehorende bestanden onder `files/`. `files[].id` is een interne bestandsreferentie; `driveFileId` is de echte teruggelezen Drive-ID; `sha256` betreft de exacte bytes. Absoluut pad, padtraversal, een symlink buiten de batch en ontbrekende of gewijzigde bestanden worden geweigerd. De bewijsmap moet nieuw zijn: eerdere bewijzen worden niet overschreven.

De stage bewaart de oorspronkelijke paden en kan zelf opnieuw worden gevalideerd. Geen ZIP-extractie of uitvoer van pakketcode. Een taakbestand is JSON met MIME `application/json`. Niet-ondersteunde taakvelden worden geweigerd, ook als ze een verborgen bron, audio-eis of presentatieregel bevatten.

## Contentkaart en softwarekaart

Elk object heeft een unieke ID, positieve integer-versie, soort, payloadbestand, exacte woord-/betekenisreferenties, bronreferenties, afhankelijkheden, mediareferenties, niveau, leerdoel, bestemming, gebruikersrol en route. `lessonContext` verbindt het boekdoel en docentlesplan met een werkelijk meegeleverd observatiebewijs. Die verwijzingen zijn geen bewijs dat een volledige methode of cursusvariant is gerealiseerd; de inhoudelijke reviewer controleert de samenhang volgens de vaste Taalroute-ontwerpbasis.

`assessment` benoemt `answer`, `participation` of `none`, rapportagedoel en verplicht `masteryClaim:false`. De huidige generieke speler blijft docentondersteund en verleent geen zelfstandig leesniveau. Een onderwijsinhoudelijke beheersingsclaim kan niet via deze import worden toegevoegd.

Canonieke woord-ID's worden rechtstreeks uit de bestaande curriculum- en Lexicon-pakketten gelezen. Een `klink-woord-*`-ID staat voor de bestaande betekenis. Lexicon-woorden met `selectedMeaningIds` vereisen een expliciete `meaningId` uit die lijst. Geen koppeling op alleen spelling, geen nieuwe canonieke identiteit en geen automatische omzetting van historische A1-K-/TL-/K-productiecodes. Het bestaande woordenregister wordt niet herschreven.

| Soort | Payload | Wat v1 uitvoert |
|---|---|---|
| word, sound, letter | `canonicalId` | Bestaande identiteit controleren; geen nieuwe canon maken |
| sentence, text, document | `title`, `text`, `format` | Eén gedeelde bron bewaren; controleren dat de gekoppelde oefeningen precies die bron tonen |
| exercise | bestaand `ImportedItem`-contract | Valideren, versiecontrole, voorstel en lokale import in bestaande tekst-/keuze-/docentspeler |
| media | `fileId`, `role`, `rightsStatus`, `reviewStatus`; audio ook `voiceId` en `metadataEvidenceFileId` | Bytes en metadata bewaren; runtimeimport blokkeren totdat passende media-aansluiting en review zijn afgerond |
| teacher-guide, board, worksheet, objective, reporting | `title`, `fileId`, `description` | Volledig bestand bewaren; expliciet blokkeren op ontbrekende runtimeadapter |

Het ruime ontvangstenvelop is dus geen verklaring dat elk soort materiaal al uitvoerbaar is. Nieuwe klank-/lettertaken kunnen als bestaande, tekstuele oefeningen worden aangeleverd; nieuwe klankmedia vragen de aparte media-aansluiting. Alfa A/B/C blijven onderscheiden van A1/A2/B1.

`exercise` gebruikt het bestaande contract uit `lib/imported-practice-contract.ts`: ID, inhoudslijn, niveau, vaardigheidsas, titel, leerdoel, bron-ID's, antwoordvorm, prompt, stimulus, opties, antwoorden, gerichte feedback, docentaanwijzingen en voorbereiding. Bestaande `teacherWorkflow` en `teacherReference` blijven intact. Alleen concrete bronnen worden geaccepteerd; een payload of contentkaart met een andere ID, niveau, doel, beoordeling of bron wordt geweigerd.

Ondersteunde bestemming: `adapter:imported-practice`, `role:learner` en de bestaande hoofdstukroute uit `inventory.json`. De daadwerkelijke activiteit is `content-<domein>`; de bestaande app bepaalt de collectie. Een gevraagde andere route wordt niet stilzwijgend genegeerd. Een gedeelde bron heeft ten minste één daadwerkelijke oefenbestemming nodig. De bestaande runtime vraagt een stimulus per taak; deze projectie mag herhaald worden, maar het aangeleverde bronobject blijft één versie met meerdere verwijzingen.

## Review en wijzigingen

Reviews hebben de stappen `internal`, `independent-ai` en `technical`, elk met een eigen bewijsbestand en reviewer/procesidentiteit. De onafhankelijke AI mag niet hetzelfde proces gebruiken als productie of de andere beoordelingen. Iedere review moet `accepted` melden, nul open kritieke punten hebben en exact dezelfde `scopeSha256` betreffen. `batchScope()` berekent deze over het canoniek gesorteerde manifest zonder de reviewrecords; alle bestanden, plaatsingen en afhankelijkheden vallen wel binnen de scope. Bewijsbestanden mogen daarom geen zelfreferentiële manifesthash vereisen; de binding staat in het reviewrecord.

Bewijsintegriteit is automatisch controleerbaar; de echtheid en inhoudelijke kwaliteit van een reviewer zijn dat niet. De Workchat moet de oorspronkelijke reviewuitvoering vaststellen voordat zij `apply` uitvoert. Een synthetisch testbewijs is nooit een echte acceptatie.

Een nieuw taak-ID begint met versie 1 en `expectedPreviousSha256:null`. Vervanging van een bestaande taak vereist de canonieke JSON-hash van de huidige taak en precies de volgende versie. Voor bestaande historische taken zonder importversieregister geldt versie 1 als technische uitgangsversie, niet als herdatering van de inhoud. Identieke inhoud blijft bestaan; dezelfde volledige taak onder een andere ID wordt tegengehouden. Bestaande niet-aangeleverde items verdwijnen nooit. Een eerdere batchversie kan niet opnieuw worden toegepast.

`baseCommit`, `baseBankSha256` en `sourceSnapshotSha256` beschermen tegen een gewijzigde bron tijdens voorbereiding. Het bankbestand wordt als één geheel atomair vervangen, inclusief importhistorie; een lokaal importslot voorkomt gelijktijdige schrijvers. Bij een onderbreking: vergelijk de werkelijke bankhash en het interne `batchImports`-record met het bewaarde manifest en `previous-bank.json`. Verwijder geen herstelbewijs en pas de batch niet blind opnieuw toe.

## Media, docentomgeving en voortgang

De generieke importspeler bevat geen audiorenderer. Audioplichten of nieuwe beeld-/audiokoppelingen via deze adapter worden daarom geblokkeerd. Media krijgen later de bestaande eigen bron-/rechtenreview, volledige handencontrole waar van toepassing, exacte stemrollen, werkelijke audiometadata en exportcontrole. De instructiestem en doeltaalstem mogen niet dezelfde voice-ID hebben. Een metadatabestand vervangt geen controle van het echte geluid.

Klink+docent op concept-PR #5 is geen gepubliceerde adapter op `main`. Het bestaande docentwerk wordt niet meegemerged; bord- en werkbladobjecten blijven bewaard met een blokkade. Geen wijziging in de bevroren zelfstandige DigiBord-app. De gewone Klink-voortgang, Alfa C-opslag en historische databasegegevens worden door dit script niet gelezen of gemigreerd. Een nieuwe of aangepaste taak moet vóór publicatie nog op oude opgeslagen pogingen en nieuwe poging-ID's worden beoordeeld.

## Integratievolgorde

1. Regie kent de eerste werkelijke batchcode toe en registreert exact manifest en versie. Het centrale register begint leeg: er wordt geen fictieve productiebatch of review opgevoerd.
2. Gebruik de bestaande tekstuele adapter voor een werkelijk vrijgegeven pakket dat past binnen het huidige contract. Eerst één complete batch van ontvangst tot lokale appcontrole; pas daarna een grotere reeks.
3. Bouw de volgende adapter alleen voor een concrete batch en werkelijke softwarebestemming. Voor de 44 historische Alfa B-dictees is een afgeschermde auditieve speler nodig; alleen flags aanpassen is onvoldoende. Voor Alfa C-functionele blokken zijn eigen presentaties, dictee, schrijfplekken en feedback nodig; flattenen naar de generieke tekstspeler is niet toegestaan.
4. Sluit Klink+docent aan na samenvoegings-/publicatiebesluiten voor de actuele docentbranch; behoud de definitieve Woord → Zin → Tekst-opbouw en de aparte docentgegevens.
5. Koppel pas daarna verdere media, werkbladen en rapportage aan de juiste bestaande contracts. Geen zware GitHub-workflows; gerichte en vereiste volledige controles lokaal, publicatie apart.

Zie `inventory.json` voor feitelijke brondekking en `INVENTARISATIE.txt` voor bronstatus, hiaten, Drive-locaties en beperkingen.
