# MFA en verwerking — uitsluitend synthetische staging

1 november 2026. Dit is uitvoeringsbewijs, geen productie- of privacyvrijgave.

## Inloggen en herstel

`lib/inzicht/mfa.ts` en `lib/inzicht/service.ts` vereisen na het wachtwoord een authenticatorcode. Een wachtwoord alleen geeft geen dossiersessie. Eerste aanmelding registreert een willekeurig 160-bits TOTP-geheim; bevestiging geeft acht eenmalige herstelcodes. De testgebruiker bewaart die apart. TOTP gebruikt RFC 6238, SHA-1, zes cijfers, 30 seconden en maximaal één tijdstap afwijking. Een eerder geaccepteerde tijdstap kan niet opnieuw worden gebruikt. Dit is TOTP-MFA, geen phishingbestendige passkey of SSO.

Het geheim is met AES-256-GCM versleuteld, met de gebruiker als aanvullende geauthenticeerde context. De afzonderlijke 256-bits sleutel staat uitsluitend als Worker-secret `INZICHT_MFA_KEY` op `klink-inzicht-pr8-staging`. Geen plaintext sleutel in configuratie, Git, rapport of Drive. Ontbrekende/ongeldige sleutel blokkeert login. Herstelcodes staan alleen gehasht in SQL.

De vooraanmelding verloopt na vijf minuten, staat in een Secure/HttpOnly/SameSite=Strict host-cookie en heeft maximaal vijf pogingen. Een blijvende grens van vijftien pogingen per account per kwartier voorkomt omzeilen door een nieuwe vooraanmelding. Elke challenge is gebonden aan het actuele wachtwoord en een actief account. Bevestigen, eenmalig consumeren en sessie/MFA-bewijs vastleggen gebeuren transactioneel. Legacy wachtwoordsessies worden bij migratie verwijderd; alleen een sessie met apart MFA-bewijs geeft online toegang.

`components/inzicht/app.tsx` toont registratie, code-invoer en eenmalige herstelcodes. Geen secrets in localStorage/sessionStorage; wachtwoord en factor verdwijnen uit de UI-state wanneer de stap klaar is. Focus wordt verplaatst naar de nieuwe stap. In deze fictieve staging worden testfactoren ook privé lokaal bewaard voor herhaalbare browsertests. Dat testhulpmiddel is geen gebruikersopslag in de app.

## Beheer met controleerbare grenzen

Alle commando's worden vanuit de repository uitgevoerd. `node scripts/inzicht/configure-mfa.mjs` installeert de sleutel alleen voor de vastgelegde stagingresource en weigert stilzwijgende rotatie. `node scripts/inzicht/migrate-online.mjs` past alleen ontbrekende geordende migraties op die database toe, zonder opnieuw seeden. `node scripts/inzicht/reset-staging-mfa.mjs collega --reset` is het geteste, beperkte herstel voor één van de zes expliciet fictieve accounts: bestaande sessies/challenges/factor/herstelcodes vervallen en de volgende login vereist nieuwe registratie. `rotate-staging-account.mjs` trekt bij wachtwoordrotatie ook vooraanmeldingen in. Beide acties laten een auth-auditspoor achter. Deze scripts zijn geen autorisatieprocedure voor echte personen.

`deploy-staging.mjs --deploy` weigert een onjuiste Worker/DB, ontbrekende MFA-secret, afwijkend schema en plaintext sleutel in vars. Gebruik eerst `KLINK_INZICHT_STAGING=1 npx vinext build`. Normale productbouw en stagingbouw blijven gescheiden; nooit de normale app publiceren met dit script.

De cron verwerkt maximaal vijf klassen per run. Eén fout stopt andere klassen niet. `inzicht_outbox_retries` bewaart herhaalvertragingen van 5, 10, 20, 40 en maximaal 60 minuten. Niet-verwerkt werk blijft in SQL. De Worker meldt een mislukte batch als generieke fout zonder dossierdetails. Alleen schoolbeheer/support krijgt via `GET /api/inzicht/operations?school=...` aantallen en tijdstippen voor de bevoegde school. Dit is geen externe alarmdienst; eigenaar, escalatie en notificatiekanaal zijn nog vast te stellen.

## Schema en herstel

Migratie 0004 voegt MFA, challenges, eenmalige herstelcodes, sessiebewijs en auth-audit toe; 0005 voegt duurzame verwerkingsherhalingen toe. Schema 3 → 5 is vooraf/achteraf op de echte synthetische staging vergeleken: alle 24 onderwijstabellen en waarden blijven identiek, foreign keys blijven geldig, oude sessies vervallen. Zie `evidence/mfa-upgrade.json`.

`recover-online.mjs --mfa` exporteert het actuele onderwijsmodel, controleert SQLite en een afzonderlijke D1-herstel-DB en test Time Travel uitsluitend daar. `portable-test.mjs .wrangler/mfa-recovery/snapshot.json` controleert de PostgreSQL-route. `restore-auth-test.mjs` bewijst dat zes herstelde fictieve identiteiten nieuwe wachtwoorden en nieuwe MFA-inschrijving vereisen, met ongewijzigde onderwijschecksum. Authgegevens, sessies, MFA-geheimen, herstelcodes en tijdelijke uitnodigingen gaan nooit mee in het onderwijsarchief. Een verloren MFA-sleutel vraagt gecontroleerde nieuwe factorregistratie; er is geen plaintext herstelpad.

Het Cloudflare-account bereikte zijn bestaande D1-aantallimiet. Er is geen extra database/betaald budget aangemaakt. De eerder voor deze taak gemaakte herstel-DB is eerst vergeleken met het exacte vorige snapshot (alle rijen/velden, geen auth, geen onbekende tabellen/triggers) en privé geëxporteerd. Alleen die bewezen fictieve, ongebonden herstel-DB is met `reset-restore-target.mjs --reset-verified-synthetic-target` leeggemaakt. Dit script weigert afwijkende inhoud. Staging- en productiedatabases zijn niet leeggemaakt. Zie `evidence/mfa-restore-target-reset.json`.

Snapshots blijven gebonden aan de migratiehashes en de bijbehorende bronversie. Gebruik voor een oud schema-3-archief de daarbij geleverde Git-bundle/toolversie. Herstel is nog geen periodieke onafhankelijke back-updienst. Retentie, tombstones/verwijdering uit back-ups, eigenaar en ondertekende RPO/RTO blijven vrijgavepoorten. Geen terugrol naar code die MFA overslaat.

## Bewijs en beperkingen

De testbestanden onder `scripts/inzicht/` controleren RFC-vectors, crypto-context, replay, challenge-limieten, accountstatus, gelijktijdige bevestiging, eenmalig herstel, reset, wachtwoordrotatie, tenantisolatie, streaming-bodylimiet en foutisolatie van verwerking. Online browserbewijs staat in `evidence/`: beide browserengines, MFA-inschrijving, focus/toegankelijkheid, gedeeld apparaat en herstel. HTML-invoer blijft tekst; CSV-formules zijn geneutraliseerd. Geen onafhankelijke pentest of volledige menselijke toegankelijkheidsreview geclaimd.

De oorspronkelijke oefenspeler, inhoud en Klink+Docent zijn ongewijzigd. De volledige matrixproef meet netwerk+navigatie+30 zichtbare cursistrijen en twintig zichtbare vaardigheidskolommen, doorloopt alle vijf vaardigheidspagina's en opent bewijs. MFA vindt vóór de timer plaats. Dit is geen garantie voor gelijktijdige scholen of geforceerde Worker-cold-starts.

Alle testpersonen zijn fictief. Echte activatie/identiteitscontrole, lifecycle/herstelbevoegdheid, eventuele SSO-keuze, onafhankelijke review, inhoudelijke pilot en juridische/privacybeoordeling blijven nodig vóór echte gebruikers. Geen merge of productiepublicatie.
