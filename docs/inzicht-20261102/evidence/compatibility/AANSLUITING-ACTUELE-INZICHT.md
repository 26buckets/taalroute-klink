# Aansluiting op de actuele Klink Inzicht-app — 2 november 2026

Dit is een brongebonden aanvulling op het bestaande OVERSTAPVOORSTEL en het ene hoofdverslag. Het is geen productie-integratie of publicatieakkoord. Er zijn geen productieaccounts gebruikt, geen dossiers gelezen, geen remote SQL-opdrachten uitgevoerd en geen Worker-, DNS- of databasewijzigingen gedaan.

## Gecontroleerde bron

- Publieke release: `629d1f243ee25ce227ff508bd87d138bf09487b7`, gebouwd `2026-11-02T01:40:37.422Z`.
- De complete runtimebron uit deze commit is opgehaald met de bestaande geautoriseerde GitHub-CLI. Ieder opgehaald bestand is tegen de Git-blobhash gecontroleerd. De opnieuw berekende runtimehash is exact gelijk aan de publieke release: `48e8dc29c570945753af6313b11a4f56b210810f22024e85fff4b36e4fbd5a6f`.
- Geobserveerde canonieke main: `ccbbc318b4c2dee02f1f8fa87d74066d0642979f`. De drie commits na de livecommit wijzigen uitsluitend documentatie en bewijs; geen runtimeverschil.
- Het actuele publicatieregister noemt Worker-versie `2a6167f4-bcad-4a03-968f-1d7461fb18f7` en bestaande D1 `dc92506d-5bc3-465d-8a89-9d929b94208e`. Dit is registerbewijs; de administratieve Cloudflare-koppeling is in dit onderzoek niet opnieuw uitgelezen.
- PR8-contractvergelijking vastgezet op `660b81f46e7928733768c2a54a610356a92c1a41`. De snelheid/MFA-uitvoerder controleert bij de eindcommit of onderstaande contracten gelijk zijn gebleven.

De GitHub-app gaf voor de afzonderlijke repository 404; de bestaande CLI-leestoegang werkte. Er zijn geen nieuwe rechten of credentials aangevraagd of gebruikt. De historische vergelijking met a6a64445 is hiermee voor de onderzochte broncontracten bijgewerkt.

## Wat aantoonbaar aansluit

De acht materialen, woord-/zin-/tekstinhoud en zes criteria per modus zijn exact gelijk. Ook de labels en tekens zijn gelijk: independent → 0 (✓, Zonder directe hulp), supported → 1 (△, Met hulp of model), unseen → 2 (—, Niet waargenomen); een ontbrekende keuze blijft null. Dit is een gecontroleerde representatiekoppeling, geen beheersingsscore of reeds uitgevoerde import.

De bestaande applicatie heeft al onveranderlijke observatierevisies, verzoek-ID's, opmerkingen, volgende leerhandeling, school- en groepscontext, PDF en groepsexport. Die functies en historische gegevens blijven de basis; geen tweede observatiesysteem invoeren. De bestaande pilotcontroles blijven als lokale pilotbewijzen herkenbaar en worden niet automatisch gevalideerde toetsbewijzen of landelijke normen. Ontbrekende gevolgde uren, taakniveaus en vergelijkingscondities blijven onbekend.

## Concrete aansluitmatrix

| Onderdeel | Actuele aparte app | PR8 | Benodigde aansluiting vóór productie |
|---|---|---|---|
| Bron en publicatie | `taalroute-klink-inzicht`, bestaande Worker en D1; reguliere `npm run deploy` met broncontrole | Staging binnen `taalroute-klink`; eigen Worker en D1 | Compatibele uitbreidingen opnemen in een gecontroleerde kandidaat van de bestaande app. Geen domein naar staging omzetten en geen volledige PR8-app over de bestaande app publiceren. |
| Identiteit | `insight_users`, issuer/subject, bestaande native accounts; beperkt Lexicon-identiteitsgebruik | `users`, `auth_subject`, aanmelding uitsluitend `synthetic:%` | Bestaande identiteit behouden. Geen productiegebruiker als synthetisch markeren en geen testbeveiliging simpelweg uitzetten. |
| Rechten | admin/teacher/observer, actieve schoolrechten en expliciete groepsrechten | Uitgebreider rollenmodel waaronder school_admin/assistant/learner | Expliciete rolkoppeling en negatieve tests. Observer blijft alleen-lezen; niet automatisch omzetten naar een schrijvende rol. Platformeigenaar krijgt geen dossierinzage. |
| Sessies en MFA | Eigen sessietabel; zelfde hostcookie-naam; bestaande login heeft geen PR8-MFA | Eigen sessie- en MFA-tabellen, challenges en TOTP | Geen cookies of sessies blind overnemen. Gecontroleerde MFA-inschrijving, sessierotatie, intrekking en nieuwe aanmelding testen met fictieve accounts. |
| Wachtwoordherstel | Nieuw in live629d1f24: eenmalige herstellink, tokenhash, atomaire consumptie, intrekking van alle target-sessies en overige herstelgrants | Geen gelijkwaardige productieroute in de vergeleken PR8-bron | Bestaande herstelroute en URL-fragment behouden. Herstel moet ook toekomstige MFA-challenges/sessies correct afhandelen; een wachtwoordreset mag MFA niet ongemerkt omzeilen of gebruikers blokkeren. Provideraccounts blijven bij hun provider. |
| Migraties | 0001–0006; 0006 is `password_reset`; 16 tabellen | 0001–0007; 0004 MFA, 0005 retry, 0006 observaties, 0007 lesuren; 40 tabellen | Nummering en SQL niet uitwisselen. Bestaande migraties behouden; uitsluitend gerichte nieuwe migraties vanaf de dan vrije versie op de gekozen productiebron. Eerst lokale migratie- en terugvalproef met fictieve historische gegevens. |
| Routes en export | `/`, `/api/*`, uitnodigings-/herstel-fragmenten; groepsexport met observatieschema5 | `/inzicht`, `/api/inzicht/*`, eigen portable schema7 | Bestaande links/exports blijven werken. Observatieschema5 is geen bewijs dat DB-migratie0006 ontbreekt. Adapter en versiegebonden import/herstel zijn nog niet gebouwd. |
| Interface | Bestaande goedgekeurde afzonderlijke Inzicht-opzet en gedeelde Klink-stijl | Uitgebreide stagingrapportages | Inpassing met behoud van goedgekeurde opzet; alleen eventuele concrete afwijkingen apart voorleggen. |

## Uitgevoerde lokale controles

- 11 bestaande auth-/wachtwoordhersteltests geslaagd op ongewijzigde livebron: behoud van identiteit, collega's, school-/groepskoppelingen en leerdata; alleen target-sessies intrekken; verlopen/onbekende/provider/ongeldige aanvragen afwijzen; transactieterugval; gelijktijdige herhaling heeft exact één winnaar.
- 4 bestaande schematests geslaagd, waaronder schoolgrenzen via foreign keys en terugval bij dubbele schoolkoppeling.
- Beide migratiereeksen afzonderlijk in lege lokale SQLite uitgevoerd: 16 respectievelijk 40 tabellen, geen foreign-keyfouten. De reeksen zijn niet samengevoegd.
- Catalogusvergelijking met assertions geslaagd op alle acht materialen, criteria en tekens. De eerste vergelijkingsassertie hield ten onrechte geen rekening met PR8's extra numerieke `value`-veld; de vergelijking is gecorrigeerd en daarna geslaagd. Geen productcode aangepast.
- Volledige runtimebronhash gelijk aan publieke release; alle opgehaalde Git-blobs gecontroleerd.

Bewijs: `source-manifest.json`, `schema-comparison.json`, `catalog-comparison.json`, `checks.json`. De bronkopie en vergelijkingsscript staan lokaal naast deze bijlage. Er zijn geen actieve tokens, wachtwoorden, sessies of echte cursistgegevens in deze bewijsbestanden.

## Nog nodig voor publicatie

1. De snelheid/MFA-reparaties afronden en de afgesproken norm met afzonderlijke componentmetingen onderbouwen; geen beveiliging afzwakken voor snelheid.
2. Een concrete integratiekandidaat in de bestaande afzonderlijke app maken volgens bovenstaande aansluitmatrix. Het brononderzoek is voltooid; de adapter, MFA-overgang en datamigratie zelf zijn nog niet uitgevoerd.
3. Die kandidaat lokaal en op afzonderlijke synthetische staging testen: bestaande login/herstel, rollen en schoolwissel, ingetrokken rechten, oude/nieuwe sessies, MFA, historische observaties/revisies en pilotcontroles, PDF/export/herstel, lesuren en rapportages, desktop/mobiel en beide browsers.
4. De reeds vastgelegde productievoorwaarden afronden: actuele beheerderstoegang/Worker-D1-koppeling, afspraken voor echte dossiers, gecontroleerde privé-back-up en herstel, en inhoudelijke/toegankelijkheids-/beveiligingsreview waar nog open. Schooloverstijgende persoonsgegevensaggregatie blijft uitgeschakeld; geen fictieve landelijke normen toevoegen.
5. Pas voor een exact geteste commit, migratieplan en terugvalpakket afzonderlijk Nico's publicatieakkoord vragen. Nu geen merge, productie-uitrol, domeinomzetting of betaald gebruik. De Klink-menulink blijft een afzonderlijke gecontroleerde Klink-publicatie.

Beperking: deze bron- en lokale contractcontrole bewijst geen voltooide productie-integratie, geen actuele administratieve Cloudflare-koppeling en geen werking met echte accounts. Publieke release en remote main moeten vóór iedere latere publicatie opnieuw worden gecontroleerd.
