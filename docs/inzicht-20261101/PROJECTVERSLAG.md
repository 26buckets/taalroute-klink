# KLINK INZICHT — snelheid en technische afronding op staging

1 november 2026. Alleen fictieve gegevens. Geen merge of productiepublicatie.

## Review en toegang

- Staging: https://klink-inzicht-pr8-staging.nico-554.workers.dev/inzicht
- Draft PR: https://github.com/26buckets/taalroute-klink/pull/8
- Projectmap: https://drive.google.com/drive/folders/1DpH2ChwgYsST5Tv_Dlf64ej-sn2rCjlF
- Actuele stagingdeployment: `a078ad0a-9adc-4b1c-ab5c-fbd870b75e21`, schema 5. De laatste lokale kandidaat is nog niet gedeployed: de verplichte schemacontrole stopt op het D1-dagquotum.
- De lokale bestanden `KLINK-INZICHT-STAGING-TOEGANG.txt` en `KLINK-INZICHT-MFA-TOEGANG.txt` geven Nico toegang tot de zes fictieve testaccounts. Wachtwoorden, MFA-sleutels en herstelcodes blijven buiten Git en Drive.

## Actuele vervolgopdracht: snelheid en techniek

Dit is de uitvoering van de ontwerpchat **KLINK: Docentdashboard ontwerpen**, onder de naam Klink Inzicht. Klink+Docent blijft uitsluitend de afzonderlijke materialen-/digibordfunctie.

De docentenmatrix haalt klasgegevens en matrix gelijktijdig op. Inzicht-links halen niet langer tientallen ongeopende dossiers op de achtergrond op. De grote bestaande oefenspeler wordt pas geladen wanneer de cursist daadwerkelijk een oefening opent. Statische assets worden rechtstreeks door Cloudflare Assets geleverd, met noindex- en veiligheidsheaders. De uiteindelijke schermindeling en vormgevingsvloer zijn behouden.

Dezelfde schaalproef met 30 cursisten, 100 vaardigheden en 3000 fictieve TRAIN-events is voor en na uitgevoerd. De mediaan van zes browserruns daalde van **4830,5 naar 2400,5 ms** (ongeveer 50%). De laatste runs waren 2454, 5714, 2347, 2828, 2205 en 2159 ms; API 432–697 ms. Dit is een beperkte reeks, geen gegarandeerde halvering voor iedere gebruiker. De norm van twee seconden is **niet gehaald**, KI035 blijft DEELS. Bewijs: `evidence/speed/before.json`, `after.json`; gemeten deployment `7a3424e1-b55b-4a1c-abd5-420fc53228f1`.

Het vertraagd laden van de speler is in Chromium en WebKit met een werkelijk afgebroken moduleverzoek getest: een duidelijke foutmelding verschijnt, teruggaan blijft mogelijk en Opnieuw openen herstelt de speler zonder extra oefenpoging. WebKit hield aanvankelijk een mislukte modulepreload vast; alleen voor deze dynamische speler zijn JavaScript-preloads vervangen door de eigen module-import. CSS en eerste HTML-preloads blijven behouden. `player-loading-browser.mjs` en `evidence/speed/player-loading.json` bevatten de proef. Een tijdelijke server-prefill van het account is teruggedraaid en zit niet in de oplevering.

Auth en MFA gebruiken nu expliciet de bestaande Node Buffer-import. Een gerichte test zonder globale Buffer bevestigt dat wachtwoordcontrole, TOTP en versleuteling blijven werken. Geen nieuwe afhankelijkheid, schemawijziging, wachtwoord- of factorrotatie.

**Online blokkade:** Cloudflare meldt een dagelijkse D1-schrijflimiet. Herhaalde zware schaalproeven met geïndexeerde fixtures hebben aan het verbruik bijgedragen. Metadata van alle accountdatabases samen gaf 218.998 geschreven rijen in de voortschrijdende 24 uur. Dit is accountbreed, geen exclusieve toeschrijving aan deze taak; evenmin is het een telling vanaf UTC-middernacht. Nieuwe native login en de verplichte deployment-schemacontrole worden momenteel geweigerd. Dit bewijst geen fout wachtwoord. Er is geen betaald abonnement, quotumverhoging of omzeiling toegepast.

De nieuwste lokale code vertaalt deze specifieke D1-daglimiet naar HTTP 503 met begrensde Retry-After, zonder ruwe databasemelding. Deze foutafhandeling is lokaal getest maar **nog niet online uitgerold**. De schaaltest controleert voortaan eerst accountbrede schrijfmetadata en stopt vóór fixtureaanmaak vanaf 50.000 rijen/24 uur. Dit houdt conservatief ruimte over voor indexen, opruimen en andere apps; het is geen garantie tegen gelijktijdig verbruik. Deze blokkade is daadwerkelijk getest. De gratis daglimiet herstart om 00:00 UTC (2 november 2026 om 01:00 Nederlandse tijd); de conservatieve 24-uurscontrole kan langer blokkeren. Bron: https://developers.cloudflare.com/d1/platform/pricing/

De nieuwste kandidaat heeft **55 lokale unit/API/auth/MFA-tests**, 27 bestaande Klink+Docent-regressies, TypeScript, gerichte lint, normale productbouw en stagingbouw doorstaan. De publieke loginweergave is online in beide engines op desktop/mobiel en licht/donker gecontroleerd, inclusief logo's en overloop. Een nieuwe volledige docent-cursistproef na de laatste wijzigingen is **niet voltooid** wegens de limiet. De eerdere volledige proef hieronder hoort bij commit e14b33aa, niet bij deze nieuwste kandidaat.

Een actuele serverexport van 1 november 2026, 10:03 UTC is credentialvrij gemaakt: 24 onderwijstabellen, schema 5. Alle rijen zijn opnieuw gelijk hersteld in lokale SQLite en PostgreSQL; corrupte export en overschrijven worden geweigerd. Geen nieuwe remote herstel- of Time Travel-proef wegens de quota. Ruwe auth-export en sleutels blijven privé buiten Git/Drive. De huidige herstelset en `evidence/speed/portable.json` gaan mee in het pakket.

Echte codepaden: `components/inzicht/app.tsx`, `components/inzicht/school.tsx`, `vite.config.ts`, `lib/inzicht/auth.ts`, `lib/inzicht/mfa.ts`, `lib/inzicht/service.ts`, plus `scripts/inzicht/online-budget.mjs`, `performance-online.mjs`, `deploy-staging.mjs`, `staging-assets.mjs`, `online-probe.mjs` en `auth-test.mjs`. De exacte broncommit en hashes staan in het oplevermanifest. Geen wijzigingen aan de oorspronkelijke spelerbestanden, content, Klink+Docent, migraties of productieconfiguratie. Nul GitHub Actions-workflows aangetroffen vóór push; alle zware controles lokaal.

## Eerdere uitvoering en bewijzen (historisch)

De volgende paragrafen beschrijven eerdere geslaagde proeven. Ze vervangen niet de geblokkeerde herhaling van de actuele kandidaat.

## Gebouwd en behouden

Bronnen 00/03/01/02 en KLINK 2.0 zijn volledig gelezen en opgenomen met bronmanifest; R2 > R1 > v1.0 blijft normatief. De echte repository en Cloudflare-architectuur zijn geïnspecteerd. D1 is een gecontroleerde uitbreiding van de aanwezige SQL-infrastructuur. Schoolgegevens worden duurzaam bewaard op een afzonderlijke EU-stagingdatabase, met vijf geordende migraties in Git. De productiedatabase is ongewijzigd.

De bestaande uitvoering bevat klassen, voorlopige cursisten, expliciete accountkoppeling, observatierevisies, vaardighedenmatrix en individuele leerbewijzen, klas-/cursisttoegang, opdrachten en deterministische lesadviezen met docentgoedkeuring. Planning/intrekken, klasstandaard herstellen, toegestaan vrij oefenen en onderwijsrapporten werken. De catalogus bevat drie gecontroleerde bestaande oefeningen; volledige contentmapping, gevalideerde meetrubrics en het persoonlijke SQL-paspoort zijn nog niet af.

De eerdere MFA-ronde voegde verplichte authenticator-MFA toe aan de native wachtwoordlogin van zes fictieve identiteiten. Een wachtwoord alleen opent geen dossier. TOTP-geheimen zijn afzonderlijk versleuteld, herstelcodes eenmalig en gehasht, vooraanmeldingen kort geldig en begrensd. Oude sessies, verlopen codes, replay, wachtwoordrotatie en factorreset zijn gecontroleerd. Gelijktijdige bevestigingen kunnen niet tweemaal slagen. Geen echte persoonsverificatie, SSO of phishingbestendige MFA geclaimd.

Automatische verwerking is per klas geïsoleerd: fouten behouden het werk, krijgen oplopende herhaalvertraging en blokkeren andere klassen niet. Schoolbeheer/support zien uitsluitend eigen-school administratieve tellers en tijdstippen. Een externe alarmdienst en volledig schoolbeheer zijn hiermee niet gerealiseerd. Verzoekbodies zijn ook tijdens het lezen op grootte begrensd.

Klink+Docent, de oorspronkelijke oefenspeler, content, productroutes, persoonlijke opslag en vormgevingsvloer blijven ongewijzigd. De gedeelde header, stijlen en 42 benodigde assets blijven behouden. De aparte bestaande app op inzicht.taalroute.nl en haar database zijn niet aangepast of gekoppeld; consolidatie vraagt een productbeslissing.

## Getest

- 52 lokale unit/API/auth/MFA/securitytests en 27 bestaande Klink+Docent-regressietests geslaagd. TypeScript, gerichte lint, normale productbouw en afzonderlijke stagingbouw geslaagd.
- Online Chromium en WebKit: docent- en cursistflow, duurzame opslag, accountkoppeling, observatiecorrectie, matrix/bewijs, beleid, opdrachten, lesadvies, planning/intrekken, vrij oefenen, rapporten en netwerkonderbreking/herhalen.
- Beide browsers: MFA-inschrijving, onjuiste code, eenmalig herstel, focus en gerichte automatische toegankelijkheidscontrole. Servertests: secure cookies, password-only weigering, oude sessies/challenges, reset, rotatie, dubbele bevestiging en schoolisolatie. Gedeeld apparaat getest met uitloggen, terug/vooruit, herladen en nieuw account.
- Werkelijke HTML/script- en CSV-formule-invoer getest in beide browsers: tekst blijft inert, CSV neutraliseert formules, JSON levert de oorspronkelijke tekst als download. Geen onafhankelijke pentest geclaimd.
- Schema 3 → 5 behoudt alle velden van alle 24 onderwijstabellen. Nieuw online snapshot volledig gelijk hersteld in SQLite, aparte D1 en lokale PostgreSQL. D1 Time Travel na opzettelijke mutatie uitsluitend op de herstel-DB geslaagd. Na herstel vereisen alle zes fictieve gebruikers nieuwe wachtwoorden en nieuwe MFA; onderwijschecksum blijft gelijk.
- Schaalproef 30 cursisten × 100 vaardigheden, 3000 TRAIN-events: API 254–362 ms; zes volledige browsernavigaties/renderingen 1560–4911 ms. Alle vijf vaardigheidspagina's en bewijslinks gecontroleerd. Twee-secondengrens NIET gehaald; KI035 blijft DEELS. Geen garantie voor geforceerde cold-starts of gelijktijdige scholen. Tijdelijke schaalfixtures zijn verwijderd.
- 72 acceptatiecases: 53 GETEST, 16 DEELS, 3 OPEN. Zie `ACCEPTATIE-72.md`; geen vervanging voor menselijke goedkeuring.

Alle zware controles draaiden lokaal. Vóór push zijn nul GitHub Actions-workflows aangetroffen; geen workflow of betaald budget toegevoegd. Het bestaande D1-aantallimiet is niet verhoogd. De eigen ongebonden fictieve herstel-DB is na exacte inhoudscontrole en back-up hergebruikt; staging en productie zijn niet gewist.

## Volledige docent-cursistproef, 1 november 2026

Op expliciete vervolgopdracht is de hele technische keten met fictieve gegevens in Chromium én WebKit doorlopen. In iedere browser maakt de docent via MFA een nieuwe klas met twee voorlopige cursisten, bewaart een observatie en corrigeert die met reden. Beide versies blijven zichtbaar na herladen. De registrar controleert de fictieve identiteit; uitsluitend de bedoelde ingelogde cursist accepteert de uitnodiging. De docent beperkt het aanbod tot opdrachten en bevestigt één opdracht voor één cursist. Die maakt de bestaande woordoefening op een mobiel venster. Ook na afmelden, opnieuw aanmelden met MFA en herladen blijft precies één poging met de status Geoefend bewaard.

De docent controleert de matrix, opent het individuele bewijs en ziet dat algemene observaties plus een geslaagde oefening geen meetbewijs of beheersingsverklaring opleveren. Twee gelijke adviesaanvragen geven dezelfde voorstellen. Alleen de docent keurt de leskeuze goed; er worden geen opdrachten automatisch uitgegeven. Een aparte directe SQL-controle bevestigt per browser één duurzaam lesplan, met de juiste docent, notitie en precies één goedkeuringsaudit. De tweede cursist krijgt de individuele opdracht niet. Registrar/cursist kunnen geen docentdossier lezen; de andere schoolcontext kan deze klas niet openen. Gerichte Axe-controles, mobiel herladen en browserfoutcontrole slagen.

De proef simuleert ook dat de server al heeft opgeslagen maar het antwoord onderweg verloren gaat. In de vorige staging gaf herhalen van accountkoppeling daadwerkelijk HTTP 409. Gerichte regressietests bevestigden dezelfde fout bij lesadvies en leerstoftoegang; de overeenkomstige ontkoppelroute is meegenomen. Hersteld in uitsluitend `lib/inzicht/service.ts`: actuele rol-/school-/klasbevoegdheid blijft vóór de handeling gecontroleerd; statusafhankelijke uitvoeringscontroles staan binnen de bestaande idempotente mutatie. Dezelfde bewaaractie krijgt haar oorspronkelijke antwoord terug. Een nieuw of gewijzigd verzoek blijft gecontroleerd; ingetrokken toegang wordt nooit door herhalen hersteld. Goedkeuren én afwijzen zijn lokaal getest. Online zijn verloren antwoorden bij observatie, koppelen/ontkoppelen, toegangsbeleid, oefenen en goedkeuren opnieuw getest.

Er zijn geen schemawijzigingen, nieuwe afhankelijkheden of UI-/huisstijlwijzigingen. Alle 52 Inzicht-tests en 27 Klink+Docent-regressies slagen, evenals TypeScript, gerichte lint, normale productbouw en stagingbouw. De normale productbouw heeft geen Inzicht-binding en is niet gepubliceerd. De bronhashvergelijking bevestigt dat alleen de Inzicht-service veranderde; Klink+Docent, spelers, MFA-code, assets en vijf migraties blijven behouden. Alle zware controles draaiden lokaal.

Reproduceerbaar via `scripts/inzicht/journey-browser.mjs`; bewijzen en schermbeelden in `evidence/journey/`, inclusief het mislukte verzoek vóór herstel, lokale regressies, twee volledige browserresultaten en de SQL-audit. De eerste testpogingen bevatten ook foutieve testselectors en een te vroege navigatie na afmelden; die zijn in de test zelf gecorrigeerd en zijn geen productdefecten. Dit is een geautomatiseerde technische rolproef, geen didactische pilot met mensen of onafhankelijke beveiligingsreview. De bestaande snelheids- en vrijgavepoorten blijven open; 53 GETEST, 16 DEELS, 3 OPEN verandert niet door extra bewijs voor al geteste gevallen.

## Open grenzen

Echte accountactivatie/identiteitscontrole, identity lifecycle en herstelbevoegdheid, onafhankelijke security-/toegankelijkheidsreview, docent-/didactische pilot, grondslag/DPIA/retentie, verwijdering uit back-ups/tombstones, periodieke onafhankelijke back-ups, operationele alarmering en ondertekende RPO/RTO blijven nodig. De snelheidsgrens is afzonderlijk zichtbaar in KI035. Geen merge, productiepublicatie of echte cursistgegevens zonder afzonderlijke toestemming en de vereiste beoordeling.

## Overdracht

`MFA-EN-BEHEER.md` beschrijft de echte codepaden, cryptografische keuzes, resets, migraties en herstelgrenzen. `ONLINE-STAGING.md`, `HERSTEL.md`, `SECURITY-PRIVACY.md`, de 72 cases en `evidence/` bevatten controlebewijs. Het pakket bevat bronbestanden, reviewpatch, incrementele Git-bundle, screenshots, credentialvrij schema-5-snapshot en geteste PostgreSQL-import. De bundle vereist de vermelde basiscommit. `OPLEVERING.json` legt broncommit/deployment en bestandshashes vast; uploadcontrole vergelijkt teruggelezen Drive-bytes. Oude logs zijn historische bewijzen, niet automatisch bewijs van de laatste build.

De herstelset is een geteste momentopname van 1 november 2026, 03:46 UTC; latere browserproeven voegen alleen fictieve testrecords toe. Tijdens deze vervolgproef stond upstream main elf commits verder (`9b5ca8c9`), zonder wijzigingen aan Inzicht, Vite-configuratie, packagebestanden of workflows. De reviewbranch blijft op de vastgelegde basis; integratie met de actuele hoofdbranch hoort bij een afzonderlijke mergebeoordeling.

Aanvullende herstelkopie na de volledige proef: 2026-11-01T04:41:23.542Z, checksum `2c79bec36ac3b1e90f0cd62d2d6b417f76d0b15f0c7834e07a24195f90ad7402`. Deze actuele credentialvrije onderwijsset is opnieuw veldgelijk hersteld in SQLite en lokale PostgreSQL. De afzonderlijke D1-hersteltest en Time Travel zijn niet opnieuw uitgevoerd; hun eerdere schema-5-bewijs blijft bij de oude geteste herstelset bewaard. Het nieuwe pakket bevat beide duidelijk gescheiden sets. Geen authgeheimen, wachtwoorden of herstelcodes in Drive.
