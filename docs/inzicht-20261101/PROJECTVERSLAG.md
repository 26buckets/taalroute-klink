# KLINK INZICHT — uitvoering en online staging

1 november 2026. Vervolg op de lokale implementatie. Uitsluitend fictieve gegevens; geen merge en geen productiepublicatie.

## Review en openen

- Testomgeving: https://klink-inzicht-pr8-staging.nico-554.workers.dev/inzicht
- Draft PR: https://github.com/26buckets/taalroute-klink/pull/8
- Bronnen en herstelarchief: https://drive.google.com/drive/folders/1DpH2ChwgYsST5Tv_Dlf64ej-sn2rCjlF
- Het afzonderlijke lokale bestand `KLINK-INZICHT-STAGING-TOEGANG.txt` bevat de fictieve testaccounts. Wachtwoorden, sessies en ruwe database-export met credentialhashes worden niet meegeleverd in Git of Drive.

## Uitgevoerd

De volledige bronset 00/03/01/02 en KLINK 2.0 is gelezen en bewaard met bronmanifest. Normatieve prioriteit blijft R2 > R1 > v1.0. De echte Klink-repository en Cloudflare-opzet zijn geïnspecteerd. D1 is gekozen als gecontroleerde uitbreiding van de aanwezige SQL-infrastructuur. De bestaande productiedatabase is niet veranderd. Nieuwe schoolgegevens staan permanent op een afzonderlijke EU-stagingdatabase, met drie migraties in Git.

De module bevat klassen, voorlopige cursisten, expliciete accountkoppeling, duurzame observatierevisies, vaardighedenmatrix en individuele leerbewijzen, leerroutetoegang en uitzonderingen, opdrachten en transparante deterministische lesvoorstellen. De docent bevestigt wijzigingen; er is geen AI in de runtime. Drie bestaande oefeningen vormen de gecontroleerde catalogus. De volledige catalogus, gevalideerde meetrubrics en het persoonlijke SQL-paspoort blijven uitbreidingswerk.

Deze vervolgronde voegt echte wachtwoordlogin voor zes fictieve identiteiten toe: gezouten scrypt, server-side sessies, beveiligde cookies, begrensde loginpogingen, uitloggen en geteste wachtwoordrotatie. Er is geen echte persoonsverificatie of MFA geclaimd. Ook zijn opdrachtplanning/intrekken, terugkeer naar de klasstandaard, toegestaan vrij oefenen en een compleet onderwijsrapport per klas toegevoegd. Een timer verwerkt open voortgangswerk iedere vijf minuten, begrensd per run.

De stagingrouter is gescheiden van het oorspronkelijke product. De oorspronkelijke header, stijlen en 42 benodigde assets worden hergebruikt en bytegelijk gecontroleerd. Het bestaande Klink+Docent, productroutes, vormgevingsvloer, inhoud en persoonlijke opslag zijn niet gewijzigd. De knop voor Klink+Docent verwijst naar de bestaande app. De aparte reeds bestaande app op inzicht.taalroute.nl en haar eigen database zijn alleen geïnspecteerd, niet gewijzigd. Een eventuele samenvoeging is een latere productbeslissing.

## Controlebewijs en grenzen

- 37 unit-, API-, auth- en beveiligingscontroles geslaagd; 27 bestaande docentregressiecontroles geslaagd.
- TypeScript, gerichte lint, gewone productiebouw en afzonderlijke stagingbouw geslaagd. De normale configuratie behoudt uitsluitend de oorspronkelijke Klink-binding en heeft geen Inzicht-modus.
- Chromium en WebKit: docent- en cursistflow, blijvende opslag na herladen, correctiehistorie, matrix, beleid, opdrachten, lesvoorstellen, netwerkonderbreking/herhalen, gerichte automatische toegankelijkheidscontrole en responsieve weergave.
- Aanvullend beide browsers: planning, intrekken, klasstandaard, vrij oefenen, onderwijsrapport, uitloggen plus terug/vooruit/herladen en dossierisolatie bij accountwisseling. Loginpagina gecontroleerd op desktop/mobiel, licht/donker, alle oorspronkelijke headerlogo's en gescheiden hashroute.
- Online autorisatieproeven: anonieme dossieraanvragen geweigerd, andere school afgeschermd, verkeerde Origin geweigerd, lokale tokenlogin online uitgeschakeld, uitgelogde sessie ongeldig. Wachtwoordrotatie maakt oud wachtwoord en oude sessies ongeldig.
- Getest herstel van een werkelijk online synthetisch snapshot: alle 24 tabellen en waarden gelijk in SQLite, aparte Cloudflare D1 en PostgreSQL. D1 Time Travel terugzetten na een opzettelijke wijziging op uitsluitend de herstel-DB is gecontroleerd. Authgegevens zijn bewust niet teruggezet.
- Schaalproef: 30 fictieve cursisten × 100 vaardigheden, 3000 TRAIN-events; vijf volledige API-antwoorden inclusief netwerk 235–527 ms. Fixtures daarna verwijderd. Dit bewijst geen cold-start-, gelijktijdigheids- of volledige browserrender-SLO.
- Acceptatieboekhouding: 72 cases, 51 GETEST, 18 DEELS, 3 OPEN. Zie `ACCEPTATIE-72.md`; een teststatus vervangt geen menselijke goedkeuring.

Alle zware controles zijn lokaal uitgevoerd. De gecontroleerde repository heeft nul GitHub Actions-workflows; deze ronde voegt er geen toe. Geen betaald Actions-budget gewijzigd. Accountbreed minutenverbruik is niet aan deze taak toegeschreven.

## Nog niet vrijgegeven

Echte cursisten, MFA/SSO en identity lifecycle, onafhankelijke security-/toegankelijkheidsreview, docent-/didactische pilot, grondslag/DPIA/retentie, verwijdering uit back-ups, operationele alarmen, periodieke onafhankelijke back-ups en ondertekende RPO/RTO blijven open. Het bewezen herstel is een point-in-time proef; het is geen afgetekende operationele back-updienst. Geen merge, productiepublicatie of echte persoonsgegevens zonder afzonderlijke toestemming en de vereiste beoordeling.

## Overdracht

`ONLINE-STAGING.md` beschrijft bediening en echte codepaden. `HERSTEL.md`, `SECURITY-PRIVACY.md`, `WP0.md`, de 72 cases en `evidence/` bevatten migratie-, veiligheids- en testbewijs. Het archief bevat een reviewpatch, incrementele Git-bundle ten opzichte van de gecontroleerde hoofdbranch, bronbestanden, scripts, screenshots, het geteste credentialvrije snapshot en PostgreSQL-import. De bundle vereist de vermelde basiscommit uit de bestaande repository. `OPLEVERING.json` legt broncommit, deploymentversie en bestanden vast; de afzonderlijke uploadcontrole vergelijkt de werkelijk teruggelezen Drive-bytes.
