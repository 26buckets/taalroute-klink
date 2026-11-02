# Voorstel: één Klink Inzicht op inzicht.taalroute.nl

> Nadere actualisering 2 november 2026: de rapportagechat heeft de629d1f24-runtime inmiddels bronhashgelijk gecontroleerd; actuele schema16tabellen,11auth/herstel- en4schematests geslaagd, materialen/criteria gelijk. Zie `../inzicht-20261102/evidence/compatibility/AANSLUITING-ACTUELE-INZICHT.md`. Bestaand wachtwoordherstel/migratie0006 behouden; integratiekandidaat, MFA-/sessieovergang en datamigratie nog niet uitgevoerd. De actuele negenstappenstatus blijft uitsluitend in PROJECTVERSLAG.md.

> Actualisering 2 november 2026 door de stagingproefchat, afgestemd met de rapportagechat: de publieke productiebron is nu 629d1f243ee25ce227ff508bd87d138bf09487b7 (wachtwoordherstel/migratie0006 toegevoegd). De onderstaande a6a64445-bronvergelijking is historisch. Compatibiliteit en aantallen opnieuw vaststellen vóór integratie. De actuele staginguitkomst en status van dezelfde negen stappen staan uitsluitend in PROJECTVERSLAG.md; dit blijft een bewijs-/voorstelbijlage, geen liveakkoord.

Datum: 1 november 2026. Status: reviewvoorstel, geen uitvoerings- of liveakkoord.

Nico heeft het eindadres vastgesteld en vraagt eerst de volledige stagingproef, afstemming tussen de twee chats en nog geen livepublicatie. Deze bijlage bevat alleen brononderzoek en een voorgestelde route. Er is niet in een Inzicht-productieaccount ingelogd, geen cursistrecord gelezen/gekopieerd en geen Cloudflare-instelling gewijzigd. PROJECTVERSLAG.md en het bestaande Drive-hoofdverslag blijven bij de stagingproefchat.

## Besluit dat ik voorstel

Behoud **26buckets/taalroute-klink-inzicht, main** als enige canonieke productiebron voor Inzicht, met de bestaande Worker, EU-D1 en het bestaande domein. Breng de goedgekeurde PR8-onderdelen gecontroleerd over naar een kandidaatbranch in die repository. Hergebruik de observatiebron, rapportagelogica, servervalidatie en tests; maak geen tweede formulier, app of database. Dit is een voorgestelde integratierichting, nog geen gebouwde productieversie en geen eenzijdige wijziging van de oorspronkelijke PR8-opdracht.

PR8 in 26buckets/taalroute-klink blijft het bewijs en de testbasis voor de nieuwe functies totdat ze aantoonbaar in de canonieke Inzicht-bron zijn geïntegreerd. De afzonderlijke Klink-app krijgt uitsluitend de expliciet gevraagde menulink; publicatie daarvan heeft een eigen gerichte vrijgave nodig. Klink+docent, Lexicon, Studio en andere apps worden niet uit de Inzicht-repository gepubliceerd.

Een rechtstreekse koppeling van het domein aan `klink-inzicht-pr8-staging` is geen geschikte overstap: die omgeving bevat fictieve accounts, een ander schema en expliciete testbeveiligingen. Die beveiligingen worden niet uitgezet om een publicatie mogelijk te maken.

## Wat nu aantoonbaar bestaat

| Onderdeel | Bestaand domein | Nieuwe uitwerking |
|---|---|---|
| Repository | `26buckets/taalroute-klink-inzicht` | `26buckets/taalroute-klink`, draft PR #8 |
| Gecontroleerde branch-head | `2c03e3ff3ed623e5449bab1900aad807423d82d7` | `40e11cd1dea612e160b0b905141d5fe00b2739b1` |
| Publiek bronbewijs | `/release.json`: `a6a64445041a0ae8ca5fd5f50d73c6cb2b16e61f`, gebouwd 1 november 2026 om 04.03 uur Nederlandse tijd | De drie nieuwe rapportages en 0006/0007 zijn volgens de laatste gezamenlijke vaststelling nog niet gedeployed |
| Worker volgens bron/configuratie | `taalroute-klink-inzicht` | `klink-inzicht-pr8-staging` |
| Worker-versie volgens vastgelegd publicatiebewijs | `b645dd6b-78cc-467d-83c2-b8e0a9731f2e` | Historisch `a078ad0a-9adc-4b1c-ab5c-fbd870b75e21` |
| D1 volgens bron/configuratie | `dc92506d-5bc3-465d-8a89-9d929b94208e`, naam `taalroute-klink-inzicht`, vastgelegd als EU | `95f1de18-0c61-46ca-b2af-5ee36543f67f`, aparte EU-staging |
| Schema uit migratiebron | 0001–0005; 15 applicatietabellen | 0001–0007; 40 applicatietabellen; laatste vastgestelde remote schema 5 |
| Auth en rechten | Eigen schoolaccounts, admin/teacher/observer, actieve school en toegewezen groepen; beperkte Lexicon-identiteitscontrole voor platformeigenaar | Fictieve schoolaccounts, MFA, andere rollen/identiteits- en sessietabellen |
| Routes | `/`, `/api/session`, `/api/login`, `/api/classes/...` | `/inzicht`, `/api/inzicht/...`; staging-root redirect naar `/inzicht` |

De bestaande root is in deze sessie via HTTPS bereikbaar, met titel Klink Inzicht · Taalroute. De nieuwe menulink bereikt in Chromium én WebKit het bestaande wachtwoord-inlogscherm. Dit bewijst geen geslaagde aanmelding of actuele beheerkoppeling. De productiebranch-head is een later documentatiepunt dan de publiek geregistreerde runtimecommit; beide zijn daarom apart opgenomen.

De actuele administratieve hostname/Worker/D1-koppeling, certificaatstatus, bindings, secrets, planlimieten en herstelpunten zijn **niet opnieuw vanuit Cloudflare bevestigd**: account-/zone-inspectie met de aanwezige sessie gaf HTTP 403. De configuratie en het publicatieverslag hierboven zijn bronbewijs, geen vervanging van die ontbrekende live-inspectie. Geen andere identiteit of omweg gebruikt.

## Bron- en datavergelijking

De twee volledige databaseschema's zijn uitsluitend lokaal in lege in-memory SQLite-databases opgebouwd uit de gecontroleerde migratiebestanden. Er zijn geen productierijen opgehaald. De kolommenvergelijking staat in `evidence/transition/schema-source-comparison.json`; aantallen zijn bron-/schematellingen, geen leerlingaantallen.

Een lokale exacte vergelijking slaagt voor alle acht materialen, hun zin-/tekstinhoud en criteria, en de zes woordcriteria. De bestaande catalogus heet `observatie-20261031-v2`; PR8 gebruikt `KLINK_OBSERVATIE_HTML_20261031`, versie 2. Verschillende versienamen zijn niet automatisch verschillende instrumenten. Het bewijs staat in `evidence/transition/catalog-source-comparison.json`.

| Bestaande gegevens | Behoud/vertaling in de kandidaat |
|---|---|
| `insight_schools`, gebruikers, schoollidmaatschappen, groepen, docenten, cursisten en inschrijvingen | Behoud bestaande ID's en relaties. Maak een expliciete koppeling naar de door nieuwe modules verwachte organisatie-/lidmaatschapscontext. Neem rollen niet alleen op grond van een gelijkende naam over. Inactieve/vertrokken koppelingen mogen niet opnieuw actief worden. |
| `insight_observation_sheets` | Behoud iedere volledige revisie, request-ID, auteur, school, groep, cursist, catalogusversie, materiaal, modus, observatietijd, opslagtijd, opmerkingen en volgende leerhandeling. Kies één canonieke opslag; een rapportageadapter mag lezen zonder een tweede bewerkbare kopie te maken. |
| `ratings`: `independent`, `supported`, `unseen`, afwezige sleutel | Semantische adapter naar respectievelijk `0` ✓ Zonder directe hulp, `1` △ Met hulp of model, `2` — Niet waargenomen, `null` Niet ingevuld. Alleen bij exact gekoppelde criteria/instrumenten. Bewaar ruwe waarden en provenance; onbekende waarden stoppen de omzetting. |
| Oudere `insight_observations` met oordeel, uitkomst en/of hulpdimensie | Behoud oorspronkelijke velden als oudere observaties. Geen automatische omzetting van `nog_niet` naar —, geen verzonnen null/score en geen verlies van aparte uitkomst- en hulpdimensies. |
| `insight_pilot_assessments` en `pilot-beheersing-v1` | Behoud resultaten, context, regels en historische verklaringen. Deze expliciet goedgekeurde lokale pilot is geen externe validatie, Nederlands gemiddelde of niveaucertificaat. Toon hem herkenbaar los van ruwe observaties én gevalideerde toetsbewijzen. `pilot-check` is niet automatisch een van de acht bronmaterialen. |
| Lesuren, taakniveau/condities en vergelijkbaarheid | Voor ontbrekende historische waarden blijft onbekend/ontbrekend staan. Geen gevolgde uren afleiden uit datums, rooster of niveau; groepsanalyses alleen bij aantoonbaar vergelijkbare taken/perioden en voldoende dekking. |

De bestaande 0004/0005 en PR8 0004-MFA/0005-retries zijn **verschillende migratiereeksen**. Nummer 5 betekent niet hetzelfde schema. Voer geen PR8-migratie of restore-script rechtstreeks uit op de bestaande productie-D1. De huidige PR8 0006/0007 en hun verwijzingen naar `memberships`/`group_memberships` passen niet zonder meer op `insight_*`. Ook de bestaande productie-0003 met tabelvervanging wordt niet opnieuw uitgevoerd.

De kandidaat heeft eigen gereviewde, uitsluitend aanvullende migraties nodig, op basis van de dan actuele canonieke reeks. 0006 is daar nu de eerstvolgende bronversie, maar wordt pas na hercontrole gereserveerd. Exacte SQL volgt pas uit de gekozen opslag-/authadapter en is in dit voorstel niet geschreven. Eerst met fictieve data testen: alle vier keuzes, alle revisies, retries, dubbele import zonder extra rijen, fout bij conflicterende inhoud, vreemde sleutels en school-/auteurscontext. Elke transformatieregel moet een bron-ID, versie en herleidbare reden behouden.

## Accounts, cookies en MFA

Beide implementaties gebruiken online `__Host-inzicht_session`, met Secure, HttpOnly, SameSite=Strict, Path=/ en acht uur geldigheid, maar verschillende sessiestructuren. Een bestaande cookie bewijst geen geldige sessie in het nieuwe model. Stagingcookies worden niet naar het vaste domein verplaatst of gedeeld; geen sessietoken in redirects of URL's.

De huidige PR8-login beperkt gebruikers expliciet tot `auth_subject LIKE 'synthetic:%'`; `enabled`, hostcontrole en de hersteltool ondersteunen alleen testmodi. Dat is een bewuste grens. Bestaande gebruikers mogen niet als fictief worden gelabeld. Er is een afzonderlijk gereviewde productie-authintegratie nodig, met exacte hostcontrole, zelfde-origincontrole op writes, rate limits, serverzijdige school-/groepsrechten en actieve statuscontrole.

Voorkeur: behoud de bestaande productie-identiteiten en schoolkoppelingen. Beide implementaties gebruiken dezelfde scrypt-parameters, maar dat bewijst alleen formaatcompatibiliteit; het is geen uitgevoerde accountmigratie. Wachtwoordmateriaal of MFA-sleutels komen niet in Git, Drive-bijlagen, logs of stagingfixtures. Behoud de beperkte bestaande Lexicon-servicefunctie; platformeigenaarschap geeft geen toegang tot schooldossiers. Geen nieuwe SSO-voorziening of wijziging aan Lexicon invoeren als bijwerking.

MFA moet vóór vrijgave op bestaande identiteit/rollen worden aangesloten en met fictieve rollen getest, inclusief inschrijving, herstel, verloren apparaat, herhaald codegebruik, verlopen challenge en logout. Geen wachtwoord-only sessie upgraden naar MFA. Plan gecontroleerd opnieuw aanmelden en intrekken van oude sessies, met behoud van accounts/inhoud. Leg sleutellocatie en herstelprocedure vast zonder sleutelwaarden. Een rollback mag MFA niet stilzwijgend verwijderen of oude sessies opnieuw geldig maken.

## Eén domein en routes

Behoud bij voorkeur het huidige Custom Domain op dezelfde productie-Worker. Dan is geen nieuwe DNS-verwijzing, database of app nodig. Het nieuwe Inzicht-deel wordt een gecontroleerde opvolgende Worker-versie. `/` blijft de begrijpelijke ingang; een redirect naar `/inzicht` kan pas als die route, herladen, diepere links, assets, login en terugnavigatie op de kandidaat werken. Staging houdt zijn eigen origin en fictieve gegevens.

De oude `/api/...`- en nieuwe `/api/inzicht/...`-contracten mogen niet willekeurig door elkaar worden gerouteerd. Behoud bestaande links en open tabbladen via een geteste compatibiliteitslaag of een duidelijk herlaad-/aanmeldpad. Laat geen twee onafhankelijke writers tegelijk dezelfde dossiers beheren. De bestaande frontend is een andere applicatie dan de React/Vinext-module uit PR8: een domeinwissel of kopie van buildbestanden volstaat niet. Bouw de nieuwe modules en hun API-adapter samen als één kandidaat; controleer alle bestaande functies en de goedgekeurde uitstraling.

Vooraf administratief lezen: werkelijk Custom Domain, DNS-records en eventuele overlappende Worker-routes/redirectregels; actieve Worker-versie, bindings en EU-D1; certificaatstatus en hostname; actuele bron-/assetmanifesten. Het voorstel vraagt geen wildcardrecord en geen CNAME naar `workers.dev`. Cloudflare beheert bij een Worker Custom Domain de bijbehorende DNS/certificaten. Bij de voorgestelde bestaande koppeling blijven die staan. Als live-inspectie een andere koppeling toont, wordt eerst het voorstel gecorrigeerd; niets automatisch vervangen. [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## Veilige volgorde en toegang

Het stappenplan wordt na de echte staginguitkomst definitief geordend in het ene hoofdverslag. De onderstaande afhankelijkheden zijn voorwaarden, geen al uitgevoerde handelingen. **Zelfstandig** betekent binnen de bestaande opdracht en met fictieve gegevens; het is geen toestemming voor een nieuwe productie-integratie.

| Stap | Afhankelijkheid | Concreet resultaat en bewijs/acceptatie | Eigenaar | Zelfstandig / toegang / akkoord |
|---|---|---|---|---|
| 1. Gezamenlijke stagingproef afronden | Actuele PR-head, schema en beschikbare D1-capaciteit | Eén versiegebonden verslag: MFA, docent/cursist, drie rapportages, menu, tenantgrenzen, revisies/retries, PDF/export en Chromium/WebKit. Vergelijkbare snelheidsmetingen met mediaan/bereik/aantal en de twee-secondennorm. Falen of niet testen expliciet melden. | Stagingproefchat | Zelfstandig: lokale reparaties/tests en fictieve stagingproeven binnen de bestaande scope. Geen betaalde limieten verhogen of controles omzeilen. |
| 2. Bron- en compatibiliteitsvoorstel definitief maken | Werkelijke uitkomst stap 1 | Deze bijlage bijwerken met de dan actuele bronnen, verschillen, hergebruik en resterende gaten. De al uitgevoerde broncontrole: 15 versus 40 tabellen, identieke acht materialen/criteria, verschil in auth/rollen/sessies. | Uitbreidingschat; stagingproefchat voegt samen in hoofdverslag | Zelfstandig: read-only analyse, lokaal herstelonderzoek met fictieve data en reviewbare voorstellen. Geen automatische productie-integratie. |
| 3. Integratierichting en accountmodel kiezen | Stappen 1–2 | Besluit over één canonieke productiebron, hergebruik/inpassing, behoud van pilot/bestaande functies, rollen en schoolrechten, identity lifecycle (uitnodigen, activeren, overplaatsen, intrekken, herstel) en MFA-aanmeldonderhoud. | Nico, met technische en inhoudelijke review | Expliciet besluit/opdracht nodig vóór uitvoering van de nieuwe productie-integratie. Een technisch voorstel is geen inhoudelijk akkoord. |
| 4. Administratieve toegang herstellen | Vastgestelde beheerder/target; mag read-only naast stappen 1–3 worden voorbereid | Vanuit Cloudflare bevestigde huidige zone/Custom Domain, Worker/deployment, bindings, EU-D1, certificaten en plan-/herstelmogelijkheden. Verschillen met bronbewijs eerst oplossen. | Bevoegde Cloudflare-beheerder | Technische toegang nodig wegens huidige 403. Geen andere identiteit of omweg. Nico's akkoord alleen herstelt geen ontbrekende rechten. Credentials niet in chat. Schrijfrechten pas voor afzonderlijk goedgekeurde acties. |
| 5. Kandidaat en fictieve compatibiliteitsproef | Expliciete integratieopdracht uit stap 3; actuele productiebron | Reviewbare kandidaat met noodzakelijke adapters en aanvullende migraties. Test oude plus nieuwe functies, behoud uiterlijk, alle rollen/tenants, alle vier observatiekeuzes, revisies, idempotentie, ontbrekende uren/normdata, sessievernieuwing/MFA en rollback. Runtimehash en migratiehashes koppelen aan bewijs. | Afgesproken implementatie-eigenaar; lokaal/staging gecontroleerd door beide chats zonder dubbele writes | Na die opdracht zelfstandig bouwen/testen met fictieve gegevens; geen productieschrijfwerk, merge of livepublicatie. Synthetic-only guards blijven intact; aparte productie-inrichting wordt gereviewd. |
| 6. Gegevens-, privacy-, security- en kostenbesluit | Concrete kandidaat/dataflow en toegang | Exacte noodzakelijke gegevensverwerking, schoolrechten, retentie, back-up/herstel, sleutelbeheer en migratie-/onderhoudsplan beoordeeld. Alleen werkelijk benodigde gegevens; geen echte gegevens in staging of aggregatie tussen scholen. Kostenraming en limieten aantoonbaar passend. | Nico plus bevoegde privacy/security-/schoolverantwoordelijken | Afzonderlijk akkoord voor verwerking/migratie van echte gegevens en eventuele nieuwe kosten. Een gebruikersakkoord vervangt geen vereiste professionele/juridische beoordeling. Default: geen abonnements-/budgetverhoging, zware tests lokaal, Actions binnen bestaande bundel. |
| 7. Herstel- en vrijgavepakket afronden | Stappen 4–6 en geslaagde kandidaattests | Geautoriseerde privéback-up/herstelreferentie, gecontroleerd herstelplan, veilige terugvalversie, write-stop/deltabehoud, broncommit/deployment/schema en exacte commando-/configuratiediff. Geen persoonsgegevens in het openbare bewijs. | Bevoegde uitvoerder; stagingproefchat registreert samenvatting | Fictieve herstelproef zelfstandig. Echte back-up/restore alleen onder stap-6-mandaat en afgesproken afgeschermde toegang. PR8 synthetic-only restore niet hiervoor gebruiken. |
| 8. Concrete livevrijgave vragen | Alle voorgaande acceptatiepunten voldaan; geen onverklaarde regressie | Eén beslispakket met exact kandidaatcommit, huidige livebasis, veranderingen, migraties, accountimpact, risico's, terugval en geplande handelingen. Klink-menulink afzonderlijk begrensd. | Nico geeft besluit; stagingproefchat presenteert gezamenlijk verslag | Expliciet merge-/publicatie-/eventueel domein-/bindingakkoord nodig. Geen automatische uitrol omdat tests groen zijn of het domein al bestaat. |
| 9. Alleen de goedgekeurde omschakeling uitvoeren en controleren | Stap 8 én geldige toegang | Canonieke publicatieroute; juiste bestaande domein/Worker/EU-D1; native login/MFA, oude/nieuwe functies, schoolgrenzen, PDF/export, beide browsers en snelheid gecontroleerd. Eén verslag met werkelijke deployment/schema en open punten. | Aangewezen publicatie-eigenaar | Nu niet toegestaan en niet uitgevoerd. Latere controle gebruikt uitsluitend geautoriseerde testhandelingen; geen vrije inzage in cursistdossiers. |

De sessieproef bij stap 5 krijgt minimaal deze acceptatiegevallen: een oude wachtwoord-only cookie wordt niet als MFA-sessie geaccepteerd; een onbekende maar goed gevormde oude token geeft geen toegang; nieuwe login vervangt de sessie en oude tokens blijven ongeldig; schoolwissel/ingetrokken lidmaatschap/observer-rol verruimen geen rechten; logout en verlopen/hergebruikte MFA-challenges sluiten toegang af. Gebruik uitsluitend fictieve gebruikers, tokens en records. De cookiestructuur is nu bronmatig vergeleken; deze nieuwe productie-adapterproef is **nog niet uitgevoerd**, omdat de adapter en integratiekeuze nog ontbreken.

De menulink in de Klink-app is al gereviewd in PR8, maar nog niet gepubliceerd. Zijn gerichte publicatie moet de actuele Klink-main en normale publicatiecontrole volgen en mag geen andere PR8-wijzigingen in Klink-productie meenemen. Het bestaande domein zelf wordt in dit voorstel nergens omgezet.

## Back-up en terugval zonder gegevensverlies

Deze inspectie maakt geen productie-export. Een latere, afzonderlijk geautoriseerde uitvoerder moet vlak vóór migratie een vertrouwelijke volledige back-up en beschikbare D1-herstelreferentie vastleggen, inclusief schema, relaties, revision-ID's en configuratie. Een docentexport bevat niet alle account-/herstelgegevens en is geen volledige systeemback-up. PR8 `portable.mjs` is expliciet synthetic-only en mag hiervoor niet worden gebruikt of van zijn controle worden ontdaan.

Alleen synthetische herstelproeven mogen in de bestaande staging. Een echte productieback-up blijft versleuteld in geautoriseerde EU-opslag en buiten Git, gewone Drive-bewijsbijlagen en staging. Een eventuele verificatie/herstelproef met echte gegevens vereist vooraf een afzonderlijk afgesproken afgeschermde herstelomgeving, bevoegde uitvoerder en toegang; niets daarvan is hier aangemaakt of uitgevoerd. Rapporteer uitsluitend niet-herleidbare technische integriteitsuitkomsten. Geen aggregatie tussen scholen of nieuwe verwerking buiten de goedgekeurde schoolcontext.

Voorkeur voor aanvullende schemawijzigingen en een geteste terugvalversie die de nieuwe gegevens én MFA blijft respecteren. Bij een incident eerst writes begrensd stilzetten, bevestigde nieuwe mutaties veiligstellen en compatibiliteit bepalen. Een Worker-code-rollback herstelt geen database-inhoud; terugzetten van D1 kan latere bevestigde writes verliezen. Daarom nooit automatisch terugzetten naar het oude checkpoint. Een historische wachtwoord-only Worker is na MFA-introductie geen geschikte ongemerkte terugval; bij ontbreken van een veilige kandidaat liever tijdelijk afgeschermd onderhoud dan rechten verruimen. [Cloudflare rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

Controleer bij uitvoering de daadwerkelijk beschikbare Time Travel-termijn en herstelpunten van het account; beloof geen vaste hersteltermijn op basis van alleen documentatie. D1 Time Travel en privé-export zijn aanvullende herstelmiddelen, geen vervanging voor een geteste herstelprocedure en toestemming voor potentieel gegevensverlies. [Cloudflare Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).

## Open besluiten en bewijsgrenzen

| Punt | Status |
|---|---|
| Eindadres inzicht.taalroute.nl | Door Nico vastgesteld; bestaat al |
| Eén canonieke Inzicht-repository/Worker/D1 behouden | Onderbouwd voorstel; integratiebesluit nog te bevestigen |
| Exacte oorspronkelijke observatiebron hergebruiken | Bronvergelijking geslaagd, zonder echte data |
| Volledige gecombineerde stagingproef en snelheid | Bij stagingproefchat; hier niet opnieuw uitgevoerd |
| Productie-auth/MFA- en schema-/API-adapter | Nog te bouwen en te testen na het integratiebesluit |
| Live Cloudflare-koppeling en hersteltoegang | Administratief onbevestigd door 403 |
| Echte back-up/herstel en verwerking bestaande gegevens | Niet uitgevoerd; afzonderlijk operationeel mandaat en privacyvoorwaarden nodig |
| Landelijke normen | Geen gevalideerde/licentiegedekte normdata beschikbaar; geen fictieve gemiddelden/percentielen |
| Livepublicatie/merge/DNS-wijziging | Niet toegestaan en niet uitgevoerd |

## Bronnen

- Bestaande bron: [PUBLICATIE.md](https://github.com/26buckets/taalroute-klink-inzicht/blob/2c03e3ff3ed623e5449bab1900aad807423d82d7/PUBLICATIE.md), [wrangler.jsonc](https://github.com/26buckets/taalroute-klink-inzicht/blob/2c03e3ff3ed623e5449bab1900aad807423d82d7/wrangler.jsonc), [auth](https://github.com/26buckets/taalroute-klink-inzicht/blob/2c03e3ff3ed623e5449bab1900aad807423d82d7/src/auth.mjs), [migraties](https://github.com/26buckets/taalroute-klink-inzicht/tree/2c03e3ff3ed623e5449bab1900aad807423d82d7/migrations), [publieke release](https://inzicht.taalroute.nl/release.json). Het interne publicatieverslag is gelezen als eerder vastgelegd bewijs; persoonsgegevens en dossier-ID's daaruit zijn niet overgenomen.
- PR8-bron: [service en test-only login](https://github.com/26buckets/taalroute-klink/blob/40e11cd1dea612e160b0b905141d5fe00b2739b1/lib/inzicht/service.ts), [staging-configuratie](https://github.com/26buckets/taalroute-klink/blob/40e11cd1dea612e160b0b905141d5fe00b2739b1/scripts/inzicht/online-config.json), [synthetische hersteltool](https://github.com/26buckets/taalroute-klink/blob/40e11cd1dea612e160b0b905141d5fe00b2739b1/scripts/inzicht/portable.mjs), VISUELE-RAPPORTAGES.md, MENU-DOMEIN.md en de bijbehorende versiegebonden bewijzen.

Dit is een bewijsbijlage bij PR8 en de bestaande Drive-projectmap. Het vervangt niet het ene actuele PROJECTVERSLAG.md/Drive-hoofdverslag en claimt geen nieuwe implementatie, migratie of publicatie.
