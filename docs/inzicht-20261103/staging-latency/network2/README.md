# Tweede verbinding — 3 november 2026

**De gewone starttijd is lager; de incidentele vertraging is niet opgelost.** Nico meldde een ander netwerk. Daarop is dezelfde meetreeks op dezelfde Mac en exact dezelfde stagingversie herhaald. Geen code, configuratie, database, deployment of productie gewijzigd.

## Vergelijkbare herhaling

Runtimebron `133791bc85b44e82795d6a5923edcc1b5e4c5675`, Worker `8c071c15-1aab-4afe-87ba-8cb1b3d97d1a` op 100%. De deploymentlijst is vóór en na identiek. De eerste reeks eindigde om 20:44 UTC; de tweede om 22:48 UTC. De netwerkvergelijking is dus niet gelijktijdig of gerandomiseerd. Alleen een samenhang met de nieuwe verbinding is aangetoond, geen zuiver causaal netwerkeffect.

Dezelfde `scripts/inzicht/latency-browser.mjs`: 32 bezoeken, Chromium/WebKit × 1280/390 px × twee herhalingen × twee hosts × eerste/herhaald bezoek. Een eerste bezoek gebruikt een nieuwe browsercontext; het bewijst geen koude Worker. Het eindpunt blijft het zichtbare inlogformulier met aangesloten React-verzendfunctie. De MFA-proef en aanvullende HTTP-metingen draaiden pas daarna, zonder onderlinge overlap.

| Adres/bezoek | Eerste netwerk: mediaan / maximum | Tweede netwerk: mediaan / maximum | n per netwerk |
| --- | ---: | ---: | ---: |
| inzicht-staging, eerste | 442 / 2.124 ms | 280 / 2.393 ms | 8 |
| inzicht-staging, herhaald | 161 / 310 ms | 128 / 2.047 ms | 8 |
| workers.dev, eerste | 549 / 4.246 ms | 240 / 1.855 ms | 8 |
| workers.dev, herhaald | 160 / 1.806 ms | 154 / 1.334 ms | 8 |

Alle 32 bezoeken slagen zonder browserfouten. Op het nieuwe stagingadres blijven drie van acht eerste bezoeken en één van acht herhaalde bezoeken boven één seconde. De hoogste tijden zijn daar niet verbeterd. Geen claim van een betrouwbare p95, SLA of een algemeen opgeloste storing.

Alle 32 nieuwe HTML-antwoorden hebben een AMS-ray; de eerdere reeks had WAW, ARN, CDG, MAN en BOS. Dat ondersteunt een gewijzigde route. Het bewijst geen provideridentiteit of oorzaak. Geen IP-adressen of netwerkidentificerende persoonsgegevens opgeslagen in dit dossier.

## MFA en sessiebehoud

Alle vier echte synthetische MFA-stromen op het nieuwe stagingadres slagen, verdeeld over beide browsers en formaten: wachtwoord, MFA, herladen, andere school afgeschermd met 404 en servermatig afmelden met daaropvolgend 401. Gedeelde D1-schrijfcontrole vooraf: 262 rijen in 24 uur, onder de bestaande reserveringsgrens. Geen migraties of echte cursistgegevens.

| Antwoordtijd | Eerste netwerk: mediaan / maximum | Tweede netwerk: mediaan / maximum | n per netwerk |
| --- | ---: | ---: | ---: |
| Wachtwoordaanmelding | 1.005 / 3.438 ms | 583 / 605 ms | 4 |
| MFA | 254 / 292 ms | 167 / 198 ms | 4 |
| Account lezen | 158 / 189 ms | 110 / 113 ms | 8 |

Deze tijden betreffen het wachten op het HTTP-antwoord, niet de menselijke invoertijd of de volledige onderwijsrapportage. Vier geslaagde MFA-stromen bewijzen niet dat een toekomstige uitschieter onmogelijk is. De eerder geslaagde termijn-/herstelproeven blijven geldig; geen beveiligingsgrenzen versoepeld.

## Piek gekoppeld aan serverregistratie

Na de browserproeven zijn 24 anonieme HTTP-aanvragen gekoppeld aan tijdelijke Cloudflare Worker-registratie via ray-ID: zes afwisselende rondes over beide hosts, telkens `/api/inzicht/me` en `/inzicht`. Alleen een vaste diagnostische header gebruikt, geen sessies of credentials. Alle 12 accountaanvragen antwoorden correct met 401; alle 12 pagina-aanvragen met 200. Alle Worker-uitkomsten zijn `ok`. Alleen geschoonde velden zijn opgenomen; ruwe registratie blijft buiten Git/Drive.

De langzaamste pagina-aanvraag (`a54eef33583ea94a-AMS`, workers.dev) duurt **1.998 ms**, waarvan **127 ms Worker-walltime / 111 ms CPU**. DNS/TLS-verbinding was na 36 ms gereed. De overige circa 1,87 seconde valt buiten de geregistreerde Worker-uitvoering. De 12 accountaanvragen hebben een mediaan van 83 ms, maximum 100 ms en maximaal 3 ms Worker-walltime.

Dat sluit de exacte wachtrij, initialisatie, Cloudflare-doorvoer of transportstap nog niet uit. Het verschil is geen bewijs dat de database, MFA-code, internetprovider of Cloudflare alleen verantwoordelijk is. De ingebouwde `Server-Timing` is niet gebruikt als bewijs van volledige CPU-/walltime; de gekoppelde Worker-registratie is daarvoor de bron.

**Volgende gerichte stap:** laat de resterende lange HTML-aanvragen aan platformzijde onderzoeken met `correlated.json` en de browser-rays. Vraag specifiek naar tijd vóór/naast de geregistreerde Worker-uitvoering, initialisatie en routering. Nog geen bericht aan een externe partij verzonden. Geen sessiedata cachen, MFA uitschakelen, time-outs verruimen of algemene appwijzigingen publiceren om deze piek te maskeren.

## Behoud, herhaling en grenzen

- Klink en Inzicht-productie-releasebestanden zijn bytegelijk aan de vorige ronde. PR10 blijft ongepubliceerd; PR8 blijft draft. Geen GitHub-workflows aanwezig of gestart.
- Alle bronbestanden zijn ongewijzigd. Daarom geen nieuwe volledige bouw, screenshotreeks of unitreeks nodig voor deze uitsluitend aanvullende meting. De eerdere controles blijven apart bewaard.
- Geen fysieke telefoon/tablet, nieuwe volledige Klink/+docent-regressie of volledige beschermde groeirapportages getest in deze ronde.
- `result.json` bevat de bronversie, hashes van de vier bestaande testhelpers, aantallen, vergelijkingen, gekoppelde piek en beperkingen. Overige JSON-bestanden zijn de geschoonde meetgegevens.
- Herhaal de bestaande browsertool met `KLINK_LOGIN_OUTPUT` naar een nieuwe map. Daarna, afzonderlijk, voer `mfa-navigation-browser.mjs` uit met `KLINK_TEST_URL=https://inzicht-staging.taalroute.nl` en `KLINK_MFA_RESULT` naar een nieuw bestand. MFA vereist de bestaande privé-testfactoren; die horen nooit in Git of dit pakket.

De bestaande volledige herstelkopie is Drive-bestand `12FBKl5OsShSv7GkgnDnkrIwUP2bEi8rj`, SHA-256 `35ec80b6df6b4648db80d2a77c99c231e51497e3b12a8812bbd2b78f7bbea5a4`. Deze vervolgmeting vervangt die bron-/herstelkopie niet.
