# Klink: één woordgroep, een volledig oefenpakket

**Bouwupdate:** de groepsbibliotheek is inmiddels lokaal aangesloten. Zie `KLINK-GROEPSOEFENINGEN-20261017.md` en de opnieuw gegenereerde `comparison.json` voor de actuele functiestatus. De ontbreekt-statussen hieronder beschrijven de uitgangssituatie vóór deze bouwronde. De DigLin-menuwaarnemingen blijven ongewijzigd geldig als bewijs van de toen bekeken menu’s, niet als volledige speler-/inhoudsaudit.

Interne bouw- en vergelijkingsinventaris, 17 oktober 2026. Geen cursistentekst. Geen nieuwe woordenindeling, geen nieuwe app, geen publicatie in deze ronde.

## Besluit en afbakening

De door Nico gekozen volgorde is: gezamenlijk woordenoverzicht → woordbouw via slepen én aantikken, als reeks én werkblad → woordbingo en beeldbingo → zoek de zin → overige passende vormen. Dezelfde canonieke Taalroute-woorden, betekenissen en leesvoorwaarden voeden alle vormen. DigLin is een functionele vergelijkingsbron, niet de inhouds- of ontwerpbron van Klink.

De ontbrekende, goedgekeurde losse klanken blokkeren alleen opdrachten die zulke klanken werkelijk nodig hebben. De afgekeurde losse t blijft geparkeerd. Woordbouw met hele woordaudio, bingo met hele woordaudio en zinnen zoeken met zinsaudio kunnen afzonderlijk worden ontwikkeld. Geschreven lettertegels mogen niet doen alsof ze al beluisterbare klankknoppen zijn.

## Wat daadwerkelijk is gecontroleerd

- De lokale Klink-gegevens, routegenerator, oefenspelers, bronvoorraad en bestaande testgevallen.
- Online én lokaal het beginscherm en eerste onderdeel geopend in een nieuwe browsersessie: beide hebben vijftien onderdelen. Alleen lokaal staat daar `Alles oefenen`.
- Online `/release.json` gelezen: broncommit `10affc05a167a7ebba4620ce0c368346f8fc0244`, bouwtijd 17 oktober 2026 12:47 UTC. Dit bewijst de livebasis, niet dat iedere lokale functie live staat.
- Na opnieuw aanmelden door Nico zijn alle zestien ABC-oefenmenu's en alle twaalf hoofdonderdelen uitgelezen: 296 menugroepen, 3.834 oefenlinks en 231 overige links. Dit zijn geen aantallen unieke oefeningen of leerdoelen; dezelfde inhoud kan op meerdere plaatsen gelinkt zijn. Sommige groepen bevatten alleen print-/documentlinks.
- De **menu-inventaris is afgerond**. De volledige interactieve werking, audio, foutfeedback en inhoud van iedere oefening zijn niet getest. Er zijn geen antwoorden, toetsresultaten of microfoonopnamen ingestuurd.

De vier statussen beschrijven Klinks implementatie. `Werkt` betekent een aangesloten, gecontroleerde technische functie binnen de beschreven scope, geen bewezen leerwinst, volledige methodegelijkheid of nieuwe mediagoedkeuring. De generieke spelerbibliotheek is niet gelijk aan de actieve oefenbibliotheek. Lokale beschikbaarheid is niet gelijk aan publicatie.

## Huidige omvang zonder schijnvergroting

Er zijn 15 zichtbare onderdelen, 302 selecteerbare routes en 338 betekenissen bij 337 schrijfwijzen. Een route is niet automatisch een afzonderlijk geschreven les. De gekoppelde inhoud omvat 1.292 zinnen, 192 teksten en 128 gesprekken; luister-/leesmodellen zijn niet automatisch evenzoveel begripsopdrachten.

| Eigen onderdeel | Woorden inclusief terugkeer | Routes | Lokale mix: horen / lezen / koppelen / bouwen |
|---|---:|---:|---|
| tas · map | 6 | 5 | 6 / 6 / 2 / 6 |
| pen · kip | 22 | 11 | 22 / 18 / 6 / 22 |
| bon · bus | 28 | 14 | 28 / 24 / 8 / 28 |
| raam · boot | 49 | 32 | 49 / 41 / 14 / 49 |
| boek · muur | 42 | 22 | 42 / 38 / 13 / 42 |
| neus · buik | 46 | 28 | 46 / 42 / 14 / 46 |
| zeep · hek | 68 | 45 | 68 / 51 / 17 / 68 |
| tong · bank | 45 | 30 | 45 / 40 / 14 / 45 |
| sjaal · taxi | 44 | 30 | 44 / 39 / 13 / 44 |
| huiskamer · rugzak | 17 | 14 | 17 / 16 / 6 / 17 |
| keuken · moeder | 24 | 24 | 24 / 20 / 7 / 24 |
| jassen · sokken | 11 | 11 | 11 / 11 / 4 / 11 |
| foto · ramen | 22 | 22 | 22 / 18 / 6 / 22 |
| pakje · tomaten | 11 | 7 | 11 / 10 / 4 / 11 |
| appel · sap | 8 | 7 | 8 / 8 / 3 / 8 |

Mixgetallen zijn aantallen gegenereerde opdrachten bij vaste testvolgorde, geen bewezen lesduur of nieuwe leerdoelen. Een koppelopdracht omvat meerdere woorden. Contextbeelden en dubbele/ongeschikte foto's worden niet gebruikt als toetsbaar betekenisbeeld; daardoor zijn de aantallen niet overal gelijk. Woorden keren in verschillende onderdelen terug: de woordkolom niet optellen als unieke woordenschat. In de huidige kleine lesroutes ontbreken keuze-/koppelvormen in drie onderdelen; de lokale groepsmix kan daar al meer woorden samenbrengen.

## Functionele bouwchecklist

Het volledige gegevensbestand bevat 38 regels, aangesloten modi en onderdeel-ID's. Alle 370 menukeuzen van de zestien ABC-lijsten hebben daarnaast een afzonderlijke verwijzing naar de passende eigen Klink-functie en een van de vier statussen. Dit is een vergelijking van algemene oefenhandelingen, geen bewijs van volledige gelijkwaardigheid van spelers of inhoud. Hieronder de inhoudelijke samenvatting.

| Mogelijkheid | Status in Klink | Nog nodig |
|---|---|---|
| Hele woordgroep als start | Bestaat gedeeltelijk | Woordoverzicht bestaat; instap staat nog op Lessen. Groepsgerichte oefening ontbreekt bij meerdere vormen. |
| Foto + woord + hele woordaudio | Werkt | Behoud bestaande bestanden en stabiele koppelingen. |
| Losse klanken en synthese | Ontbreekt | Goedgekeurde klankopnamen, precieze uitspraakfunctie en passende taken. |
| Dezelfde woorden vinden, horen/kiezen, lezen/foto | Bestaat gedeeltelijk | Niet alleen in kleine leesstappen; elk geschikt groepswoord ook als doel. |
| Woordbouw door aantikken, met/zonder model | Werkt | Modelgebruik en zelfstandig terughalen verschillend registreren. |
| Woordbouw slepen én aantikken | Bestaat gedeeltelijk | Slepen, bestemmingskeuze en gelijkwaardige herstelbediening ontbreken. |
| Meerwoordswerkblad | Ontbreekt | Meerdere eigen woorden tegelijk, herhaalbare woordaudio, per woord afronden/hervatten. |
| Woord natypen, woorddictee, ontbrekende letter | Werkt | Hergebruik binnen het groepspakket; leesvoorwaarden behouden. |
| Woordbingo / beeldbingo | Ontbreekt | Oude bordcode niet zomaar activeren: stimulus, antwoordverhulling, beoordeling en dekking moeten kloppen. |
| Memory en paren | Bestaat gedeeltelijk | Groepsdekking en doelbewuste contrasten verbreden; niet alleen afleidergebruik tellen. |
| Woordkaarten | Werkt | Geen beheersingsclaim op basis van bekijken. |
| Nazeggen en schrijven | Bestaat gedeeltelijk | Opnemen/Klaar bewijst geen uitspraak of handschrift; passende zelf-/docentbeoordeling ontbreekt. |
| Volledige zinnen inspreken | Ontbreekt | Woordopnamefunctie niet gelijkstellen aan een aangesloten zinnenspreekreeks. |
| Zinnen luisteren/meelezen | Bestaat gedeeltelijk | Model is nog geen herkennings- of begripsreeks. |
| Zoek de zin | Ontbreekt | Eigen bestaande zinnen + audio + gecontroleerde afleiders + herhaling koppelen. |
| Zinsbouw en zinsdictee | Ontbreekt | Volgorde, antwoordvarianten, betekenis en ondersteuning uitwerken. |
| Tekstbegrip, functioneel lezen en gesprekken | Bestaat gedeeltelijk | Bronvragen, bewijsplaatsen, keuzes en rolopdrachten naar de cursistspeler brengen. |
| Formulieren, berichten, sorteren, domino | Ontbreekt | Bronontwerp bestaat deels; huidige route heeft nog geen complete taken. |
| Herhaalplanning en vaardigheidsvoortgang | Bestaat gedeeltelijk | Oefenkanalen gebruiken nog niet overal dezelfde resultaatregistratie. |
| Gerichte leesautomatisering met temposteun | Ontbreekt | Eigen, optionele tempoleesreeks nog niet aangesloten. |
| Verplichte tijdwedstrijd of aparte Junior-productlijn | Bewust anders | Rustig instaptempo en eigen volwassen inhoud; dit betekent niet dat de leesfuncties uit Junior overbodig zijn. |

## Alle zestien ABC-lijsten en aansluitende domeinen

Iedere lijst is afzonderlijk geopend. In het eerste tussenbericht werd te vroeg gezegd dat alle zestien lijsten 24 keuzen hadden; onderstaande telling en het gegevensbestand corrigeren dat.

| ABC-lijst | Menukeuzen | Verschil ten opzichte van lijst 1 |
|---|---:|---|
| 1 | 24 | Referentie voor alleen deze menuvergelijking |
| 2 | 24 | Dezelfde menuvormen |
| 3 | 24 | Dezelfde menuvormen |
| 4 | 24 | Dezelfde menuvormen |
| 5 | 24 | Dezelfde menuvormen |
| 6 | 24 | Dezelfde menuvormen |
| 7 | 24 | Dezelfde menuvormen |
| 8 | 24 | Dezelfde menuvormen |
| 9 | 24 | Dezelfde menuvormen |
| 10 | 24 | Dezelfde menuvormen |
| 11 | 24 | Dezelfde menuvormen |
| 12 | 24 | Dezelfde menuvormen |
| 13 | 24 | Dezelfde vormen; tempolezen heeft een afwijkend voorloopstreepje in het label |
| 14 | 21 | Geen letters slepen per woord 1/2; geen luister en kies het woord |
| 15 | 19 | Als lijst 14; ook geen woorden vormen en slepen 1/2 |
| 16 | 18 | Als lijst 15; ook geen woorden en zinnen |

Dit zijn menukeuzen, niet evenzoveel unieke didactische functies. Een variant 1/2 kan dezelfde bediening met andere steun of inhoud gebruiken. De concrete woordinhoud en hoeveelheid opdrachten binnen iedere variant zijn hier niet volledig geteld. In ABC staan daarnaast veertien groepen: puzzels, memory, klanktypen, klankslepen, voorschattende taken, papiermateriaal en toetsen met verschillende steunvoorwaarden. Het ABC-totaal van 557 oefenlinks omvat 370 links uit de zestien lijsten plus 187 links uit die aanvullende groepen; daarnaast vier schrijfpdf-links.

De huidige hoofdstructuur is nu rechtstreeks waargenomen, niet alleen overgenomen uit de analyse van 3 september:

| Hoofdonderdeel | Menugroepen | Oefenlinks | Overige links |
|---|---:|---:|---:|
| ABC | 30 | 557 | 4 |
| Junior | 12 | 213 | 10 |
| Schrijven | 19 | 280 | 0 |
| Lezen | 15 | 404 | 0 |
| Klanken | 82 | 525 | 1 |
| Luisteren | 14 | 178 | 0 |
| Spreken | 19 | 313 | 0 |
| Thema’s | 34 | 581 | 5 |
| Woorden | 16 | 254 | 0 |
| Regels | 21 | 180 | 0 |
| Grammatica | 5 | 119 | 9 |
| Extra | 29 | 230 | 202 |

Niet bij elkaar optellen als unieke lessen, lesuren of bewezen leeropbrengst. Dezelfde spelerfamilie en inhoud kunnen op meerdere plaatsen terugkomen. De zichtbare leesmenu's noemen ook A1/A2, B1 en B1/B2; die breedte gaat verder dan alleen beginnende alfabetisering. Zo'n vermelding is geen onafhankelijke niveauvalidatie van de inhoud.

| DigLin-domein in de te controleren scope | Eigen aansluiting | Klink-status op functieniveau |
|---|---|---|
| ABC, alle zestien lijsten | Eigen klank-/woordgroepen en kleine leesstappen | Bestaat gedeeltelijk |
| Junior | Leesfuncties en tekstvragen binnen de eigen route; geen aparte productlijn kopiëren | Bewust anders voor de productstructuur; leesfuncties gedeeltelijk |
| Schrijven | Natypen, dictee en papieropdrachten; functioneel schrijven/lettervorming open | Bestaat gedeeltelijk |
| Lezen | Eigen zinnen en teksten; zelfstandige betekenisvragen nog uitbouwen | Bestaat gedeeltelijk |
| Klanken | Schrijfeenheden en woordbouw aanwezig; losse klankroute/synthese open | Bestaat gedeeltelijk |
| Luisteren | Woordkeuzes en beperkte zinsvragen; tekstbegrip verder aansluiten | Bestaat gedeeltelijk |
| Spreken | Opnemen en modellen; zelf formuleren/gespreksrollen open | Bestaat gedeeltelijk |
| Thema’s | Situaties en gesprekken aanwezig; nog geen complete functionele themaroutes | Bestaat gedeeltelijk |
| Woorden | Woordbank en modellen; groepsbrede variatie uitbreiden | Bestaat gedeeltelijk |
| Regels | Geen complete aangesloten eigen regelroute | Ontbreekt |
| Grammatica | Geen complete aangesloten eigen grammaticaroute | Ontbreekt |
| Extra | Kaarten, memory en lokale mix; overige spellen/diagnostiek open | Bestaat gedeeltelijk |

Dit is een scopekoppeling op basis van de actuele menugroepen; niet iedere speler, inhoudsreeks of extern document is geopend/doorgespeeld. De grootste structurele verschillen zijn: meer handelingen rond dezelfde woorden, aparte klank- en taalonderdelen, en ondersteuning vóór/naast/na de digitale les. Extra bevat onder meer voorbereidende ABC-reeksen, alternatieve woorden met dezelfde klanken, printmateriaal en evaluatieformulieren. Klinks bronvoorraad en algemene papieropdrachten bewijzen nog niet dat zulke pakketten compleet bij de nieuwe woordgroepen zijn aangesloten. Die ondersteuning verdient een afzonderlijke vervolgcontrole; niet automatisch alle externe productonderdelen in Klink onderbrengen.

## Bouwcontract voor de vijf gekozen stappen

### 1. Het gezamenlijke woordenoverzicht

De huidige compacte onderdeelkaarten en Taalroute-indeling blijven staan. Binnen een onderdeel is de hele woordgroep het vertrekpunt: echte foto waar die geschikt is, geschreven woord en bestaande hele woordopname. Daarvandaan dezelfde woorden terugzien in oefenvormen. Geen lange technische dropdown als noodzakelijke ingang. Grote groepen mogen over rustige schermen verdeeld worden, met de complete groep herkenbaar bereikbaar; niet stilzwijgend terugbrengen tot één woord.

Eerste groep: mat, tas, map, man, pan, jas. Geen extra woorden zoals Jan toevoegen om een raster vol te krijgen. Bekend/nieuw/terugkeer blijft docent-/inhoudsmetadata, geen extra systeemtaal voor de cursist. Een docent of begeleide route kan een voorbereide deelgroep kiezen; volledig zichtbaar betekent niet dat ieder woord al zelfstandig beheerst wordt.

### 2. Woordbouw: reeks en werkblad

- Leerdoelen: WO-03, woordopbouw met model; WO-03 zonder zichtbaar model als afzonderlijke terughaaltaak. Zelfstandig lezen niet afleiden uit nabouwen.
- Reeks: alle geschikte doelwoorden één voor één; werkblad: dezelfde woorden op meerdere rijen, bij de eerste groep alle zes. Dit zijn twee weergaven van hetzelfde inhoudscontract, geen twee gekopieerde woordbanken.
- Slepen én tikken: bron kiezen, doelvak kiezen; toetsenbordalternatief, zichtbare focus, tikdoelen minstens 48 px. Dezelfde betekenis van terugzetten, verwisselen en opnieuw proberen.
- Behoud de bestaande leeseenheden. `aa`, `oe`, `ng` enzovoort niet willekeurig splitsen; een geschreven eenheid en een goedgekeurd klankmodel zijn afzonderlijke gegevens.
- Herhaald voorkomende letters krijgen unieke tegel-ID's. Fouten mogen geen correcte andere rijen wissen of keuzen plotseling verschuiven.
- Log per doelwoord poging, hulp, modelgebruik, respons en resultaat. Hervatten van een werkblad staat los van lesvoortgang.

### 3. Woordbingo en beeldbingo

- Leerdoel KL-08: heel woord horen en juiste woordvorm/het juiste betekenisbeeld vinden.
- Voor de eerste groep kan één kaart zes unieke doelen bevatten. Geen kunstmatig negende woord, dubbele gelijkwaardige foto of antwoordsteun in de opdracht.
- Elke beurt heeft één vastgelegde hele woordopname. Onbeperkt herhalen, geen overlap, dezelfde hoofdknop en duidelijke foutterugkeer.
- Voor kilometers maken is volledige woorddekking belangrijk: een eerste rij mag een tussenmoment zijn, niet automatisch het einde voordat de rest geoefend is. Registreer alle werkelijk behandelde doelwoorden; een bingo geldt niet als beheerste woordgroep.
- Een abstract woord zonder onderscheidend beeld hoeft geen beeldbingo-item te worden; het kan wel in woordbingo. Leg uitzonderingen expliciet vast.

### 4. Zoek de zin uit bestaande inhoud

- Geen nieuwe losse verzameling zinnen schrijven. Verwijs naar bestaande zin-ID's, zinsopnamen, betekenissen en plaatsing in Lexicon/Klink.
- Variant A: hoor de zin en vind de geschreven zin. Dit oefent auditief-schriftelijk herkennen, niet automatisch begrip.
- Variant B: kies de passende zin bij een situatiebeeld. Dit oefent betekenis alleen als het beeld de volledige relevante situatie laat zien. Een losse foto van een tas bewijst geen zinsrelatie.
- Gebruik twee tot vier doelbewuste opties met vergelijkbare bekende woorden. Voorkom dat één uniek trefwoord het hele antwoord verraadt. Houd zinsbouw en leesvoorwaarden zichtbaar in de docentcontrole.
- Zelfstandig lezen heeft geen automatisch voorgezegde doelzin. Luisterhulp blijft beschikbaar en wordt als hulp vastgelegd.
- Een fout behoudt de keuzen en wijst naar het betekenisverschil; volgende zinnen/herhaling blijven binnen de voorbereide inhoud.

### 5. Overige vormen aansluiten

Vervolgens bestaande beeldkeuzes, koppelen, memory, woorddictee, ontbrekende letters, zinsbouw en functionele teksttaken vanuit dezelfde woord-/zin-ID's voeden. H5P-verwante algemene patronen kunnen helpen: koppelen, slepen/tikken, dictee, gat aanvullen, markeren, ordenen en een gemengde reeks. Geen H5P-code of inhoud importeren en niet voor iedere variant een nieuwe bediening ontwerpen. Woordzoekers/kruiswoorden pas waar die een passend leerdoel toevoegen.

## Groei en meten

Kennismaken met de hele groep → herkennen tussen andere bekende woorden → construeren met model → terughalen zonder model → gebruiken in zin/situatie → gespreid terugkomen. Dezelfde woorden kunnen terugkeren met minder hulp, andere betekenisvolle combinaties en langere taal. Variatie komt niet alleen uit extra knoppen of een nieuwe willekeurige volgorde.

Meet aantallen unieke doelwoorden, geschikte oefenvormen, betekenisvolle contexten, hulp en latere terugkeer afzonderlijk. Maak geen totaalpercentage 'gelijk aan DigLin' uit aantallen menu-items. Afgerond, zelfstandig correct en door docent beoordeeld zijn verschillende gebeurtenissen.

De vaste Taalroute-ontwerpbasis is gelezen: boekdoel en relevante docentlesplanning/observatie horen bij dit losse materiaal. De concrete koppeling aan een werkelijk ingeroosterde bijeenkomst, tijd en eigen observatiepunten staat nog open; dit rapport verzint geen cursusprogramma of praktijkbeoordeling.

## Verificatie, herstel en open punten

Machineleesbaar: `outputs/diglin-comparison-20261017/comparison.json`; ruwe menumetadata: `outputs/diglin-comparison-20261017/diglin-menu-evidence.json`; export: `scripts/export-practice-gap-inventory.mjs`. Alle 38 functies, 15 onderdelen, volledige eigen woord-ID's, routetellingen, lokale mixdekking en 370 ABC-keuzevergelijkingen zijn vastgelegd. `scripts/audit-diglin-menus.mjs` is uitsluitend een interne Chrome-menucontrole, geen appfunctie of achtergrondmonitor. Menu's zonder oefenlinks kunnen andere documentlinks bevatten; werkelijk onopgeloste groepen blijven expliciet gemarkeerd.

Deze ronde verandert geen cursistinterface, inhoud, audio, publicatiestatus of voortgang. Bestaande niet-gecommitteerde wijzigingen blijven behouden. Geen GitHub Actions gestart, geen push/publicatie. Menselijke leerdervalidatie en complete DigLin-oefeninteractiecontrole zijn niet uitgevoerd.

Lokale hercontrole: 15 datatests geslaagd (audioregister, bouwchecklist, bestaande mix); 9 browsercontrolepunten van de bestaande mix geslaagd, waaronder alle vijftien onderdelen, vijf schermmaten, fout/audioherstel, toetsenbord/tikken en behoud van voortgang. De twee inventarisscripts zijn syntactisch gecontroleerd; de export heeft eigen integriteitscontroles. Dit bewijst niet dat de nog te bouwen sleepvariant, bingo of zinzoeker werkt. Die zijn in deze ronde niet gebouwd.
