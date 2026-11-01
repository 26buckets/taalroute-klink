# SQL-migratie, back-up, herstel en rollback

## Huidige grens

Uitsluitend lokale synthetische staging. De productie-D1 is niet gemigreerd. Geen down-migratie, DROP of destructieve rollback toegevoegd. Er zijn twee geordende schemafiles in Git; de eerste voegt de nieuwe tabellen toe, de tweede server-side schoolpogingen. Bestaande demotabellen worden niet gebruikt of veranderd.

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

Sessies, uitnodigingen, rate-limitbuckets, mutatieguards en requestreplay-antwoorden worden niet hersteld. Daarmee komen oude toegangstokens niet terug. Herstel vereist nieuwe sessies; `sessions.mjs` is uitsluitend voor de vaste synthetische gebruikers. Geen echte auth-subjects migreren zonder mapping en gecontroleerde herverificatie.

Bewijs: `evidence/restore-results.json` (echte D1-snapshot met observatierevisies) en `portable-test-results.json` (herhaalbare SQLite/PostgreSQL-proef inclusief corruptie en overschrijfweigering). Het herstelpakket bevat de synthetische exports, nooit de lokale credentials.

## Runbook vóór een echte pilot — nog niet operationeel afgetekend

1. Eigenaar en plaatsvervanger vastleggen; RPO/RTO expliciet laten goedkeuren. De gemeten lokale proef is geen cloud-RTO-belofte.
2. Back-upplanning, sleutelbeheer, opslag/regio, toegangslog en automatische herstelcontrole instellen. Cloudflare Time Travel alleen is geen onafhankelijke overdrachtsback-up.
3. Bij herstel schrijfverkeer stoppen/isoleren; een nieuwe doeldatabase gebruiken. Controleer exporthash, schema, aantallen, referenties, tenantrechten, actuele verwijderbesluiten en identitymapping. Pas verwijderbesluiten toe vóór enig account toegang krijgt.
4. Login/sessies/intrekkingen opnieuw verifiëren. Privacy- en beheereigenaar tekenen herstelcontrole; dan pas gericht verkeer omschakelen.
5. Applicatierollback schakelt de module uit met behoud van schema/evidence. Productierollback vereist aparte expliciete opdracht en actuele publicatiebasis. Geen oudere app over live gegevens heen zetten.
6. Leg herstelduur, verliesvenster, testresultaten en verwijderingscontrole vast. Wis tijdelijke herstelkopieën volgens de goedgekeurde retentietermijn.

Nog open: automatische versleutelde cloudback-ups, herstel van een echte remote D1 naar een afzonderlijke cloudstaging, goedgekeurde RPO/RTO, verwijderbesluiten/tombstones en een migratie van de runtime-adapter naar PostgreSQL. De data-overdracht is getest; de app zelf draait nog op D1, niet op PostgreSQL.
