# Klink — vaste vormgevingsbasis

Gericht aanvullend akkoord van Nico, 31 oktober 2026: uitsluitend het woord **maand** wordt in Klink+docent op schermen smaller dan 361 pixels met 80px weergegeven. Nico zag het concrete voorbeeld en antwoordde: “Ja, voer dit gerichte herstel uit”. Zie `docs/lespakketten-10-15-20261031/month-appearance-approval.json` en het bijbehorende voorstelbeeld. Alle overige woorden, breedtes, schermen en vormgeving behouden de vaste vloer. De oorspronkelijke `docs/appearance-floor-20261031/floor.json` blijft ongewijzigd.

Nico, 31 oktober 2026: “zorg dat deze versie de nieuwe vloer wordt en dat we die even vastzetten en dat er niet zomaar meer veranderingen plaatsvinden zonder duidelijke toestemming bedoel ik. En dit bedoel ik hier bedoel ik alleen maar mee hoe het eruitziet. De content is een ander verhaal, dat moeten we blijven updaten, blijven toevoegen, enzovoort.”

Deze afspraak betreft uitsluitend het uiterlijk van de echte Klink-app. Lees dit bestand vóór ontwerp, onderhoud, review en publicatie, samen met PUBLICATIE-ACTUEEL.md. Een inhoudelijke opdracht, opschoonverzoek, nieuwe afbeelding of algemene verbetering geeft geen toestemming voor een nieuw ontwerp.

## Wat blijft staan

- De goedgekeurde schermindeling, menu-opmaak, plaats van navigatie en kaarten, tussenruimtes, achtergrondvlakken en witte werkkaarten.
- Direct kiezen, de zichtbare niveauknoppen en de klankenkaart. De verborgen B2-knop houdt zijn gereserveerde ruimte tot Nico expliciet iets anders vraagt.
- Het cursistenmenu met Start, Woorden bekijken en Nog een keer; de bestaande indeling binnen categorieën en oefenvormen.
- Het gecentreerde blok Kies eerst een woord bij nul bewaarde woorden, ook naast beschikbaar herhaalwerk of een woordenmix.
- Lettertypes, letterdiktes, iconen, knoppen, focusweergave, contrast en de goedgekeurde lichte en donkere stand. Behoud logo D en de reeds afzonderlijk goedgekeurde naam-/docentaanduiding.
- De afzonderlijk expliciet goedgekeurde docentvormgeving. Deze afspraak is geen nieuwe opdracht om de cursisten- of docentomgeving te herontwerpen.
- De afgesproken compositie op desktop, tablet en telefoon. Een nieuw schermafmeting is geen aanleiding om het productmodel of de navigatie opnieuw te bedenken.

## Inhoud blijft in ontwikkeling

Woorden, betekenissen, teksten, instructies aan de cursist, lessen, oefeningen, onderwerpen, beelden, audio en inhoudelijke correcties mogen volgens de geldende inhouds- en publicatieafspraken worden toegevoegd en bijgewerkt. Aantallen, voortgang, lijstlengtes en beschikbaarheid mogen met die inhoud veranderen. De inhoud gebruikt de bestaande kaarten, spelers en schermstructuur.

Een nieuwe oefening binnen een bestaande vorm vraagt geen nieuw vormgevingsakkoord. Een nieuwe schermindeling, ander menumodel, verplaatste kaarten, nieuwe visuele oefenvorm, ander logo of gewijzigde huisstijl wel. Deze vastzetafspraak geeft geen nieuwe inhouds-, audio-, publicatie- of luistergoedkeuring en heft bestaande broncontroles niet op.

Functionele reparaties blijven mogelijk op concrete opdracht. Behoud daarbij het uiterlijk, alle inhoud, audio en bestaande voortgang. Een functionele wijziging in een UI-bronbestand is niet automatisch een visuele wijziging: toets wat de gebruiker werkelijk ziet. Een ongewijzigde bestandsnaam of een gewijzigde hash alleen bewijst geen visuele gelijkheid of verschil.

## Voor iedere wijziging en publicatie

1. Stel de actuele liveversie en canonieke main vast. Gebruik de referentie hieronder; publiceer nooit een oudere vloer terug.
2. Benoem in de review of de wijziging inhoudelijk, functioneel of visueel is. Vergelijk de geraakte schermen op desktop en mobiel en, waar van toepassing, licht/donker.
3. Verandert het uiterlijk? Werk het concrete voorstel eerst uit en leg het verschil aan Nico voor. Publiceer dat verschil alleen na zijn duidelijke, afzonderlijke toestemming. Een inhoudelijke opdracht of een oud algemeen publicatieakkoord is onvoldoende.
4. Leg het precieze akkoord, de geraakte schermen/bestanden, broncommit en controle vast. Werk alleen de expliciet goedgekeurde referenties bij; behoud het vorige referentiepunt en herstelmateriaal. Geen stilzwijgende herijking van de hele vormgeving.
5. Voer de bestaande lokale controles en gewone publicatiepoort uit. Geen omzeiling, alternatieve publicatiebranch of zware GitHub-workflows.

Er is bewust geen algemene app-, branch- of contentbevriezing: inhoud en noodzakelijke reparaties moeten kunnen doorgaan. Deze afspraak verbiedt uitsluitend niet-opgedragen wijzigingen aan het uiterlijk.

## Referentie en herstel

De actuele goedgekeurde livebron, een vast Git-referentiepunt, de stijl-/UI-bronhashes en bestaande schermcontroles worden geregistreerd in `docs/appearance-floor-20261031/floor.json`. Die hashes en schermen zijn vergelijkingsmateriaal, geen verbod op inhoudelijke of aantoonbaar niet-visuele codewijzigingen.

De bronbewijzen, oude referenties en gecontroleerde Drive-herstelkopie staan in hetzelfde dossier. De afzonderlijk expliciet opgedragen Klink+docent-publicatie is bevestigd op livebron `cc7fff4646d3ad9bdb33f13cc7e75eec1b356fa2`. Haar geslaagde live-/behoudcontroles staan in `docs/docent-lessen-release-20261031/`; de bijbehorende expliciete opdracht staat in `docs/klink-owner-release-docent-lessons-20261031.json`. Dit is geen toestemming voor overige wijzigingen.
