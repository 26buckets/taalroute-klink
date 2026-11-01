# Klink Inzicht — bronobservaties en visuele rapportages

Opdracht van Nico, 1 november 2026. Uitsluitend draft PR #8 en de bestaande fictieve EU-staging. Geen merge of productiepublicatie.

## Actuele vrijgavestatus

De visuele uitbreiding is gecommit en lokaal getest. **Niet op staging gepubliceerd.** De bestaande staging heeft schema 5: de gedeelde D1-dagschrijflimiet blokkeert aanmelding, migratie en de verplichte controle vóór deployment. De quota-blokkade is in de parallelle snelheidsdiagnose vastgesteld. Migraties 0006/0007 zijn alleen lokaal uitgevoerd; de remote database is door deze taak niet gemigreerd. Geen betaalde limieten verhoogd en geen beveiliging omzeild. De volgende stap na vrijgave van het quotum is de begrensde migratie met back-up/vergelijking, geïsoleerde stagingbouw/deployment en de MFA-browserproef. De online functionaliteit van deze uitbreiding is daarom nog niet bewezen.

## Bronnen en samenvoeging

- Oorspronkelijk formulier: Drive `1YDoH5cfNqEECOWShsQJedu0LpCsvff3m`, SHA-256 `e12d1ff7156f8e72c7075708e58c6a2be1b9a2dee00e42649768b53cabee9a60`.
- Integratiepakket v3 HOLD: Drive `1Tl8Uwv3PiFmaSt5cVuDZrKi0D1ZXvV5j`, SHA-256 `726a2a5ec981fc891cbbc47d0fb57998c3ed9e4f4111e41c01e0c812c8e2b16a`.
- Bouwdossier `17HB7IK7PujQ-sg-S_r06YDeM68tkXuD6MFzGYOW8dFE` en basisdocumenten 00/01/02 gelezen. V3 is historische input, geen actuele deploybasis. De twee meegeleverde HOLD-documenten blijven als historische herkomst bewaard; dit verslag en de finale verificatie beschrijven de nieuwe uitvoering.
- V3 gecontroleerd op actuele PR-head `e14b33aa2122db2e2718a31a2cf6c307cd935b51`, in een aparte werkkopie. De vijf eigen commits zijn zonder conflict gerebased op de actuele parallelle commit `8744afabfd9088c50da38b8468556bafe792b58e`; snelheid, downloadherstel, MFA/auth en quotumbeveiligingen zijn behouden. Ook de nieuwe formulierlink haalt geen schermen vooraf op. Definitieve basis en deployment staan in `evidence/visual/release.json` zodra vrijgegeven.
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

Uitgevoerde lokale controles: 90 gerichte tests inclusief exact broncatalogus, null/0/1/2, revisies, idempotentie, schoolrechten, vergelijkbaarheid, k-drempel, inschrijving, uren en herstel. SQLite- en PostgreSQL-portabiliteit. Typecontrole, gerichte lint, productbouw en geïsoleerde stagingbouw. Chromium/WebKit: opgeslagen servergegevens na herladen, drie PDF-modi, verloren opslagantwoord, navigatieblokkering, filters, drilldowns, lesminuten, kleine groep, zes niveaukeuzes, licht/donker, 1280/390/320 px en axe WCAG 2.2 AA. Klink+Docent: 8 schermreizen, 192 faseweergaven, 40 hulpmiddelen, herladen/bewaren/pauze. Een verouderde testverwachting voor pauze is op de bestaande `hidden`-implementatie gericht; productcode blijft gelijk.

Browsercontroles en automatische toegankelijkheidsanalyse zijn geen volledige onafhankelijke WCAG-audit. Screenreadergebruik en de praktijkinterpretatie door docenten blijven acceptatiepunten vóór gebruik met echte cursisten. Online bewijs, commit, deployment en resterende technische blokkades worden afzonderlijk vastgelegd; een lokale geslaagde test geldt niet als bewijs van livebouw.

Alle zware controles lokaal. Geen nieuwe GitHub Actions, geen budgetwijziging. Bundeling en één afgestemde push naar de bestaande PR-branch; PR blijft draft.

## Controles herhalen

Gebruikte lokale gereedschappen: Node 26.4.0, Playwright 1.64.1 (Chromium en WebKit), axe Playwright 4.14.0, TypeScript 5.9.3, Vinext 1.1.0 en Wrangler 4.92.0. Runtime-afhankelijkheden blijven vastgelegd in package-lock.json. Playwright/axe zijn lokale testgereedschappen; installeer zo nodig met `npm install --no-save --package-lock=false playwright@1.64.1 @axe-core/playwright@4.14.0` en installeer beide browserengines.

- `node scripts/inzicht/staging.mjs` maakt de lokale fictieve database en privétesttoegang aan; nooit een bestaande database overschrijven.
- `KLINK_INZICHT_LOCAL=1 npm run dev -- --port 18851` start de lokale proef.
- `OBSERVATION_ORIGINAL_HTML=/absoluut/pad/naar/bron.html node --test scripts/inzicht/test.mjs scripts/inzicht/auth-test.mjs scripts/inzicht/mfa-test.mjs scripts/inzicht/source-observation-test.mjs scripts/inzicht/source-observation-preflight.mjs scripts/inzicht/reports-test.mjs scripts/test-teacher-worksheets.mjs scripts/test-teacher-module-recovery.mjs` herhaalt de 90 basiscontroles. Zonder het exacte bronbestand wordt de expliciete bronvergelijking overgeslagen; claim dan geen volledige broncontrole.
- `KLINK_TEST_URL=http://127.0.0.1:18851 node scripts/inzicht/reports-browser.mjs` controleert de nieuwe schermen, toetsenbord-drilldown, drie PDF-modi en toegankelijkheid in beide engines.
- `KLINK_URL=http://127.0.0.1:18851 KLINK_DOCENT_OUTPUT=docs/inzicht-20261101/evidence/docent-regression node scripts/test-teacher-redesign-browser.mjs` controleert de bestaande Klink+Docent-schermen.
- `node scripts/inzicht/portable-test.mjs` controleert overdracht/herstel; de echte lokale PostgreSQL-proef vereist de gedocumenteerde lokale PostgreSQL-voorziening.
- `node_modules/.bin/tsc --noEmit`, de gerichte oxlint-controle en `npm run build` controleren code en gewone productbouw. Dit publiceert niets.
- Na toegang/hernieuwde quotumcontrole: `node scripts/inzicht/observations-upgrade-check.mjs --apply` uitsluitend op de ingebouwde aparte staging, gevolgd door `node scripts/inzicht/staging-assets.mjs`, `KLINK_INZICHT_STAGING=1 node_modules/.bin/vinext build` en de bestaande gecontroleerde `deploy-staging.mjs --deploy`-route. Controleer vóór uitvoering opnieuw head, parallel werk en schema. De migratiecheck is specifiek voor schema 5 → 7 en stopt bij een afwijkende basis.

Privé online testaccounts/MFA-factoren worden via de bestaande beveiligde toegang beheerd, nooit uit Git of dit Drive-pakket gehaald. Online browserproeven zijn pas geldig na een geslaagde aanmelding en deployment. De normale productdeploy en merge maken geen deel uit van deze opdracht.
