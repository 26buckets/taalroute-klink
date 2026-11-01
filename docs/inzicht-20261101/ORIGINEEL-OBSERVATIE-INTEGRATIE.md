> Historisch v3 HOLD-bronverslag. Voor de actuele implementatie en verificatie: [VISUELE-RAPPORTAGES.md](VISUELE-RAPPORTAGES.md). De oude status hieronder is geen actuele stagingstatus.

# Origineel observatieformulier, implementatiepakket voor PR #8

Datum: 1 november 2026. Status: brongetrouwe patch op basis van de gecontroleerde PR-head `8c07687153d908a67ee0f66e711d95ac67eaa6b8`. **Nog niet naar GitHub gepusht, geen stagingdeploy en geen productie.** De GitHub-connector heeft alleen leesrechten.

## Original source

- Volledige originele gebruiker-HTML (read-only op Drive): https://drive.google.com/file/d/1YDoH5cfNqEECOWShsQJedu0LpCsvff3m/view
- Originele SHA-256: `e12d1ff7156f8e72c7075708e58c6a2be1b9a2dee00e42649768b53cabee9a60`.
- Bronanalyse: https://docs.google.com/document/d/17HB7IK7PujQ-sg-S_r06YDeM68tkXuD6MFzGYOW8dFE/edit
- Referentiedraft: https://github.com/26buckets/taalroute-klink/pull/8, branch `codex/klink-inzicht-20261101`. De echte bronbasis is vóór packaging vergeleken met de GitHub blob-SHA's.

## Wat is in de code voorbereid?

- Catalogus zonder herformulering: acht materialen `mat`, `tas`, `map`, `man`, `pan`, `jas`, `pen`, `pet`; 3 modi `word`, `sentence`, `text`, 6 criteria per modus, oorspronkelijke zinnen/teksten.
- Exact: `0=✓ Zonder directe hulp`, `1=△ Met hulp of model`, `2=— Niet waargenomen`, en `null=niet ingevuld`; vier werkelijk verschillende datastaten. Geen automatisch MEASURE of mastery.
- De bestaande `/inzicht/klassen/:id/observeren` route gebruikt het originele bronformulier voor nieuwe observaties. Bestaande algemene observaties blijven bewaard en blijven corrigeerbaar.
- Nieuw cumulatief SQL-migratiebestand `0006_original_observations.sql`: twee tabellen met school/klas/cursist-FK's en onveranderbare revisies. Geen DROP en geen bestaande tabel gewijzigd.
- `GET/POST /api/inzicht/source-observations` gebruikt de bestaande autorisatie voor school+klas+cursist, de idempotente transacties, auteurcontrole, optimistic revisions en schoolbrede audit.
- React-bronformulier met Woord/Zin/Tekst, exact criterium en marker, notities en volgende leerhandeling; autosave met vertraging en expliciet server-ack status; nieuwe observatie apart van eerdere revisie; historie in cursistprofiel.
- PDF-generatie gebruikt het eigen in de oorspronkelijke HTML toegepaste jsPDF-idee: A4, de drie *grafisch* getekende markeringen, originele zin/tekst, zes criteria, notities en paginanummers. Om de ingesloten fontbestanden en 1,5 MB HTML niet in de app te kopiëren, importeert deze code `jspdf` als dependency. In de patch staat `package.json` wijziging; na `npm install` moet het lockfile worden bijgewerkt.

## Integreren in de bestaande branch

1. Controleer eerst dat PR8 nog op de verwachte bronbasis staat. Verifieer vooral `components/inzicht/app.tsx`, `components/inzicht/inzicht.css` en `lib/inzicht/service.ts` tegen de aangeleverde patch. Bij voortgeschreden branch: maak handmatige, gecontroleerde merge van alleen deze observatiebestanden, niets overschrijven.
2. In een werkbranch op basis van PR8: `git apply --check originele-observatie-PR8.patch` en vervolgens `git apply originele-observatie-PR8.patch`.
3. `npm install` (de `jspdf` dependency is op `4.2.1` vastgezet) en commit daarna het gewijzigde `package-lock.json`.
4. Pas `db/migrations/inzicht/0006_original_observations.sql` uitsluitend toe op een lokale of eigen staging-D1 met synthetische gegevens. Productiedatabase en andere Inzicht-app op inzicht.taalroute.nl blijven ongemoeid.
5. Test op de volledige repository: `node --test scripts/inzicht/source-observation-test.mjs`, originele 37 Inzicht backendtests, TypeScript, lint, gewone Klink build plus geïsoleerde Inzicht staging build, Chromium/WebKit, WCAG-contrasten/focus, PDF per modus en originele Klink+Docent regressies.
6. Test op staging met 2 docenten, 2 scholen, 2 cursisten, meerdere sessies/apparaten; PDF pas na succesvolle SQL-save; netwerkstoring/mislukte save, read-only observatie van collega, bewaarde revisies. Laat een onafhankelijke NT2-review de betekenissen bevestigen.
7. Geen deploy, merge, echte leerlingdata of privacyvrijgave zonder aparte opdracht en DPIA/security/toegankelijkheidsbeoordeling.

## Uitgevoerde verificatie in deze omgeving

- Uit oorspronkelijke HTML materiële catalogus automatisch geëxtraheerd; bron-SHA gecontroleerd.
- Cumulatieve SQL-migraties 0001 t/m 0004 in Python sqlite: geslaagd, met foreign keys en index.
- 6 Node-testcases direct op de nieuwe serverroute met echte in-memory SQLite-transacties: geslaagd (`source-observation-tests.log`). Bevat karaktergetrouwe symbolen, 0/1/2/null, geen evidence-events, revisieherstel, dubbele observatiedagen, idempotentie, kruis-schoolschema, andere cursist en auteurrechten.
- Syntactische TypeScript-parsercontrole op vier relevante modules zonder TS1xxx syntaxfouten. Volledige compilatie, browser- en PDF-test zijn hier NIET uitgevoerd omdat volledige package/dependency-bron ontbreken.
- GitHub-read: `push: false`. Code is dus niet in PR8, live of staging geplaatst.

## Risico's en verplichte open gates

- Autosave is network-dependent; bij herladen terwijl status nog 'Niet opgeslagen' staat is een laatste bewerking niet gegarandeerd. Docent moet de server-ack zien; test onverwachte navigatie/netwerkverlies. Eventuele privacyveilige conceptcache is optioneel en nooit bron van waarheid.
- JS-PDF is clientside. Vereiste beveiligingsreview op cache van leerlinggegevens, exportrechten, tekst/Unicode, dataminimalisatie en printeruitvoer is nog open.
- Eerdere algemene observaties blijven functioneel bestaan; er is geen automatische omzetting van oude semantiek naar de drie oorspronkelijke symbolen.
- Meer dan 200 eerdere observaties per leerling vereisen gepagineerde geschiedenis; huidige API limiteert tot 200 ter voorkoming van onbegrensde download.
- Status in oorspronkelijke Drive-bouwdossier 07 moet worden aangevuld nadat echte staging-integratie is geslaagd.
