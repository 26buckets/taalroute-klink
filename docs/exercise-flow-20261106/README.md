# Klink — gedeelde oefenruimte, lokaal voorstel 6 november 2026

Nico vroeg: “Ja, werk dit uit voor de hele app. Begin met die drie voorbeelden en laat me de nieuwe indeling zien. Behoud alle inhoud en voortgang en zorg dat de bediening overal vlot en hetzelfde werkt.” Dit is toestemming voor het concrete lokale ontwerp en de implementatie. Dit voorstel is niet gepubliceerd; de vastgezette uiterlijkreferenties zijn niet gewijzigd.

## Basis en omvang

- Bron: `26buckets/taalroute-klink`, lokale branch `fix/word-practice-space-20261106`.
- Geverifieerde main bij aanvang: `f9299b107610c25975fcd2cfb164c0981928385d`, afstammeling van live `db57924f60e8d632eed0d1b75c9b48a7491da709` (build 2026-11-06T01:05:05.344Z, sourceClean true). Geen actuele Worker-providercontrole voor deze lokale opdracht.
- Bouwt verder op lokaal fotovoorstel `0db1a08`; nog geen push of deploy.
- Gedeelde oefenindeling voor pakket-, hoofdstuk- en lesoefeningen. Start-/overzichtsschermen en de inhoudelijke routes blijven bestaan.
- Geen wijzigingen in `lib`, `data`, `public`, afhankelijkheden, opslagmodellen, oefen-ID's of beoordeling van handschrift/vrije tekst. Geen generatie van audio of beelden. De inmiddels met een latere afzonderlijke opdracht gepubliceerde dictee-inhoud blijft ongewijzigd; de eerdere stopinformatie was verouderd. PR12 en staging zijn niet geraakt.

## Gedrag

- Tijdens een pakketronde verdwijnen de vier overzichtstabs; “Alle oefeningen” brengt ze terug. Terug en de keuze één-voor-één/op-één-blad staan compact bij elkaar.
- Het oefenvlak groeit met zijn inhoud. Lange opdrachten gebruiken de buitenste paginascroll, niet een tweede scrollbar in het oefenvlak. Een balk onderaan bedekt geen antwoorden.
- Een verborgen modelfoto neemt geen lege ruimte in. Antwoordfoto's behouden hun antwoordposities; grote foto's worden niet tot miniaturen teruggedrukt. Vier foto's staan op brede schermen naast elkaar; op smallere schermen in twee kolommen.
- Bij korte typantwoorden staat Controleer naast het veld. Na goedkeuring staat daar Verder als automatisch doorgaan gepauzeerd is. Het losse dubbele Verder onderaan verdwijnt bij deze velden.
- Enter controleert een kort antwoord. Een juist antwoord gaat na de bestaande korte feedbackpauze verder als automatisch doorgaan aanstaat. Een fout antwoord blijft staan. Toetsenbordgebruik zet automatisch doorgaan niet ongemerkt uit. Pauze, audio, opname, hulp en bestaande didactische handmatige stappen blijven gerespecteerd.
- Spatie blijft tekst in invoervelden. Enter blijft een nieuwe regel in vrije tekst. Spatie/Enter bedienen een gerichte actieknop normaal. Handschrift en vrij schrijven krijgen geen automatische inhoudelijke beoordeling.
- Invoerfocus volgt de volgende korte typvraag zonder een geopend hulpvenster te onderbreken.

## Controles en bewijs

Resultaten, schermbeelden en logs staan in de bijbehorende herstelbundel. De daadwerkelijke aantallen en resultaten staan in `validation.json`.

- Drie echte pakketroutes, Chromium en WebKit, vier schermformaten 1600×730, 1366×600, 390×844 en 320×568. Verkeerd/goed antwoord, Enter, spatie, pauze, terug, opslaan en herladen.
- Fotokeuzes: twee engines, zes schermformaten inclusief liggend 740×390; werkelijk geladen bestaande foto's, buitenste scroll, werkblad, terug en behouden voortgang.
- 61 representatieve in de bron aanwezige oefenvormen, twee engines en drie schermformaten. Geen horizontale overflow, geen afgesneden inhoud of binnenste scrollvlakken. Dit is geen volledige inhoudsaudit van alle externe oefenbanken.
- Korte antwoorden en vrije schrijfvormen met gesimuleerd schermtoetsenbord: twee engines en twee viewportmodellen. Geen fysieke telefoonproef.
- Bestaande toetsenbord/knop-pariteitscontrole aangepast aan expliciet pauzeren en een deterministisch testbeeld. Alleen de in de bron aanwezige vormen; externe banken niet massaal gedownload.
- Echte audio afgespeeld tot het einde, toetsenbordantwoord, verder en browserfullscreen op de lokale app met ongewijzigde live media als leesbron.
- Twaalf standaardspeler-unitcontroles, gerichte lintcontrole en lokale compilatie (`vinext build`). Dit is niet de volledige publicatiepoort: de checkout is sparse en bevat niet alle media.
- TypeScript meldt een al bestaand omgevingsprobleem: `middleware.ts(8,106): Property 'ASSETS' does not exist on type 'Env'`. De middleware en omgevingsdeclaraties zijn ongewijzigd. Geen TypeScript-fouten in de gewijzigde bestanden.
- Een aanvullende bron-/hoofdstuktest kon in deze sparse checkout niet volledig draaien wegens ontbrekende bestaande mediabestanden en `docs/klink-complete-release-20261101/import-manifest.json`; dit is geen volledige geslaagde curriculumtest.

De meeste interactiecontroles gebruiken snelle gesimuleerde audio. De afzonderlijke native-audioproef controleert echte browserweergave. De foto-/voorbeeldproeven lezen bestaande media alleen van live; zij wijzigen productie niet. Eerste afgebroken browserproeven betroffen onder meer testfixtures, een missende motion-stylesheet en herladen tijdens lokaal ontwikkelwerk; alleen voltooide eindcontroles tellen mee.

## Herstel en volgende stap

De bundel bevat de exacte gewijzigde bronbestanden, hun oorspronkelijke versies, een patch vanaf bovengenoemde main, lokale commitgegevens, controles en schermbeelden. Herstel gebeurt uitsluitend lokaal vanaf die vastgelegde basis; de bundel is geen deploypakket.

Vóór eventuele publicatie: het concrete uiterlijk laten beoordelen door Nico, actuele main/live/Worker en publicatievenster opnieuw vaststellen, op de actuele afstammeling integreren en de normale publicatiepoort uitvoeren. Geen oude checkout opnieuw deployen en geen andere ongepubliceerde wijzigingen meenemen. Geen GitHub Actions gebruikt voor deze lokale controles.

## Publicatieopdracht 6 november 2026

Nico heeft de getoonde indeling goedgekeurd en expliciet publicatie opgedragen. Het exacte akkoord, de actuele basis, controles en herstelbewijs staan in `publication/`. De bovenstaande beschrijving bewaart de eerdere lokale voorbeeldfase.
