# Alles oefenen — bouw en review, 17 oktober 2026

## Afspraak

Nico gaf akkoord op een gezamenlijke oefenpagina binnen de bestaande Klink-app: eerst de zes woorden mat, tas, map, man, pan en jas, daarna dezelfde opzet bij de overige onderdelen. Geen nieuwe app, woordenindeling, media of lesroute. De nieuwe pagina is bereikbaar via Lessen → onderdeel → Alles oefenen; Terug opent de oorspronkelijke lessen.

De uitbreiding is gebouwd op main-commit `949f9f75ea98736b770915f462cbdb23d60deb3e`. De geverifieerde live runtimebron is `10affc05a167a7ebba4620ce0c368346f8fc0244`. Deze taak publiceert niet en wijzigt het live-register niet. Vóór een latere publicatie opnieuw livebron en canonieke main vergelijken; andere chats kunnen ondertussen publiceren.

## Leerdoelen en bediening

| Ingang | Wat de cursist doet | Bewijsgrens |
| --- | --- | --- |
| Luister en kies | Bestaande opname horen en passende foto of woord kiezen | Auditieve herkenning, geen zelfstandige leesclaim |
| Lees en kies | Zichtbaar woord koppelen aan één passende betekenisfoto | Alleen zonder opgevraagde woordaudio als zelfstandig lezen geregistreerd |
| Koppel | Drie woord-/fotoparen op hetzelfde bord verbinden; bij rest twee paren | Bronwoord wordt uitgesproken: ondersteund luisteren, geen zelfstandige leesclaim |
| Maak het woord | Bestaande opname omzetten in lettertegels met bestaande segmentatie | Geen zichtbaar antwoordmodel; opgevraagde hulp afzonderlijk geregistreerd |

Dit is aanvullende oefening na voorbereiding van de betrokken woordset, geen vervanging van voordoen, de kleine leesstappen, zinnen of gesprekken. De vaardigheidsvoorwaarden komen per doelwoord én antwoordoptie uit het bestaande Lexicon-curriculum (`firstReading`, `reading`, `preparation`). `sourceLessonIds` zijn leskoppelingen, niet een verzonnen volgorde of beheersslot.

Per ronde krijgt elk geschikt woord een beurt. De volgorde wisselt per nieuwe ronde; posities blijven binnen de ronde en bij hervatten stabiel. Een fout of gebruikte hulp voegt maximaal één latere herhaling van die opdracht toe. Een afgeronde ronde is geen beheersingsverklaring en plant nog geen herhaling op een volgende dag.

De bestaande pagina Herhalen behoudt bewaarde woorden en biedt daarnaast dezelfde mix met uitsluitend woorden uit afgeronde lessen of bewust bewaarde woorden. Er worden niet automatisch woorden uit toekomstige onderdelen toegevoegd.

## Dekking

Aantal woorden betreft de inhoud van ieder bestaand onderdeel, inclusief terugkerende woorden; deze aantallen mogen niet als unieke woordenschat worden opgeteld. Een koppelbord bevat maximaal drie paren; een restbord met één woord krijgt één reeds gebruikt hulpwoord.

| Bestaand onderdeel-ID (alleen redactie) | Woorden | Luisteren | Lezen | Koppelborden | Bouwen |
| --- | ---: | ---: | ---: | ---: | ---: |
| groep-1 | 6 | 6 | 6 | 2 | 6 |
| groep-3 | 22 | 22 | 18 | 6 | 22 |
| groep-4 | 28 | 28 | 24 | 8 | 28 |
| groep-5 | 49 | 49 | 41 | 14 | 49 |
| groep-6 | 42 | 42 | 38 | 13 | 42 |
| groep-7 | 46 | 46 | 42 | 14 | 46 |
| groep-8 | 68 | 68 | 51 | 17 | 68 |
| groep-9 | 45 | 45 | 40 | 14 | 45 |
| groep-10 | 44 | 44 | 39 | 13 | 44 |
| route-delen | 17 | 17 | 16 | 6 | 17 |
| route-zwakke-e | 24 | 24 | 20 | 7 | 24 |
| route-dubbel | 11 | 11 | 11 | 4 | 11 |
| route-open | 22 | 22 | 18 | 6 | 22 |
| route-verbinden | 11 | 11 | 10 | 4 | 11 |
| voorbereiding | 8 | 8 | 8 | 3 | 8 |

Een contextbeeld dat niet één woordbetekenis afbeeldt, wordt niet als betekenisantwoord gebruikt. Daarom zijn lezen en koppelen bij sommige onderdelen kleiner. Luisteren gebruikt voor zulke woorden geschreven opties. De woordbouw gebruikt de bestaande recall-word-opdracht; er worden geen nieuwe segmentaties verzonnen.

## Review en herstel

- Alle zes eerste woorden zijn echte doelen, niet alleen afleiders. Alle vijftien onderdelen behouden hun eigen woordbereik.
- Keuzevragen hebben twee tot vier opties, met voorkeur voor een klein spellingverschil. De reden wordt als redactionele metadata opgeslagen. Unieke spellingen en afbeeldingsbestanden per vraag/bord voorkomen technische dubbele antwoorden; semantische dubbelzinnigheid vraagt nog inhoudelijke beoordeling.
- Mobiele feedback bleek te smal nadat het icoon verborgen werd: de tekstkolom is hersteld en de breedte wordt nu getest.
- De vaste ondernavigatie kon bij automatisch scrollen de onderste knop bedekken: scrollruimte toegevoegd, getest op vijf schermformaten.
- React-review: gedeelde oefenspelers behouden; geen nieuwe dependency, API, microfoon of opslagdienst. Rondeberekening is gememoïseerd; opslag heeft eigen versie/sleutels en foutafhandeling. Audio wordt bij wisselen/verlaten gestopt. Leesaudio telt als hulp, koppelopdrachten als ondersteund luisteren.
- Bestaande woorden, beelden, audio, landing, kaarten, 302 lesroutes, teksten en gesprekken zijn niet vervangen. Lesvoortgang blijft bytegelijk tijdens een mixronde.
- Semantische namen, focus, toetsenbord en tikbediening gecontroleerd. Geen fysieke screenreadersessie of cursistpilot geclaimd.

## Lokale controle

- Volledige bestaande `test:review`: 48 curriculumtests plus browserreeksen voor lesroute, media, zinnen/gesprekken, navigatie, landing, kaarten, voortgang en gemengde oefeningen.
- Nieuwe mixbrowsercontrole: alle vier modi, vijftien onderdelen, vijf schermformaten, foutcorrectie, opslag/hervatten, herhaling, geblokkeerde opslag en audioherstel.
- Echte browseraudio: bestaande instructies en doelwoorden spelen in alle vier modi; lezen spreekt het antwoord niet automatisch uit.
- TypeScript, gerichte oxlint, diffcontrole, zes publicatiebewijstests en productiecompilatie gecontroleerd.
- Testbewijzen en screenshots staan in `outputs/mixed-practice-20261017/` en gaan mee in de herstelback-up. Geen zware cloudcontrole toegevoegd of gestart.

## Open voor inhoudelijke vrijgave

De oefenproductieskill vereist beoordeling van nieuwe inhoudelijke combinaties vóór publicatie. Het ontwerp is goedgekeurd, maar niet ieder nieuw samengesteld bord/afleiderpaar. `data/klink-mixed-practice-release.json` houdt dit expliciet open en de publicatiecontrole blokkeert daarop. Bestaande media zijn niet gewijzigd; opnieuw genereren of een nieuwe t-opname is geen onderdeel van deze taak.

Te beoordelen: betekenis van afleiders en koppelbeelden, belasting van de grotere woordsets, aansluiting bij voorbereide leesvaardigheden en geschiktheid van geschreven opties bij contextwoorden. Grote onderdelen bevatten tot 68 opdrachten per luister-/bouwronde; pauzeren/hervatten werkt, maar dit is geen advies om die in één les af te werken. Er is geen automatisch beheersslot toegevoegd.

De Taalroute-ontwerpbasis is geraadpleegd. Dit losse oefenonderdeel blijft gekoppeld aan de bestaande leesdoelen en lessen; er is geen nieuw cursusprogramma, rooster, boekinhoud, lesbezoekobservatie of praktijkbewijs verzonnen. Koppeling aan een werkelijk docentlesplan en praktijktoets blijven inhoudelijk werk, geen technische testuitslag.
