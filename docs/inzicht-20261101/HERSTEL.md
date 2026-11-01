# SQL-migratie, back-up, herstel en rollback

## Huidige grens

Lokale en afzonderlijke online synthetische staging. De productie-D1 is niet gemigreerd. Geen down-migratie of destructieve applicatierollback toegevoegd. Een streng gecontroleerde reset bestaat uitsluitend voor de eigen ongebonden fictieve herstel-DB; zie MFA-EN-BEHEER.md. Er zijn vijf geordende schemafiles in Git; de eerste voegt de nieuwe tabellen toe, de tweede server-side schoolpogingen, de derde afzonderlijke stagingcredentials, de vierde MFA en de vijfde duurzame verwerkingsherhalingen. Bestaande demotabellen worden niet gebruikt of veranderd.

`staging.mjs` leest eerst de schema-versie, past ontbrekende migraties in volgorde toe en seedt alleen een lege Inzicht-database. Het markerbestand voorkomt opnieuw vullen. Een volgende echte schemawijziging krijgt een nieuw migratienummer en een upgrade-/hersteltest op een kopie, niet een wijziging van een al gebruikte migratie. Nog geen algemene productiemigratieplanner of cloudrelease-command.

## Geteste export en herstel

```sh
node scripts/inzicht/portable.mjs export /absoluut/pad/naar/lokale-d1.sqlite work/export.json
node scripts/inzicht/portable.mjs restore work/export.json work/nieuwe-kopie.sqlite
node scripts/inzicht/portable.mjs postgres work/export.json work/postgres.sql
node scripts/inzicht/portable-test.mjs
```

De werkelijke lokale D1-file bevindt zich onder `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`. Kies de database waarin `inzicht_schema` bestaat, niet de oude demo-DB. Export houdt een SQLite-readtransactie aan voor een consistente momentopname. Voor elke tabel worden expliciete kolomnamen/waarden, versie, migratiehashes en checksum opgenomen. Alleen bekende Inzicht-tabellen gaan mee; geen `_cf_KV` of bestaande demo/tabellen.

Restore weigert overschrijven, controleert checksum en migratieversies, maakt het schema opnieuw, importeert transactioneel en vergelijkt rijen en foreign keys. PostgreSQL-uitvoer gebruikt het werkelijk geteste neutrale SQL-schema en expliciet gequote waarden; geen SQLite `.dump` als zogenaamd universele SQL. `portable-test.mjs` initialiseert een lege, uitsluitend lokaal bereikbare PostgreSQL-server, importeert en vergelijkt alle rijen/velden van 24 tabellen en stopt die server weer.

Wachtwoordhashes/credentials, sessies, uitnodigingen, rate-limitbuckets, mutatieguards en requestreplay-antwoorden worden niet hersteld. Daarmee komen oude toegangstokens niet terug. Herstel vereist nieuwe sessies; `sessions.mjs` is uitsluitend voor de vaste synthetische gebruikers. Geen echte auth-subjects migreren zonder mapping en gecontroleerde herverificatie.

Bewijs: `evidence/restore-results.json` (echte D1-snapshot met observatierevisies) en `portable-test-results.json` (herhaalbare SQLite/PostgreSQL-proef inclusief corruptie en overschrijfweigering). Het herstelpakket bevat de synthetische exports, nooit de lokale credentials.

## Runbook vóór een echte pilot — nog niet operationeel afgetekend

1. Eigenaar en plaatsvervanger vastleggen; RPO/RTO expliciet laten goedkeuren. De gemeten lokale proef is geen cloud-RTO-belofte.
2. Back-upplanning, sleutelbeheer, opslag/regio, toegangslog en automatische herstelcontrole instellen. Cloudflare Time Travel alleen is geen onafhankelijke overdrachtsback-up.
3. Bij herstel schrijfverkeer stoppen/isoleren; een nieuwe doeldatabase gebruiken. Controleer exporthash, schema, aantallen, referenties, tenantrechten, actuele verwijderbesluiten en identitymapping. Pas verwijderbesluiten toe vóór enig account toegang krijgt.
4. Login/sessies/intrekkingen opnieuw verifiëren. Privacy- en beheereigenaar tekenen herstelcontrole; dan pas gericht verkeer omschakelen.
5. Applicatierollback schakelt de module uit met behoud van schema/evidence. Productierollback vereist aparte expliciete opdracht en actuele publicatiebasis. Geen oudere app over live gegevens heen zetten.
6. Leg herstelduur, verliesvenster, testresultaten en verwijderingscontrole vast. Wis tijdelijke herstelkopieën volgens de goedgekeurde retentietermijn.

Nog open: onafhankelijke periodieke versleutelde exports, goedgekeurde RPO/RTO, verwijderbesluiten/tombstones en een migratie van de runtime-adapter naar PostgreSQL. Remote D1-herstel is inmiddels uitgevoerd zoals hieronder vastgelegd. De data-overdracht is getest; de app zelf draait nog op D1, niet op PostgreSQL.


## Uitgevoerd online herstel — 1 november 2026

`recover-online.mjs` controleert de exacte staging- en herstel-DB-ID's. Een nieuwe import vereist een lege herstel-DB; overschrijven wordt geweigerd. De echte online synthetische D1 is geëxporteerd naar een uitsluitend lokaal, afgeschermd bestand. Via SQLite wordt een portable bundle gemaakt die credentials en toegangstokens weglaat. Alle 24 datatabellen worden lokaal en in een aparte remote D1 teruggelezen en veld voor veld vergeleken, inclusief foreign keys.

In de niet aan een Worker gekoppelde herstel-DB is daarna een nieuwe Time Travel-bookmark gemaakt, zijn uitsluitend de fictieve klasnamen opzettelijk gewijzigd, en is teruggekeerd naar de bookmark. Alle velden zijn opnieuw gelijk bevonden. De echte online staging bleef daarbij beschikbaar en ongewijzigd. Dezelfde online export is in een werkelijk gestarte lokale PostgreSQL 17 geïmporteerd; opnieuw waren alle 24 tabellen en velden gelijk.

```sh
node scripts/inzicht/recover-online.mjs
# Alleen hervatten van vergelijking/test van de reeds herstelde synthetische kopie:
node scripts/inzicht/recover-online.mjs --verify-existing
node scripts/inzicht/portable-test.mjs .wrangler/online-recovery/snapshot.json
```

Bewijs: `evidence/online-recovery.json`, `online-portable-test-results.json`, herstel-/PostgreSQL-logs en de gecontroleerde portable snapshot in het nieuwe herstelpakket. De oorspronkelijke ruwe SQL-export met auth-hashes blijft in `.wrangler/online-recovery/` en gaat nooit naar Git/Drive. Ook de herstelde database heeft nul credentials en nul sessies. Het portable pakket kan dus geen oude login herstellen.

De providerhistorie is een automatische technische herstelvoorziening. Zij vervangt geen onafhankelijke archiefkopie, vastgelegde bewaartermijn of goedgekeurde RPO/RTO. In deze taak is daarnaast een onafhankelijke portable export in de bestaande Drive-projectmap opgeslagen en teruggelezen. Een toekomstige restore voor echte gebruikers vereist nieuwe gecontroleerde authenticatie en toepassing van actuele verwijderbesluiten vóór het openen van toegang.

## Aanvulling MFA en beheer, 1 november 2026

Wachtwoord plus verplichte authenticatorcode, eenmalige herstelcodes, beheerreset, revocatie en duurzame foutisolatie zijn op de afzonderlijke fictieve staging uitgevoerd. Zie `MFA-EN-BEHEER.md` voor actuele codepaden, schema 5, bewijzen en operationele grenzen. De huidige test- en acceptatiestand staat in `PROJECTVERSLAG.md` en `ACCEPTATIE-72.md`; oudere logbestanden zijn historische bewijzen.
