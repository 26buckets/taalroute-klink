# Klink Inzicht — bronobservaties en visuele rapportages

Opdracht van Nico, 1 november 2026. Uitsluitend draft PR #8 en de bestaande fictieve EU-staging. Geen merge of productiepublicatie.

## Bronnen en samenvoeging

- Oorspronkelijk formulier: Drive `1YDoH5cfNqEECOWShsQJedu0LpCsvff3m`, SHA-256 `e12d1ff7156f8e72c7075708e58c6a2be1b9a2dee00e42649768b53cabee9a60`.
- Integratiepakket v3 HOLD: Drive `1Tl8Uwv3PiFmaSt5cVuDZrKi0D1ZXvV5j`, SHA-256 `726a2a5ec981fc891cbbc47d0fb57998c3ed9e4f4111e41c01e0c812c8e2b16a`.
- Bouwdossier `17HB7IK7PujQ-sg-S_r06YDeM68tkXuD6MFzGYOW8dFE` en basisdocumenten 00/01/02 gelezen. V3 is historische input, geen actuele deploybasis. De twee meegeleverde HOLD-documenten blijven als historische herkomst bewaard; dit verslag en de finale verificatie beschrijven de nieuwe uitvoering.
- V3 gecontroleerd op actuele PR-head `e14b33aa2122db2e2718a31a2cf6c307cd935b51`, in een aparte werkkopie. De snelheid-/downloadreparaties uit de parallelle chat worden vóór push en stagingpublicatie behouden. Definitieve basis en deployment staan in `evidence/visual/release.json` zodra vrijgegeven.
- `main` en actuele productie afzonderlijk geïnspecteerd; deze taak publiceert uitsluitend de bestaande geïsoleerde staging. Bestaande Klink+Docent-productcode, appearance floor en productpublicatieconfiguratie worden niet gewijzigd.

## Werkende functies

Binnen een klas opent **Observeren** het bronformulier. **Algemene vaardigheidsobservatie** blijft daarnaast bereikbaar. De oorspronkelijke acht materialen, Woord/Zin/Tekst en zes criteria per combinatie zijn exact met het bronbestand vergeleken.

De keuzes blijven `0 = ✓ Zonder directe hulp`, `1 = △ Met hulp of model`, `2 = — Niet waargenomen`, `null = Niet ingevuld`. Het getal is uitsluitend de opslagcode. Geen conversie naar beheersing, ERK-niveau, fout antwoord of toetsbewijs. Het formulier bewaart opmerkingen, volgende leerhandeling, meetdatum, taakdoel, afnameconditie en correctietoelichting.

Autosave meldt pas opgeslagen na serverantwoord. Verloren antwoorden worden met dezelfde idempotentiesleutel herhaald. Een mislukte opslag blokkeert nieuwe invoer tot herstel; links, schoolwissel en afmelden worden bij openstaande wijzigingen tegengehouden. Sluiten/verversen gebruikt de native waarschuwing. Wacht bij gebruik van browsergeschiedenis altijd op de opgeslagenmelding: browser-terug tijdens een offline wijziging is niet als volledig herstelbare workflow vrijgegeven. Geen dossiers in localStorage.

Iedere correctie bewaart de oude revisie. PDF vraagt de gekozen revisie en actuele autorisatie opnieuw op en gebruikt school-, klas- en cursistgegevens van de server. Woord-, Zin- en Tekst-PDF zijn inhoudelijk en visueel gecontroleerd. PDF-downloads zijn registratiedocumenten, geen genormeerde certificaten of opgemaakte cursistuitgaven.

De tab **Rapportages** biedt drie rechtstreeks bereikbare weergaven (`report=individual`, `report=group`, `report=national`) op de bestaande klasroute:

1. **Individuele groei**: interactieve categorische grafiek, zes broncriteria apart of gezamenlijk, meetdatum of werkelijk geregistreerde lesuren, aantallen, dekking, bron/revisie-drilldown. Geen verbonden vaardigheidsscore. De totaalverdeling beschrijft alle geselecteerde taken en is geen vergelijkbare totaalscore. Een afzonderlijk kanaal toont bestaande rubricgebonden bewijsregistraties, inclusief ingetrokken of ongeschikte bewijzen.
2. **Groepsontwikkeling**: alleen dezelfde bronversie, modus, materiaal, taakniveau, afnameconditie en kalendermaand samen. Laatste observatie per cursist, gelijke weging. Gemiddelde per criterium is aandeel ✓ onder ✓/△. Totaalmediaan gebruikt uitsluitend criteria die bij alle meegenomen cursisten daadwerkelijk zijn waargenomen. n, klassendekking, taakmix, gemeenschappelijke criteria en cohortwissels zijn zichtbaar. Ontbrekende taakcontext of inschrijving op het meetmoment sluit groepsvergelijking uit. Minder dan vijf cursisten of vijf waargenomen waarden per criterium: geen samenvattend resultaat. Geen leerlingranglijst en geen schooloverstijgende aggregatie.
3. **Landelijke vergelijking**: expliciet geen beschikbare Nederlandse gemiddelden, percentielen of normbanden. Niveaukeuze toont brongebonden samenvattingen met bron, doelgroep en pagina's. Geen fictieve dataset, geen automatische niveauvaststelling.

Werkelijk gevolgde minuten worden per cursist en bijeenkomst afzonderlijk geregistreerd; correcties bewaren de volledige historie. Ontbrekende registratie is onbekend, nooit nul. Nul is een expliciete registratie/correctie. Pauzes, geplande tijd en zelfstandig oefenen worden niet afgeleid. Urenas is cumulatief tot het meetmoment binnen deze klas; geen vaste groei per uur. Urenfilters horen alleen bij bronobservaties; het afzonderlijke bewijsblok vermeldt zijn eigen cursist-/periodefilter.

## Inhoudelijke en privacygrenzen

ERK: officiële Raad van Europa/Taalunie-vertaling 2022, pagina's 53–54, 59, 67 en 72. Alfa: gepubliceerde ITTA-uitwerking *Streefdoelen alfabetisering ISK* 2018, pagina's 28–44. De ISK-doelgroep is zichtbaar als beperking vermeld. De volledige passende volwassenendescriptoren en de inhoudelijke koppeling van broncriteria aan niveaus moeten nog didactisch worden gevalideerd. De pagina claimt geen gevalideerde volwassenennorm.

Een landelijke normimport is bewust niet gebouwd zonder dataset. Voor weergave zijn onder meer licentie, validatie, methodiek, referentiegroep, cohort, N, meetinstrument, versie, afname-/publicatiedatums, onzekerheidsmarge en vergelijkbaarheid vereist. K=5 is een extra presentatiedrempel binnen een reeds geautoriseerde klas, geen garantie van anonimiteit of vervanging van een privacybeleid/DPIA. Geen gegevensuitwisseling tussen scholen.

## Opslag en verificatie

Migraties 0001–0005 blijven bytegelijk; 0004 MFA en 0005 retries behouden. Nieuwe tabellen in 0006 (bronobservaties/revisies) en 0007 (aanwezigheidsminuten/revisies). Geen destructieve SQL. De bestaande autorisatie, schoolcontext, transacties, revisiecontrole en idempotentie worden hergebruikt. Rapportages weigeren een inconsistente schoolsnapshot met een vernieuwmelding.

`observations-upgrade-check.mjs` controleert exact staging-ID en EU-jurisdictie, maakt eerst een privéback-up, beproeft upgrade/herstel lokaal en vergelijkt bestaande gegevens. Zonder `--apply` voert het geen remote migratie uit. Met `--apply` gebruikt het de bestaande begrensde migratieroute en controleert direct daarna de oude onderwijsgegevens en herstelbaarheid. Ruwe back-ups/authenticatiemateriaal blijven uitsluitend in genegeerde privéopslag; nooit Git of Drive.

Uitgevoerde lokale controles: 87 gerichte tests inclusief exact broncatalogus, null/0/1/2, revisies, idempotentie, schoolrechten, vergelijkbaarheid, k-drempel, inschrijving, uren en herstel. SQLite- en PostgreSQL-portabiliteit. Typecontrole, gerichte lint, productbouw en geïsoleerde stagingbouw. Chromium/WebKit: opgeslagen servergegevens na herladen, drie PDF-modi, verloren opslagantwoord, navigatieblokkering, filters, drilldowns, lesminuten, kleine groep, zes niveaukeuzes, licht/donker, 1280/390/320 px en axe WCAG 2.2 AA. Klink+Docent: 8 schermreizen, 192 faseweergaven, 40 hulpmiddelen, herladen/bewaren/pauze. Een verouderde testverwachting voor pauze is op de bestaande `hidden`-implementatie gericht; productcode blijft gelijk.

Browsercontroles en automatische toegankelijkheidsanalyse zijn geen volledige onafhankelijke WCAG-audit. Screenreadergebruik en de praktijkinterpretatie door docenten blijven acceptatiepunten vóór gebruik met echte cursisten. Online bewijs, commit, deployment en resterende technische blokkades worden afzonderlijk vastgelegd; een lokale geslaagde test geldt niet als bewijs van livebouw.

Alle zware controles lokaal. Geen nieuwe GitHub Actions, geen budgetwijziging. Bundeling en één afgestemde push naar de bestaande PR-branch; PR blijft draft.
