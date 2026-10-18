# Klink — gecontroleerde inhoudsinvoer

De zes standaardspelers en hun brede aansluiting zijn afzonderlijk afgerond en
geborgd in `KLINK-STANDAARDSPELERS-INTEGRATIE-20261018.md`. Deze vervolgwijziging
maakt tekstuele pakketten uit de acht productielijnen technisch invoerbaar.
Een lege invoerbank voegt geen hoofdstuk, aanbod, niveau of menuknop toe.

## Invoer en review

`scripts/import-release-candidates.mjs` leest de acht werkmappen uit het centrale
register. Alleen `--write` schrijft `data/klink-imported-practice.json`.
De standaardaanroep inspecteert en schrijft een afzonderlijk verslag in
`outputs/content-integration-20261018/import-report.json`.

Toelating is een interne, inhoudelijke integratiereview; geen nieuwe menselijke
goedkeuringsclaim. Controleer de volledige bron, antwoorden, leesvoorbereiding,
niveauonderbouwing en productiebeoordelingen. Leg vervolgens per domein de hash
van het kandidaatbestand vast en per toegelaten item de hash van het oorspronkelijke
JSON-object en de velden `responseReviewed`, `preparationReviewed` en
`levelReviewed` in `outputs/content-integration-20261018/admissions.json`.
Elke inhoudswijziging maakt deze toelating ongeldig. Reviewbestanden moeten binnen
de betreffende productiemap bestaan; het verslag bewaart hun hashes.

Bronpatches worden nooit automatisch toegepast. Bij een kandidaat met patches
moet per item `sourcePatchDisposition` onderbouwd `not-required` of
`verified-separate-source` zijn. Dubbele IDs en dezelfde volledige opdracht met
andere IDs of herschikte antwoordkeuzen worden geweigerd. Een onvolledige nieuwe
aanlevering mag eerder ingevoerde items niet stilzwijgend verwijderen.

## Uitvoering

Keuzeopdrachten vergelijken de volledige verzameling antwoord-IDs. Typopdrachten
vergelijken alle tekens: hoofdletters, accenten, leestekens en spaties blijven
betekenisvol. Alleen Unicode-equivalente schrijfwijzen gelden als gelijk.
Docentopdrachten registreren deelname en leveren geen automatisch oordeel over
juistheid. Alle ingevoerde opdrachten blijven begeleid, zonder automatische
beheersing, zelfstandige leesvrijgave of opname in de beheersingsherhaling.

De voorbereiding en volledige bron staan zichtbaar bij de opdracht. De docent
kan het doel en beoordelingshulp openen; dit wordt als hulp geregistreerd.
Bij een afzonderlijke docentreferentie bevestigen docent en cursist eerst de
voorbereiding. Daarna geeft de cursist eerst een eigen antwoord, eventueel
mondeling. Pas na die bevestiging worden de keuzes en docentondersteuning
zichtbaar. Een ingevulde eerste notitie blijft afzonderlijk bewaard; een
mondeling antwoord wordt niet automatisch getranscribeerd of beoordeeld.
Afronden kan pas na de expliciete deelnamebevestiging, ook via de rondeknop.
De drie antwoordvormen gebruiken de bestaande ronde, terugknop en vervolgknop.
De acht inhoudsingangen horen bij bestaande hoofdstukken en verschijnen alleen
wanneer daadwerkelijk gecontroleerde inhoud is ingevoerd. De vijftien bestaande
woordlijsten, 302 lessen en twaalf hoofdstukken blijven behouden.

Opdrachten die audio, beelden, verborgen bronnen, tegels of aanvullende
presentatie-/beoordelingsregels nodig hebben, worden uitgesloten. Zulke
voorwaarden mogen niet verdwijnen doordat slechts algemene tekstvelden worden
overgenomen. De audiopauze geldt ook voor nieuwe aansluitingen van bestaande
opnamen. Voor deze opdracht is geen audio gegenereerd of aangesloten.
Ook aparte rolbrieven, formulieren/velden, originele taakdefinities met
zichtbaarheidsbeleid en itemafhankelijkheden blijven uitgesloten totdat hun
uitvoering expliciet is aangesloten. Een algemene notitie vervangt die niet.

De aangeleverde teksten gebruiken deze docentreferenties. De eerste overdracht
bevatte vier oude items zonder niveau; de herziene kandidaat laat die weg. Geef die
geen bedacht niveau: een eventuele ongeclassificeerde begeleide ingang vraagt
een eigen gecontroleerde aansluiting. Nieuwe niveauclaims en administratieve
bestandspaden in voorbereidingsnotities vragen inhoudelijke/publicatieredactie
voordat deze pakketten in het gewone aanbod worden opgenomen.

## Vervolg bij nieuwe kandidaten

Inspecteer en beoordeel echte kandidaten; gebruik testfixtures nooit als
lesmateriaal. Voer alleen zelfstandig uitvoerbare, gecontroleerde items in.
Werk bij werkelijk nieuw niveauaanbod de behoudtests gericht bij: nieuwe niveaus
moeten aan echte toegelaten bronitems gekoppeld blijven. Controleer daarbij de
startpagina, niveaufilters, hoofdstukingangen en docentoverzichten, zodat nieuw
aanbod ook bereikbaar is wanneer er nog geen woordleesroute voor dat niveau is.
Voer daarna de volledige lokale regressie opnieuw uit en verifieer de Drive-back-up.

De integratiechat doet geen commit, push of publicatie. De coördinerende chat
beheert de canonieke publicatiebasis en concrete publicatiecontrole. Een lokale
test of Drive-back-up is geen livepublicatie of menselijke praktijktoets.
