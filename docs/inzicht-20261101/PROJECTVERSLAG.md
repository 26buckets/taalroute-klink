# KLINK INZICHT — staging met MFA

1 november 2026. Alleen fictieve gegevens. Geen merge of productiepublicatie.

## Review en toegang

- Staging: https://klink-inzicht-pr8-staging.nico-554.workers.dev/inzicht
- Draft PR: https://github.com/26buckets/taalroute-klink/pull/8
- Projectmap: https://drive.google.com/drive/folders/1DpH2ChwgYsST5Tv_Dlf64ej-sn2rCjlF
- Actuele stagingdeployment: `07b76637-7961-409e-8ab2-2543b2a0ab17`, schema 5.
- De lokale bestanden `KLINK-INZICHT-STAGING-TOEGANG.txt` en `KLINK-INZICHT-MFA-TOEGANG.txt` geven Nico toegang tot de zes fictieve testaccounts. Wachtwoorden, MFA-sleutels en herstelcodes blijven buiten Git en Drive.

## Gebouwd en behouden

Bronnen 00/03/01/02 en KLINK 2.0 zijn volledig gelezen en opgenomen met bronmanifest; R2 > R1 > v1.0 blijft normatief. De echte repository en Cloudflare-architectuur zijn geïnspecteerd. D1 is een gecontroleerde uitbreiding van de aanwezige SQL-infrastructuur. Schoolgegevens worden duurzaam bewaard op een afzonderlijke EU-stagingdatabase, met vijf geordende migraties in Git. De productiedatabase is ongewijzigd.

De bestaande uitvoering bevat klassen, voorlopige cursisten, expliciete accountkoppeling, observatierevisies, vaardighedenmatrix en individuele leerbewijzen, klas-/cursisttoegang, opdrachten en deterministische lesadviezen met docentgoedkeuring. Planning/intrekken, klasstandaard herstellen, toegestaan vrij oefenen en onderwijsrapporten werken. De catalogus bevat drie gecontroleerde bestaande oefeningen; volledige contentmapping, gevalideerde meetrubrics en het persoonlijke SQL-paspoort zijn nog niet af.

Deze ronde voegt verplichte authenticator-MFA toe aan de native wachtwoordlogin van zes fictieve identiteiten. Een wachtwoord alleen opent geen dossier. TOTP-geheimen zijn afzonderlijk versleuteld, herstelcodes eenmalig en gehasht, vooraanmeldingen kort geldig en begrensd. Oude sessies, verlopen codes, replay, wachtwoordrotatie en factorreset zijn gecontroleerd. Gelijktijdige bevestigingen kunnen niet tweemaal slagen. Geen echte persoonsverificatie, SSO of phishingbestendige MFA geclaimd.

Automatische verwerking is per klas geïsoleerd: fouten behouden het werk, krijgen oplopende herhaalvertraging en blokkeren andere klassen niet. Schoolbeheer/support zien uitsluitend eigen-school administratieve tellers en tijdstippen. Een externe alarmdienst en volledig schoolbeheer zijn hiermee niet gerealiseerd. Verzoekbodies zijn ook tijdens het lezen op grootte begrensd.

Klink+Docent, de oorspronkelijke oefenspeler, content, productroutes, persoonlijke opslag en vormgevingsvloer blijven ongewijzigd. De gedeelde header, stijlen en 42 benodigde assets blijven behouden. De aparte bestaande app op inzicht.taalroute.nl en haar database zijn niet aangepast of gekoppeld; consolidatie vraagt een productbeslissing.

## Getest

- 49 lokale unit/API/auth/MFA/securitytests en 27 bestaande Klink+Docent-regressietests geslaagd. TypeScript, gerichte lint, normale productbouw en afzonderlijke stagingbouw geslaagd.
- Online Chromium en WebKit: docent- en cursistflow, duurzame opslag, accountkoppeling, observatiecorrectie, matrix/bewijs, beleid, opdrachten, lesadvies, planning/intrekken, vrij oefenen, rapporten en netwerkonderbreking/herhalen.
- Beide browsers: MFA-inschrijving, onjuiste code, eenmalig herstel, focus en gerichte automatische toegankelijkheidscontrole. Servertests: secure cookies, password-only weigering, oude sessies/challenges, reset, rotatie, dubbele bevestiging en schoolisolatie. Gedeeld apparaat getest met uitloggen, terug/vooruit, herladen en nieuw account.
- Werkelijke HTML/script- en CSV-formule-invoer getest in beide browsers: tekst blijft inert, CSV neutraliseert formules, JSON levert de oorspronkelijke tekst als download. Geen onafhankelijke pentest geclaimd.
- Schema 3 → 5 behoudt alle velden van alle 24 onderwijstabellen. Nieuw online snapshot volledig gelijk hersteld in SQLite, aparte D1 en lokale PostgreSQL. D1 Time Travel na opzettelijke mutatie uitsluitend op de herstel-DB geslaagd. Na herstel vereisen alle zes fictieve gebruikers nieuwe wachtwoorden en nieuwe MFA; onderwijschecksum blijft gelijk.
- Schaalproef 30 cursisten × 100 vaardigheden, 3000 TRAIN-events: API 254–362 ms; zes volledige browsernavigaties/renderingen 1560–4911 ms. Alle vijf vaardigheidspagina's en bewijslinks gecontroleerd. Twee-secondengrens NIET gehaald; KI035 blijft DEELS. Geen garantie voor geforceerde cold-starts of gelijktijdige scholen. Tijdelijke schaalfixtures zijn verwijderd.
- 72 acceptatiecases: 53 GETEST, 16 DEELS, 3 OPEN. Zie `ACCEPTATIE-72.md`; geen vervanging voor menselijke goedkeuring.

Alle zware controles draaiden lokaal. Vóór push zijn nul GitHub Actions-workflows aangetroffen; geen workflow of betaald budget toegevoegd. Het bestaande D1-aantallimiet is niet verhoogd. De eigen ongebonden fictieve herstel-DB is na exacte inhoudscontrole en back-up hergebruikt; staging en productie zijn niet gewist.

## Open grenzen

Echte accountactivatie/identiteitscontrole, identity lifecycle en herstelbevoegdheid, onafhankelijke security-/toegankelijkheidsreview, docent-/didactische pilot, grondslag/DPIA/retentie, verwijdering uit back-ups/tombstones, periodieke onafhankelijke back-ups, operationele alarmering en ondertekende RPO/RTO blijven nodig. De snelheidsgrens is afzonderlijk zichtbaar in KI035. Geen merge, productiepublicatie of echte cursistgegevens zonder afzonderlijke toestemming en de vereiste beoordeling.

## Overdracht

`MFA-EN-BEHEER.md` beschrijft de echte codepaden, cryptografische keuzes, resets, migraties en herstelgrenzen. `ONLINE-STAGING.md`, `HERSTEL.md`, `SECURITY-PRIVACY.md`, de 72 cases en `evidence/` bevatten controlebewijs. Het pakket bevat bronbestanden, reviewpatch, incrementele Git-bundle, screenshots, credentialvrij schema-5-snapshot en geteste PostgreSQL-import. De bundle vereist de vermelde basiscommit. `OPLEVERING.json` legt broncommit/deployment en bestandshashes vast; uploadcontrole vergelijkt teruggelezen Drive-bytes. Oude logs zijn historische bewijzen, niet automatisch bewijs van de laatste build.

De herstelset is een geteste momentopname van 1 november 2026, 03:46 UTC; latere browserproeven voegen alleen fictieve testrecords toe. Tijdens afronding stond upstream main vier commits verder (`fcee5727`), zonder wijzigingen aan Inzicht, Vite-configuratie of packagebestanden. De reviewbranch blijft op de vastgelegde basis; integratie met de actuele hoofdbranch hoort bij een afzonderlijke mergebeoordeling.
