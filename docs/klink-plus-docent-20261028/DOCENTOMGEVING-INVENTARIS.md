# Bestaande docentomgeving — inventarisatie 28 oktober 2026

De bestaande TeacherApp in components/product/staff-apps.tsx heeft zes ingangen. Klink+docent is een onderdeel van deze omgeving, geen tweede docentportaal. De nieuwe link Docentomgeving in het algemene Klink-menu opent /#teacher; Klink+docent blijft bereikbaar via het bestaande docentmenu en opent rechtstreeks de lesstart.

| Onderdeel | Aanwezig en bekeken | Begrenzing |
|---|---|---|
| Overzicht | Uitleg waar lessen/oefeningen staan, beeldvoorbeelden, lespakketten en inhoudsaantallen | Combineert praktische docenthulp en veel inhouds-/maakoverzicht |
| Klink+docent | Les openen; samen Woord, Zin en Tekst op het bord; acht fasen en vijf hulpmiddelen | Alleen de uitgewerkte mat-les; geen volledige methode- of niveaudekking |
| Docentinformatie | Doelen, Alfa-koppeling, scripts, observaties en printbare werkbladen | Nu specifiek gekoppeld aan mat; staat los van het bord en bepaalt de lesstart niet |
| Lessen | Bestaande lesonderdelen, leesstappen en toegang tot oefenspelers | Niet ieder onderdeel is afzonderlijk inhoudelijk opnieuw beoordeeld |
| Oefenen | Leesstapkeuze, concrete oefeningen, docenthulp per leesstap, dekkings-/bouwstatus en uitbreidingsideeën | De lijst met mogelijke opdrachten is geen lijst volledig gerealiseerde opdrachten |
| Media | Audioregister en beschikbaarheids-/reviewinformatie over beeld en geluid | Aanwezigheid van bestanden is geen afgeronde menselijke mediareview |

De algemene Docentenhandleiding blijft een afzonderlijke bestaande link naar Studio. De huidige Docentinformatie bevat juist lesgebonden materiaal. Die twee functies moeten bij verdere inrichting herkenbaar uit elkaar blijven.

## Advies, nog geen herindeling

Gebruik één hoofdingang Docentomgeving. Maak Klink+docent op de docentstart herkenbaar als Lesgeven. Laat Lessen en Oefenen dienen om bestaand aanbod te vinden. Geef lesplannen en werkbladen een duidelijke plek als Lesmateriaal. Houd de uitgebreide inhoudsdekking, ontbrekende media en uitbreidingsideeën achter aparte details of een onderhoudsoverzicht; die hoeven de dagelijkse lesstart niet te bepalen. Behoud de leerlingstart en de directe bordles.

## Uitgevoerd en gecontroleerd

Alleen de algemene menulink is toegevoegd; geen nieuwe omgeving of herindeling. Menu gecontroleerd op desktop en mobiel, licht en donker, met behoud van handleiding, kleurstand en delen. Docentonderdelen geopend; via Klink+docent naar Les openen doorgelopen. De link is ook vanaf een handleidingpagina gecontroleerd. Bestaande leerlingopslag bleef ongewijzigd. Types en gerichte lintcontrole slagen. Native navigatie is bewust gebruikt: de bestaande app reageert op hashchange; router-Link gaf in de controle geen overgang naar de docentweergave.

Geen volledige inhoudsaudit, audio-/beeldreview of klasproef uitgevoerd. Geen livepublicatie.

## Teruggevonden in eerdere chats

Op verzoek van Nico opnieuw teruggezocht, 28 oktober 2026:

- **KLINK: opzet lijsten** (`01a06915-d095-7f61-85b7-6179f046ff90`): op 14 oktober was Docent → Oefenkaart al een overzicht van concrete oefeningen en mogelijke uitbreidingen. Op 18 oktober werd de docenthulp per leesstap gepubliceerd: Docent → Oefenen → onderdeel en leesstap → Deze leesstap begeleiden. De vijf handelingen waren betekenis, voordoen, zelf proberen, gebruiken en later terughalen. Chatbevindingen zijn gecontroleerd tegen de huidige bron; historische aantallen zijn niet als actuele voorraad gepresenteerd.
- **KLINK: Didactische handleiding** (`01a14e38-901d-7cb2-8312-11a49b18ddef`): op 18 oktober is de handleiding ingebouwd, daarna op expliciet verzoek omgezet naar een wiki met twaalf onderwerpen en herschreven voor directe toepassing in eenvoudige taal. Dit is de algemene uitleg, niet het klassikale bord.
- **Klink — UI en gebruiksgemak** (`01a1471a-b60e-7810-87c5-425a9cf936af`): aanvullende UI-review, geen bewijs voor een aparte tweede volledige docentapp.

De huidige bestaande omgeving is dus het inhouds- en begeleidingsportaal met Overzicht, Lessen, Oefenen en Media. Klink+docent en de losse mat-informatie zijn later aan dat menu toegevoegd. Het huidige Oefenen-scherm mengt docenthulp met ontwikkelstatus; dat verklaart de onduidelijke functie. Geen herindeling uitgevoerd. Voor Nico is Deze leesstap begeleiden: mat in zijn bestaande tab opengeklapt. Een eerdere chatbeschrijving bewijst niet dat alle destijds genoemde ideeën volledige lessen zijn geworden.
