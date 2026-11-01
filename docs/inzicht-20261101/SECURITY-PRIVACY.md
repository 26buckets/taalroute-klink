# Security-, privacy- en operationele poorten

Dit document registreert implementatie en open beslissingen. Het is geen juridische goedkeuring. Er zijn uitsluitend synthetische testgegevens verwerkt; de bestaande remote database is alleen op schemaniveau geïnspecteerd.

## Vervolgstatus online staging

De afzonderlijke online testomgeving is uitsluitend met fictieve accounts ingericht. Echte wachtwoordcontrole, host-only Secure/HttpOnly-cookies, rate limiting, account- en sessie-intrekking, gedeeld-apparaatcontrole en credentialrotatie zijn getest. Lokale testtokens werken er niet. Zie ONLINE-STAGING.md en de auth-/browserbewijzen. De aparte reeds bestaande Inzicht-app en haar accounts zijn niet gebruikt. Echte activatie/identiteitsverificatie en juridische poorten blijven open. Er is geen onbeveiligde fixture-login online gezet.

## Getoetste grenzen

- Iedere API-read/write haalt actuele sessie, user, schoolmembership en rol op; klasacties toetsen docenttoewijzing. School-admin en support krijgen geen onderwijsdossiers. Schoolregistrar krijgt alleen registratiegegevens, geen observaties.
- Samengestelde foreign keys blokkeren verwijzingen naar een andere tenant. Queries gebruiken bindparameters. Geen dynamische tabelnamen uit HTTP. Mutaties gebruiken atomaire D1-batches, organisatieversie en idempotentie; gewijzigde invoer op dezelfde sleutel wordt geweigerd.
- Voorlopige naam is een eigen schoolprofiel. Alleen registrar mag een bestaand schoolaccount uitnodigen of bestaande cursisten indelen. Uitnodiging: 256-bit willekeurig, alleen hash opgeslagen, 30 minuten, exacte membership, eenmalig en alleen na login. Ontkoppelen behoudt bronhistorie en sluit accounttoegang.
- Lokale testsessie: willekeurig token, hash in database, HttpOnly/SameSite Strict cookie; Origin/JSON-controle; begrensde invoer en requestfrequentie. Dit is uitdrukkelijk geen productieauth. Loopback en lokale featureflag zijn verplicht. Geen wachtwoorden, eigen resetmails of magische productielinks gebouwd.
- Alle dataverzoeken no-store/private, Vary Cookie; geen schoolgegevens in browseropslag. Schoolwissel remount de context. Offline opslaan toont een fout en behoudt invoer; herhalen gebruikt dezelfde sleutel. Geen succes vóór bevestigde databasebatch.
- Observaties, evidence en correctieherkomst blijven beschikbaar; herstel maakt de oude versie niet stilzwijgend actueel. Notities worden als tekst weergegeven, geen HTML-injectie; CSV-formuleprefixes worden geneutraliseerd. Audit bevat actor/actie/object/tijd en geen vrije notities of uitnodigingstokens.
- Geen AI-SDK of productdependency toegevoegd. De enige nieuwe browserfetch gaat naar de eigen API; de servermodule bevat geen uitgaande fetch of providerclient. Lesadviezen zijn deterministische functies. Bestaande app-egress is niet methodebreed herontworpen of gecertificeerd.

## Aanvalsgevallen en bewijs

Cross-school URL/export, vreemde klas, onbevoegde docent/admin/support, ingetrokken membership, stale goedkeuring, vervalste/replay invite, dubbele submits, SQL-invoer, ongeldige antwoorden, verlopen/opgeheven klascontext en teruggenomen route staan in `scripts/inzicht/test.mjs`. De twee browserreeksen toetsen docent- en cursistroute, contextwissel, herladen, offline retry en reflow. De herstelsuite weigert corruptie, bestaande doelbestanden en niet-synthetische gebruikers. Dit vervangt geen onafhankelijke pentest.

## Open releasepoorten — geen echte pilot toestaan

1. **Identiteit:** productiekeuze voor identitybeheer (native of SSO); verificatie van identiteit en schooldomein, veilige activatie, MFA voor bevoegde medewerkers (synthetisch getest, nog onafhankelijk te beoordelen), sessierotatie, intrekken, herstel, schooluitdiensttreding en gedeelde apparaten. Geen knop waarmee de lokale fixture-login op internet wordt aangezet.
2. **Privacy:** bevoegde privacyverantwoordelijke tekent doel/grondslag, controller/verwerkerrollen, DPIA-beoordeling, informatie aan cursisten, inzage/correctie/verwijdering, dataminimalisatie en onderstaande retentiematrix. Schoolcontracten, subverwerkers/regio en doorgiften afzonderlijk vaststellen.
3. **Didactiek:** valideer rubrics, minimumitems, onafhankelijkheid/transfer, aandacht, veroudering, 60%-dekking en 3-en-30%-grens. Alle huidige runtimevaardigheden hebben `measurement_approved=0`. Synthetische tests van grenswaarden zijn geen inhoudelijk bewijs van validiteit.
4. **Beheer:** eigenaar, herstelbevoegde, RPO/RTO, back-upschema, versleutelde opslag/toegang, alarmen, fout-/outboxbewaking, verzoekretentie, limieten en incidentprocedure. Globale schoolversie kiest veilige conflictafhandeling boven gelijktijdige schrijfsnelheid; grotere scholen eerst op echte D1-staging belasten. Er is nu een begrensde automatische outbox-consumer en geteste D1 Time Travel-herstelroute. Een onafhankelijke periodieke versleutelde export en operationele alarmdienst zijn nog niet vastgesteld.
5. **Praktijk:** twee bevoegde docenten testen echte taken met fictieve dossiers; keyboard/screenreader en zoom/reflow op afgesproken apparaten, ook light/dark. Automatische axe-controle op enkele schermen is geen WCAG 2.2 AA-certificaat.
6. **Publicatie:** actuele goedgekeurde livebron opnieuw vaststellen, de ingerichte synthetische cloudstaging beoordelen, gehele release lokaal valideren, concreet akkoord van Nico. Deze PR nooit automatisch mergen/publiceren.

## Retentiematrix — te besluiten en te tekenen

| Gegevens | Doel | Verantwoordelijke/grondslag | Termijn/verwijderen | Back-upbehandeling | Status |
|---|---|---|---|---|---|
| Account en schoollidmaatschap | Toegang | Nog vast te stellen | Einde relatie + vastgestelde termijn | Sessies nooit herstellen | OPEN |
| Klas en inschrijving | Schoolorganisatie | Nog vast te stellen | Archiveren is geen wissen; aparte termijn nodig | Verwijderbesluiten opnieuw toepassen vóór toegang | OPEN |
| Observatie/revisie/evidence | Begeleiding | Nog vast te stellen | Schooltermijn en rechtenprocedure nodig | Historie niet ongecontroleerd terugbrengen | OPEN |
| Oefenpoging/opdracht/advies | Leren/begeleiding | Nog vast te stellen | Per categorie beperken | Gecontroleerde restore + controle op verwijderingen | OPEN |
| Audit | Verantwoording/beveiliging | Nog vast te stellen | Minimum noodzakelijke termijn, geen vrije notities | Beperkte afzonderlijke toegang | OPEN |
| Back-ups/export | Continuïteit/overdracht | Nog vast te stellen | Versleuteling, vervaltermijn en vernietigingsbewijs | Geen onbeperkte duplicaten | OPEN |

Het product heeft nog geen goedgekeurde verwijderworkflow/tombstoneregister en back-upverwijderingscontract. Daarom zijn KI055, KI057 en KI071 niet afgerond. Een technisch geslaagde restore maakt deze poort niet groen.

## Samenhang met de Taalroute-ontwerpbasis

De canonieke ontwerpbasis (Drive `1iXr55yHAoIVVtu_J6yZrcqkjKca3USrz`, lokale bronkopie in `sources/`) is in de eindreview geraadpleegd. Inzicht vervangt geen lesbezoekkader en claimt geen methode-, cursus- of taalniveauvrijgave. De huidige drie proefvaardigheden zijn geen vervangende officiële criteria. De verbinding boekdoel → werkelijk ingeroosterde bijeenkomst → docenthandeling → zichtbaar cursistgedrag → materiaal/tijd moet per toekomstige content-/rubrickoppeling nog inhoudelijk worden vastgelegd en beoordeeld. Geen rooster- of duurgegevens worden verzonnen; onbekende duur blijft onbekend. Klink+Docent blijft de bestaande plek voor lesmateriaal, niet een automatische individuele meetbron.

## Aanvulling MFA en beheer, 1 november 2026

Wachtwoord plus verplichte authenticatorcode, eenmalige herstelcodes, beheerreset, revocatie en duurzame foutisolatie zijn op de afzonderlijke fictieve staging uitgevoerd. Zie `MFA-EN-BEHEER.md` voor actuele codepaden, schema 5, bewijzen en operationele grenzen. De huidige test- en acceptatiestand staat in `PROJECTVERSLAG.md` en `ACCEPTATIE-72.md`; oudere logbestanden zijn historische bewijzen.
