# Klink Inzicht — online synthetische staging

1 november 2026. Dit vervolgpakket voert Nico's opdracht uit om zelfstandig verder te bouwen, inclusief echte accountlogin en veilige online staging. Geen toestemming voor merge, productie of echte cursistgegevens. R2 > R1 > v1.0 blijft leidend.

## Omgevingen en actuele bron

- Reviewbranch: `codex/klink-inzicht-20261101`, draft PR #8 in `26buckets/taalroute-klink`.
- Afzonderlijke staging: https://klink-inzicht-pr8-staging.nico-554.workers.dev/inzicht
- Worker `klink-inzicht-pr8-staging`; geen custom domain of productie-route, geen servicebinding naar andere apps. Alleen INZICHT_DB en eigen statische assets.
- EU D1 `klink-inzicht-pr8-staging`, `95f1de18-0c61-46ca-b2af-5ee36543f67f`. Afzonderlijke, niet aan een Worker gekoppelde EU-herstel-DB `klink-inzicht-pr8-restore`, `6bbdaabc-8098-4a75-91e5-96984382e7ee`.
- De oorspronkelijke Klink-D1 en inmiddels apart aangetroffen `taalroute-klink-inzicht`-database zijn niet gewijzigd. Die afzonderlijke Inzicht-app op inzicht.taalroute.nl heeft een andere repository en eigen accountmodel. Er is geen datakoppeling, import, wijziging of publicatie van die app uitgevoerd. Een latere samenvoegstrategie tussen de twee uitwerkingen is een expliciete productbeslissing.
- De hoofdbranch is tijdens het werk bijgewerkt naar `41091ea9`; de gecontroleerde actuele Klink-livebron is `834e85e7`. De latere goedgekeurde mobiele foto-aanpassing en het docentlaadherstel blijven behouden. Uiterlijkvloer, Klink+Docent, publicatiepoorten en bestaande persoonlijke opslag zijn ongemoeid.

## Echte login, uitsluitend fictieve identiteiten

Zes vooraf aangemaakte fictieve accounts hebben eigen e-mailadres, willekeurig wachtwoord, gezouten scrypt-hash en rollen. Gebruikersnamen eindigen op `@klink-test.invalid`; er worden geen e-mails verstuurd en geen echte identiteit of e-mailverificatie geclaimd. De cryptografische parameters zijn overgenomen uit het daadwerkelijk geïnspecteerde `src/auth.mjs` van de aparte Klink Inzicht-app: scrypt N=32768, r=8, p=3. Dit is native accountlogin voor staging, geen nieuwe beheerde identityprovider.

`lib/inzicht/auth.ts` verzorgt de wachtwoordcontrole. `service.ts` beperkt pogingen per IP en account, maakt pas na succesvolle MFA een nieuwe willekeurige sessie, bewaart alleen de tokenhash en controleert de actuele gebruiker/lidmaatschappen/klasrechten bij iedere aanvraag. Succesvolle login wist de account-foutteller; de IP-limiet blijft staan. Een gelijktijdige wachtwoordwijziging kan geen sessie met de oude hash opleveren.

Online cookies zijn host-only (`__Host-`), HttpOnly, Secure en SameSite Strict, acht uur geldig. Mutaties eisen dezelfde Origin en JSON. Data en pagina's zijn no-store; iframe-insluiting is geblokkeerd. Uitloggen trekt de sessie op de server in. De oude lokale tokenlogin is online 404. Geen openbare registratie, resetmail, lokale fixture-token of accountwisselknop online.

Toegang staat uitsluitend in `.wrangler/inzicht-online-credentials.json` (0600), buiten Git en de Drive-back-up. `rotate-staging-account.mjs collega` genereert een nieuw wachtwoord voor precies dat fictieve account en trekt bestaande sessies in. `rotation-test.mjs` heeft dit daadwerkelijk online gecontroleerd. De gebruiker krijgt een afzonderlijk lokaal toegangsbestand, nooit in het herstelarchief.

**Nog geen vrijgave voor echte accounts:** Veilige echte activatie en eventuele SSO-integratie, domein-/identiteitsverificatie, lifecycle/herstel met bevoegde medewerkers en onafhankelijke beveiligingsreview blijven voorwaarden voor een echte pilot. Een geverifieerde fictieve accountkoppeling bewijst geen verificatie van een natuurlijk persoon.

## Aanvullend afgerond

- In de opdrachten-UI zijn begin- en eindmoment instelbaar. De server bewaart UTC, weigert ongeldige volgorde en controleert beschikbaarheid opnieuw bij openen en opslaan.
- Intrekken vereist een zichtbare bevestiging en docentrecht voor die klas. De opdracht sluit; pogingen en bewijs blijven behouden.
- Een individuele uitzondering kan na actuele impactpreview terug naar de klasstandaard. De uitzonderingsrij wordt verwijderd, zodat toekomstige klaswijzigingen worden geërfd.
- De cursist ziet het toegestane vrije aanbod per eigen klas. Dezelfde servercontrole wordt gebruikt voor de lijst, het openen en het opslaan. De proefcatalogus blijft drie gecontroleerde bestaande oefeningen.
- Het onderwijsrapport bevat eigen klasgegevens, matrix, observatierevisies, bewijs, pogingen en opdrachten. Het bevat geen credentials of andere schoolgegevens en is geen volledige databaseback-up.
- De Cloudflare-timer verwerkt iedere vijf minuten maximaal vijf klassen met open outboxwerk. Verwerking is idempotent; een fout laat werk beschikbaar voor herhaling. Op 1 november om 02:30 UTC waren alle twaalf toenmalige gebeurtenissen verwerkt, inclusief de recent online gemaakte rapportobservaties. Sessies en oude rate-limitvensters worden periodiek opgeruimd. Er is nog geen afgetekende alarm-/storingsdienst.

## Bouw en controle

```sh
node scripts/inzicht/staging-assets.mjs
KLINK_INZICHT_STAGING=1 npx vinext build
node scripts/inzicht/deploy-staging.mjs --deploy
```

Dit is uitsluitend de door Nico toegestane stagingroute. `deploy-staging.mjs` weigert een andere Worker, de productie-DB, custom routes, servicebindings, preview-URL's of ongecontroleerde assetafhandeling. `npm run deploy` en de productiepoorten zijn niet veranderd. Normale build zonder stagingflag heeft geen Inzicht-binding. Staging kopieert 42 werkelijk gebruikte originele assets ongewijzigd; de volledige public-map van circa 1,2 GB wordt niet opnieuw gepubliceerd. De aparte router in `scripts/inzicht/staging-app/app/` laadt alleen de bestaande Inzicht-pagina en API. De bestaande gedeelde header en stijlen worden hergebruikt via `lib/inzicht/frame.tsx`; Klink+Docent verwijst naar de bestaande productie-app. De oorspronkelijke hash-router wordt in staging niet gemount. De staging-CSS scant componenten, zodat historische rapporten en mediabronnen geen onbedoelde utilitybron worden.

De volledige controles draaien lokaal tegen de online testomgeving, zonder GitHub Actions. Bekijk `evidence/` voor de logs en bewijsbestanden. Browserreeksen met schrijfacties worden achtereenvolgens uitgevoerd: de conservatieve schoolversie weigert terecht goedkeuring van een advies wanneer een andere proef tussentijds schoolgegevens wijzigt.

```sh
node --test scripts/inzicht/test.mjs scripts/inzicht/auth-test.mjs scripts/inzicht/mfa-test.mjs
KLINK_TEST_URL=https://klink-inzicht-pr8-staging.nico-554.workers.dev node scripts/inzicht/browser.mjs
KLINK_TEST_URL=https://klink-inzicht-pr8-staging.nico-554.workers.dev node scripts/inzicht/student-browser.mjs
KLINK_TEST_URL=https://klink-inzicht-pr8-staging.nico-554.workers.dev node scripts/inzicht/remaining-browser.mjs
KLINK_TEST_URL=https://klink-inzicht-pr8-staging.nico-554.workers.dev node scripts/inzicht/shared-device.mjs
node scripts/inzicht/online-probe.mjs
KLINK_TEST_URL=https://klink-inzicht-pr8-staging.nico-554.workers.dev node scripts/inzicht/appearance-browser.mjs
```

De schaalproef gebruikt tijdelijk 30 fictieve cursisten, 100 vaardigheden en 3000 TRAIN-events. De vijf volledige API-antwoorden inclusief netwerk duren 235–527 ms. Deze fixtures zijn daarna gecontroleerd verwijderd. Dit is geen gegarandeerde cold-start-, gelijktijdigheids- of volledige browserrender-SLO.

## Bewust nog open

Privacy/grondslag/DPIA/retentie en verwijdering uit back-ups; Echte identity lifecycle; didactisch gevalideerde meetrubrics en volledige contentmapping; persoonlijk SQL-paspoort en gecontroleerd delen; volledig schoolbeheer; onafhankelijke schermlezer-/docentpilot; grootschalige catalogusquery's, storingsdienst en afgetekende RPO/RTO. Geen van deze poorten wordt door een geslaagde synthetische proef afgetekend. Geen merge en geen productiepublicatie.

## Aanvulling MFA en beheer, 1 november 2026

Wachtwoord plus verplichte authenticatorcode, eenmalige herstelcodes, beheerreset, revocatie en duurzame foutisolatie zijn op de afzonderlijke fictieve staging uitgevoerd. Zie `MFA-EN-BEHEER.md` voor actuele codepaden, schema 5, bewijzen en operationele grenzen. De huidige test- en acceptatiestand staat in `PROJECTVERSLAG.md` en `ACCEPTATIE-72.md`; oudere logbestanden zijn historische bewijzen.

## Volledige docent-cursistproef, 1 november 2026

Beide browserengines doorlopen dezelfde volledige klas-/account-/observatie-/oefen-/adviesketen, met heraanmelding en gecontroleerd verloren opslagantwoorden. De Inzicht-service herhaalt bevestigingen nu correct zonder dubbele wijzigingen. Actuele stagingversie `06739054-6fc4-40c0-8e82-c6c8fd3fc4dd`; schema 5 ongewijzigd. Zie `PROJECTVERSLAG.md` en `evidence/journey/`. Uitvoeren: `KLINK_TEST_URL=https://klink-inzicht-pr8-staging.nico-554.workers.dev node scripts/inzicht/journey-browser.mjs`. Alleen de bedoelde fictieve cursistkoppeling wordt tussen de browserproeven verplaatst; oude onderwijsgegevens blijven behouden. Geen parallelle schrijvende browserreeksen met dezelfde accounts uitvoeren. De laatste volledige WebKit-klas blijft via het fictieve cursistaccount bereikbaar. Geen merge/productiepublicatie.
