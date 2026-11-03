# Klink Inzicht — stagingvertraging, 3 november 2026

**Gedeeltelijk verholpen.** Het anonieme inlogscherm wacht niet meer op een overbodig accountverzoek. Wisselende wachttijd buiten de gemeten serververwerking is nog niet volledig verklaard of verholpen. Productie en PR10 zijn ongewijzigd.

## Bereikbaar en gecontroleerd

Staging: https://inzicht-staging.taalroute.nl/inzicht . Het bestaande workers.dev-adres blijft werken. Beide adressen bedienen exact dezelfde Worker `8c071c15-1aab-4afe-87ba-8cb1b3d97d1a`, runtimebron `133791bc`, met dezelfde aparte EU-D1, schema 7 en MFA-secret. Geen SQL-migraties, geen echte cursistgegevens en geen productionele authenticatie-integratie.

De extra route is vóór instelling gecontroleerd: geen conflicterende of te vervangen Cloudflare-domeinen. De bestaande publicatiebewaking is uitgebreid met uitsluitend deze exacte staginghost; productiedomeinen, wildcards en andere databases blijven geblokkeerd. Publicatie verliep via `scripts/inzicht/deploy-staging.mjs --deploy` met de normale secret- en schemacontrole. Configuratie, bron en tests blijven in bestaande PR8.

## Aantoonbare winst

De server geeft uitsluitend bij afwezigheid van de beveiligde sessiecookie aan dat het inlogformulier direct kan verschijnen. Er worden geen accountgegevens meegegeven. Zodra een cookie aanwezig is, wordt de bestaande accountcontrole uitgevoerd. Login, MFA, schoolrechten, sessieherstel, CSRF en geautoriseerde gegevensaanvragen blijven servermatig gecontroleerd. Lokale testsessies behouden hun bestaande controle.

| Zelfde adres, vóór en na reparatie | Mediaan vóór | Mediaan na | Grootste waarde na |
| --- | ---: | ---: | ---: |
| Nieuw stagingadres, eerste bezoek | 1.679 ms | 442 ms | 2.124 ms |
| Nieuw stagingadres, herhaald | 286 ms | 161 ms | 310 ms |
| Bestaand workers.dev-adres, eerste bezoek | 3.094 ms | 549 ms | 4.246 ms |
| Bestaand workers.dev-adres, herhaald | 316 ms | 160 ms | 1.806 ms |

Acht bezoeken per cel, twee herhalingen per combinatie Chromium/WebKit × desktop/mobiel. Eerste bezoek betekent een nieuwe browsercontext, niet bewezen koude Worker. Het gemeten eindpunt is een zichtbaar én bedienbaar inlogformulier; geen belofte over alle optionele afbeeldingen of beschermde vervolgstappen. Het formulier vóór de reparatie verschijnt pas na de accountcontrole vanuit React; na de reparatie wacht de meettool expliciet tot React de verzendfunctie heeft aangesloten. De nieuwe meting draaide zonder andere browsertests tegelijk. Kleine steekproeven: geen SLA of betrouwbare landelijke/netwerkbrede p95-claim.

De harde functionele winst is **één accountaanvraag minder per anoniem bezoek**, ook bij een trage verbinding. De daling in gemeten tijd bevat daarnaast normale netwerkvariatie. Het nieuwe domein alleen bewijst geen oplossing voor de oorzaak.

## Beveiliging en behoud

De gewone volledige appbouw, stagingbouw, typecontrole en gerichte lint slagen. 28 beveiligings-/MFA-/Worker-tests en vier serverpagina-grensgevallen slagen. Acht browsergevallen bevestigen nul initiële accountaanvragen zonder cookie en volledige controle mét cookie. Vier echte MFA-aanmeldingen op het nieuwe adres, verdeeld over beide browsers en beide formaten, slagen inclusief herladen, schoolafscherming en servermatig afmelden. In die vier gevallen duurde het MFA-antwoord 254 ms mediaan, maximaal 292 ms; er is geen vergelijkbare MFA-voormeting om hiervan snelheidswinst te claimen.

Twee extra browserproeven vertragen bewust het account ophalen na MFA en na herladen. De bestaande termijn, herstelknop en sessie werken; een verbruikte MFA-code wordt niet opnieuw verstuurd. De eerste screenshotronde bevatte één nog niet geladen logo. Na wachten op zichtbare afbeeldingen zijn alle acht volledige licht/donker-desktop/mobiel-schermen pixelgelijk aan vóór de wijziging. Geen vormgevingsaanpassing.

Beide productie-releasebestanden zijn vóór en na bytegelijk teruggelezen. Geen productiepublicatie, merge, mediawijziging, schemawijziging, betaald budget of GitHub Actions. Zware controles lokaal. Geen claim van een nieuwe volledige Klink/+docent-browserregressie tegen de actuele productiebron; de wijzigingen blijven in afzonderlijke Inzicht-staging en productiebehoud is apart gecontroleerd.

## Nog open

- De onderliggende wisselende verbindings-/routeringsvertraging. Een nieuwe gecorreleerde anonieme aanvraag duurde 3.986 ms aan clientzijde versus 4 ms gemeten Worker-walltime. Ook zonder database is die piek aanwezig. Dit wijst op wachttijd buiten die handler, maar bewijst niet welke externe schakel verantwoordelijk is.
- Een onafhankelijke tweede internetverbinding. Aan Nico is gevraagd of een telefoonhotspot beschikbaar is; nog niet uitgevoerd. Apparaten/browserengines op dezelfde Mac zijn géén onafhankelijke verbinding.
- Nieuwe echte-apparaatmeting en eventueel Cloudflare-onderzoek met de geschoonde ray-ID's in `correlated.json` en `worker-timings.json`. Geen melding aan derden verzonden.
- PR10 en productiecompatibele Inzicht-integratie blijven buiten deze vrijgave. Publicatie mag pas na afzonderlijke actuele afstemming; deze stagingreparatie is geen productieakkoord.

Herstel: eerdere stagingversie `4a3e1611-1b37-477f-b32a-6cd5ce98cacf` heeft beide domeinen zonder de startreparatie; oorspronkelijke versie `bcaaafd9-07b9-475e-afe2-5cdd9217edfa` kent alleen workers.dev. Gebruik nooit deze PR8-branch als vervanging van de afzonderlijke bestaande Inzicht-productieapp. Secrets en privé-testfactoren staan niet in dit dossier of de herstelkopie.
