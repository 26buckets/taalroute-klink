# Werkbladen bij alle acht digibordlessen

## Opdracht en uiterlijkakkoord

Nico, 31 oktober 2026: “Prima, voer dit zo door voor alle acht lessen. Koppel de bestaande werkbladen en zorg dat ik vanuit de digibordles direct naar het juiste werkblad kan. Kies voor Mat de uitgave die het beste aansluit bij de les, met het juiste antwoordblad.”

Dit is akkoord op het dashboardvoorstel in `docs/werkbladen-review-20261031/REVIEW.md`: één kaart per les met Digibordles en Werkblad. Alleen dit docentonderdeel en de expliciet gevraagde Werkblad-knop in de les zijn gewijzigd. De bestaande cursistenopzet en de overige docentvormgeving blijven behouden. Deze opdracht is lokaal uitgevoerd; geen nieuwe livepublicatie of wijziging van de canonieke live-vormgevingsvloer.

## Gekozen bronnen

- Alle acht lessen gebruiken de bestaande KPD08-cursistenbladen v0.4, 24 originele dubbelzijdige PDF's. Geen heropmaak, nieuwe opgaven, aangepaste afbeeldingen of nieuwe audio.
- Mat gebruikt dezelfde pakketuitgave. Woord, zin en tekst passen bij de huidige digibordles; de zin en drie tekstzinnen zijn exact gelijk. Dit houdt de Mat-opgaven, het antwoordmodel en de andere zeven lessen in één samenhangende uitgave. De afzonderlijke Mat-proef05 is behouden in Drive en is niet met deze antwoorden gemengd.
- Antwoorden, voorleesteksten en docenthandelingen komen exact uit de actuele v0.4.3-opdrachtgegevens. De 240 antwoorden zijn stuk voor stuk met die bron vergeleken.
- Het volledige actuele v0.4.3-docentbestand is afzonderlijk uit Drive opgehaald: het herstel-ZIP bevat nog een ouder v0.4-docentbestand. Dat oudere bestand wordt niet aangeboden.
- Bron-ID's, bestandshashes en versies staan in `sources.json`. De oorspronkelijke projectmap is https://drive.google.com/drive/folders/1BonW2_yUQW8TAu_mWB1RVfM8iaxq9C7O .

## Gebruik

Werkbladen toont Mat, Tas, Map, Man, Pan, Jas, Pen en Pet. Iedere kaart heeft twee gelijkvormige links. Onder Werkblad staan Woord / Alfa A, Zin / Alfa B en Tekst / Alfa C; iedere keuze toont de voor- en achterkant van het eigen originele document, twee pagina's en tien opdrachten.

“Openen en printen” opent de originele PDF in een nieuw tabblad; de browser/PDF-lezer verzorgt het afdrukken. “Downloaden” bewaart precies dezelfde PDF. Dubbelzijdig omslaan over de lange zijde is een printerkeuze, niet een instelling die de app stilzwijgend kan afdwingen.

“Antwoorden voor de docent” toont uitsluitend de tien bijbehorende antwoorden met eventuele voorleestekst en docenthandeling. Afdrukken daarvan bevat geen cursistenwerkblad. Het volledige docent-PDF blijft apart downloadbaar. “Extra materiaal” bewaart de bestaande letter-/woordkaartjes en docentobservatie; die worden afzonderlijk geprint.

De Werkblad-knop op het bord opent het juiste les-/rondeblad. De actieve les blijft gemount maar verborgen, inclusief gelegde kaartjes, schrijfvlak, gekozen fase en pauze. Terug naar de les en browser-terug herstellen hetzelfde bord. De werkbladkeuze verandert de lesronde niet. Herladen behoudt les, ronde, fase en opgeslagen werk. Niet-opgeslagen tijdelijke bordtekeningen worden, zoals voorheen, niet na een volledige paginaherlading hersteld.

Werkbladlinks bevatten les en ronde; ongeldige lessen tonen het overzicht, ongeldige rondes vallen terug op Woord. De bestaande projectiebeveiliging blijft buiten de bewust geopende werkbladroute actief. Antwoorden worden niet automatisch uitgeklapt.

## Controle en grenzen

Gerichte controles: 24 bytegelijke A4-PDF's met elk twee pagina's; 48 oorspronkelijke voorvertoningen; 240 unieke bronantwoorden; les-/rondekoppelingen, herladen, teruggaan, geïsoleerde afdrukken, mobiel en desktop in Chromium/WebKit. De bestaande bord-, pauze- en randgevalcontroles zijn lokaal uitgevoerd. Geen GitHub Actions of publicatie.

De bronstatus voor drukwerk blijft apart: geen aantoonbare Krea-enhancement en geen volledige definitieve drukvrijgave voor deze acht pakketten. Resoluties zijn per les vastgelegd in `print-status.json`; alleen pixel-/ppi-waarden bewijzen geen scherpte of correcte handen. De eerdere open controlepunten voor MAN-handen, JAS-scherpte, rechten, fysieke proefdruk en praktijktoets zijn niet als opgelost aangemerkt door deze technische koppeling. De bestaande leschronologie en bronbeelden zijn ongewijzigd.

Vergeet niet je afbeeldingen te boosten/controleren vóór het drukken.
