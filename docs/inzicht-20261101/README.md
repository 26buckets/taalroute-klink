# Klink Inzicht — reviewbare lokale uitvoering

1 november 2026. Normatieve volgorde: **R2 > R1 > v1.0**. De zeven volledige bronbestanden staan in `sources/`; de geactualiseerde startprompt v1.2 staat onderaan bron 00. Dit is een werkende, afzonderlijke module in de echte Klink-codebase, met lokale Cloudflare D1-opslag. **Geen vrijgave voor echte accounts, echte cursistgegevens of productie.**

## Wat werkt

- Routes `/inzicht` en `/inzicht/klassen/:id/...`: eigen klassen aanmaken/hernoemen/archiveren/heropenen, voorlopige cursisten, profiel en observaties met blijvende correctiehistorie.
- Registrar koppelt een voorlopige cursist via een korte eenmalige uitnodiging aan het exacte ingelogde synthetische schoolaccount. Gelijke namen worden nooit gemerged. Registrar kan bestaande cursisten in meerdere klassen indelen of uitschrijven. Docenten kunnen zo geen willekeurige bestaande leerlingdossiers verzamelen.
- Vaardighedenmatrix met maximaal 20 kolommen per pagina, afzonderlijke onzekerheid/aandacht/hercontrole, bewijsdoorklik en expliciete voortgangsverwerking. Algemene observaties en oefenpogingen blijven TRAIN, niet MEASURE.
- Klasbeleid en individuele uitzonderingen, impactvoorbeeld en bevestiging. School, klas, licentieroutes, publicatiestatus, periode en opdracht worden bij het openen én opslaan van een schooloefening opnieuw gecontroleerd.
- Een opdracht klaarzetten en als gekoppelde cursist uitvoeren met de bestaande `ExerciseSurface`. Het resultaat wordt op de server beoordeeld en bewaard; herladen verliest het niet. Drie bestaande woordoefeningen vormen de gecontroleerde proefcatalogus; de hele Klink-catalogus is nog niet inhoudelijk gekoppeld.
- Deterministische lesvoorstellen met noemers, meetdekking, bewijs, regelsversie, controle op verouderde previews en expliciete goedkeuring/afwijzing. Geen AI of automatische opdrachtuitgifte.
- Additieve SQL-migraties, tenant-FKs, audit zonder notitietekst, idempotentie, revisies/outbox, lokale hersteltest en werkelijk geteste PostgreSQL-import.

Klink+Docent, bestaande spelers, media, werkbladen, hoofdmenu en bestaande lokale gegevens zijn ongewijzigd. Inzicht staat op een nieuwe route; het bestaande hoofdmenu is niet aangepast. D1 wordt behouden omdat die infrastructuur daadwerkelijk bestaat. PostgreSQL is een geteste overdrachtsroute, geen tweede productieplatform.

## Lokale review starten

Gebruik Node 22.13 of hoger; de gecontroleerde uitvoering gebruikte Node 26.4.0. Voer uit vanaf de repositoryroot:

```sh
npm ci --ignore-scripts --no-audit --no-fund
node scripts/inzicht/staging.mjs
KLINK_INZICHT_LOCAL=1 npm run dev -- --port 18841
```

Open `http://127.0.0.1:18841/inzicht`. De lokale testtoegangen staan in `.wrangler/inzicht-credentials.json` (docent, registrar, cursist, collega, beheerder, support). Deze worden niet in Git of Drive opgenomen. Sessies verlopen na acht uur; `node scripts/inzicht/sessions.mjs` vervangt uitsluitend synthetische testsessies, met behoud van alle onderwijsgegevens. Stop andere Vinext-devservers van dezelfde checkout vóór starten. Nooit echte persoonsgegevens invoeren.

Staging initialiseert één keer en weigert bestaande gegevens te overschrijven. SQL-opslag staat onder `.wrangler/state`. Sluiten of herstarten van browser/server verwijdert deze niet. Er is geen schooldata in localStorage/sessionStorage. Dit is **lokale staging**, geen online proefomgeving en geen productie-authenticatie.

```sh
node --test scripts/inzicht/test.mjs
node scripts/inzicht/portable-test.mjs
node scripts/inzicht/browser.mjs
node scripts/inzicht/student-browser.mjs
npx tsc --noEmit
npx oxlint components/inzicht lib/inzicht scripts/inzicht app/inzicht app/api/inzicht
npm run build
```

De browsercontroles gebruiken Playwright en voor de beperkte geautomatiseerde toegankelijkheidscheck `@axe-core/playwright`; zij zijn niet als productdependency toegevoegd. In deze workspace is de reeds aanwezige tooling gebruikt. Bij een schone revieweromgeving zijn die lokale testtools en Chromium/WebKit nodig. PostgreSQL-herstel vereist lokale `initdb`, `pg_ctl`, `psql`; er worden uitsluitend tijdelijke lokale databases gebruikt. Alle zware controles lokaal; geen nieuwe GitHub Actions.

## Werkelijke codepaden

| Onderdeel | Bestanden |
|---|---|
| Featuregrens | `vite.config.ts`, `app/inzicht/[[...path]]/page.tsx` |
| API | `app/api/inzicht/[...path]/route.ts`, `lib/inzicht/service.ts` |
| Deterministische regels | `lib/inzicht/rules.ts` |
| Docentschermen, echte navigatie | `components/inzicht/app.tsx`, `client.ts`, `inzicht.css` |
| Registrar/cursist/oefenspeler | `components/inzicht/school.tsx` |
| Schema | `db/migrations/inzicht/0001_inzicht.sql`, `0002_school_attempts.sql` |
| Staging en brongebonden catalogus | `scripts/inzicht/staging.mjs`, `sessions.mjs`, `fixtures.mjs` |
| Herstel/SQL-overdracht | `scripts/inzicht/portable.mjs`, `portable-test.mjs` |
| Bewijs en acceptatie | `evidence/`, `ACCEPTATIE-72.md`, `SECURITY-PRIVACY.md` |

Alle school-API's vereisen `?school=...`. Schrijven vereist dezelfde Origin, JSON, sessie en een Idempotency-Key. Een idempotentiesleutel is gebonden aan de volledige URL én inhoud; een andere context kan geen eerder antwoord hergebruiken. Normale appconfig heeft geen Inzicht-binding/flag; de API geeft 404. Vinext-dev streamt de niet-gevonden pagina met HTTP 200; er wordt geen Inzicht-interface of schooldata getoond. Dit frameworkgedrag is vastgelegd en geen bewijs van een geteste publieke deployment.

## Werkpakketten en echte grenzen

| Werkpakket | Status | Nog nodig |
|---|---|---|
| WP0 inspectie | Uitgevoerd | Nieuwe livebasis opnieuw toetsen vóór iedere latere publicatie |
| WP1 klassen/accounts | Lokale synthetische uitvoering | Beheerde echte login, MFA/herstel, accountactivatie, operationeel schoolbeheer |
| WP2 observaties | Werkend lokaal | Goedgekeurde observatierubrics en praktijkreview |
| WP3 bewijs/matrix | Werkend raamwerk; 3 proefvaardigheden | Gevalideerde meetinstrumenten, volledige skill/contentmapping, automatische bewaakte outbox-consumer, schaaltest op afgesproken cloudstaging |
| WP4 toegang/opdrachten | Lokale kernroute werkend | Vrij-oefenenkeuzescherm, volledige catalogus, planning/intrekking in UI, terugzetten individuele uitzondering op klasstandaard, volledig onderwijsrapport |
| WP5 lesadvies | Zuivere regels en docentoordeel werkend | Didactische kalibratie, geïntegreerde taakselectie vanuit advies, echte roosterbron |
| WP6 vrijgave | Niet vrijgegeven | Zie ondertekende poorten, menselijke toegankelijkheids- en docentpilot, beheerde cloudstaging en productie-operatie |

Geen verborgen persoonlijke SQL-omgeving geclaimd: de bestaande persoonlijke voortgang is nog apparaatgebonden. Het nieuwe schoolsysteem importeert die niet. Een werkelijk persoonlijk account/passport en delen tussen contexten moeten apart ontworpen en goedgekeurd worden.

## Review vóór samenvoegen

Lees `WP0.md`, `ACCEPTATIE-72.md`, `SECURITY-PRIVACY.md`, `HERSTEL.md` en de bewijsbestanden. De draft-PR is bedoeld voor inhoudelijke/code-review en vervolgbouw, **niet voor merge of uitrol**. Geen cloudstaging aangemaakt; geen remote database gewijzigd. Productiebuild compilet, maar lokaal starten van de gebouwde Worker via Wrangler beëindigde vóór ready; de gewone configuratie is afzonderlijk in dev gecontroleerd. Een online Worker/auth/privacyacceptatie blijft open.

De nieuwe cursistspeler heeft een echte heropenbare route `/inzicht/oefenen` met school-, klas-, content- en waar nodig opdrachtcontext. Een cataloguslink zonder klas vraagt eerst expliciet de juiste klas; een andere of ingetrokken context wordt opnieuw server-side geweigerd. De donkere weergave van alleen de nieuwe module gebruikt de bestaande donkere schoolmenu-kleuren. Bestaande hoofdschermen zijn niet aangepast.

De bestaande publicatiecheck voor de afzonderlijke synoniemenrelease weigert de extra Inzicht-bestanden terecht omdat zij buiten dat eerdere akkoord vallen. Die check is niet aangepast of omzeild. De vier functionele synoniemenregressies zijn apart geslaagd; samen met de 17 docent/werkbladcontroles zijn dit 21 bestaande functionele controles. Er is geen productievrijgavecheck groen verklaard voor Inzicht.
