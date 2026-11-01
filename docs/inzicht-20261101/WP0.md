# Klink Inzicht — inspectie en besluit, 1 november 2026

Status: broninspectie uitgevoerd; geen productie-uitrol. Norm: R2 > R1 > v1.0.

## Bevestigde basis

- GitHub lees-/schrijftoegang: `gh repo view 26buckets/taalroute-klink` slaagt; default `main`.
- Ontwikkelbasis: `9b4e0937dcad82e14e25ebc97e8a4b08b244042f`, na ophalen van de tijdens discovery bijgewerkte main.
- Werkelijk live: `/release.json` geeft `dd3e3528b57ed9edcee4f99361dddbe3ab43da71`; Cloudflare deployment `04aa530c-f390-47b9-8179-16f46e402289`. Deze commit is een voorouder van de ontwikkelbasis.
- Vinext/React, Cloudflare Worker, SQLite/D1 via `vite.config.ts`, `db/index.ts`, `db/schema.ts`, `drizzle/0000_daily_nightmare.sql`.
- D1 `taalroute-klink`, ID `0e67ae90-83e1-4506-af60-287a40bf08ef`, WEUR, jurisdiction niet ingesteld. Schema op afstand uitsluitend via sqlite_master gelezen: attempts, mastery, review_items. Geen persoonsgegevens opgehaald.
- Worker heeft uitsluitend binding DB; geen bestaande identity-, sessie-, school-, KV-, R2- of queuebinding aangetroffen. Time Travel-bookmark uitleesbaar; dit bewijst geen geteste herstelprocedure.
- `app/api/attempts/route.ts` en `app/api/review-items/route.ts` geven 410. README en `components/product/entry-design.tsx` bevestigen openbare oefencodes, geen persoonlijke authenticatie.
- Voortgang: `lib/learner-progress.ts`, `lib/round-progress.ts`, lokale browseropslag; docentbordstatus `lib/teacher-classroom.ts`, sessionStorage. Niet migreren of aan een persoon koppelen.
- Open PRs: #1 sociale kaarten, #5 Klink+Docent, #6 contentimport. Niet gewijzigd. GitHub Actions: nul workflows; geen Actions nodig voor deze opdracht.
- De oude Drive KPD-index noemt een niet-live concept; huidige main/publicatieregister bevat inmiddels 58 gepubliceerde docentlessen. De index is historische context, geen actuele runtimewaarheid.

## Architectuurbesluit I-001

Behoud D1 en de bestaande Worker/codebase. Er is een werkende, kleine SQL-basis; een tweede Postgres-productieplatform zou nu extra identiteit, beheer en deployment introduceren zonder vastgesteld capaciteitsprobleem. Voeg gedeelde users/organizations/memberships/groups alleen toe omdat zij aantoonbaar ontbreken. De oude demotabellen blijven intact en worden niet als betrouwbare leerbewijzen gebruikt.

Staging gebruikt een afzonderlijke lokale D1-database met duurzame opslag en synthetische identiteit. Geen zelfgebouwde wachtwoordauthenticatie en geen openbare fixture-login. De productieflag blijft uit. Een beheerde authprovider, MFA/herstel, veilige activatie en daadwerkelijke accountidentificatie moeten afzonderlijk geïntegreerd en beoordeeld worden voordat echte accounts mogelijk zijn. De bestaande oefencode is daarvoor ongeschikt.

Schema in Git, samengestelde tenant-FKs, serverrechten bij ieder verzoek, append-only revisies en outbox, parametergebonden SQL, versiecontroles. Portabiliteit: expliciete SQL-kolommen en neutrale tekst/integers, export met schema/versie/hash, herstel in SQLite én daadwerkelijke proef in lokale PostgreSQL. Geen claim dat een D1-export zonder omzetting PostgreSQL-SQL is.

## D01–D12 gapmap

| Onderdeel | Werkelijk bestaand | Nieuw nodig |
|---|---|---|
| D01–D03 dashboard/klassen | Geen serverklassen; docentbord is lesmateriaal | Schoolrechten, klassen, voorlopige cursisten |
| D04 oefenzoeker | `lib/package-content.ts`, `lib/standard-practice.ts`, publicatiepoorten | Versiegebonden Inzicht-index met TRAIN/MEASURE en entitlement |
| D05–D07 opdrachten/resultaten | Oefenspelers en apparaatvoortgang | Schoolgebonden opdracht/context/resultaatopslag |
| D08–D10 dossier/feedback/bewijs | Geen beveiligd schooldossier | Observaties, individuele bewijsherkomst; geen certificaatuitgifte |
| D11 digibord | `components/product/teacher-classroom.tsx` | Niets; volledig behouden |
| D12 docenthulp | `app/docenten/*` | Alleen bestaande links hergebruiken |

## Wijzigingsbereik en risico

Nieuwe module onder `lib/inzicht`, UI onder `app/inzicht`, API onder `app/api/inzicht`, additive SQL onder `db/migrations/inzicht`, lokale start-/test-/hersteltools onder `scripts/inzicht`. Bestaande productieconfig krijgt uitsluitend een expliciete lokale stagingkeuze. Geen wijziging aan spelers, content, media, de oude API's, lokale voortgang, uiterlijkreferenties of Klink+Docent. Belangrijkste risico's: schooloverschrijdende toegang, onterechte accountkoppeling, foutieve beheersingsclaim, verouderde goedkeuring, verlies van historie. Tests richten zich daarop.

De voorgeschreven DigiBord-stijlmap `/Users/nicoknoester/Taalroute/Apps/Stijlsheet/digibord-settings` is hier niet aanwezig. Bestaande actuele Klink-tokens, knoppen en Lucide-iconen zijn de concrete stijlbron; geen herindeling van bestaande schermen.

## Open poorten

Beheerde echte authenticatie/activatie; DPIA/grondslag/retentie/controller-verwerker; didactische validatie rubrics/60%-dekking/3-en-30%-norm; twee echte docenten en assistieve gebruikerstests; operationele eigenaar/RPO/RTO/monitoring; expliciete merge en productiepublicatie. Geen hiervan wordt door synthetische tests afgetekend.

## Bijgewerkte reviewbasis

Tijdens deze taak verscheen main `51f4cbcfe704a2358d80e95988f363da50bd634c` met afzonderlijk goedgekeurde synoniemenwijzigingen. De lokale ontwikkelbranch is daarop gebaseerd vóór de eerste Inzicht-commit, zonder main te wijzigen. De nieuwe appearance-floor-aanvulling is gelezen; Inzicht verandert deze productbestanden niet. De drie proefcatalogus-items blijven versiegebonden aan hun gecontroleerde bron uit `9b4e0937...`; de oefeninginhoud is gelijk. De relevante lokale suites zijn na het bijwerken opnieuw uitgevoerd.

Laatste read-only livecontrole op 1 november: `/release.json` bevestigt inmiddels ook `51f4cbcfe704a2358d80e95988f363da50bd634c`. Dit is de definitieve PR-basis; zie `evidence/live-reference.json`. Geen Inzicht-publicatie uitgevoerd.
