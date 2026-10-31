# Review werkbladenoptie — Klink+docent
31 oktober 2026. Onderzocht: lokale app op bron 1bc40d10, actuele Drive-projectmap en productie-index KPD08. Dit is een review met een visueel structuurvoorstel. De app is niet gewijzigd en er is niets gepubliceerd.

## Conclusie
De huidige werkbladenpagina is nog een oud voorbereidingsscherm met een eenvoudige afdrukgenerator. De uitgebreid ontwikkelde werkbladbestanden zijn niet aangesloten. Het grootste probleem is daarom niet het ontbreken van gemaakte werkbladen, maar het ontbreken van een herkenbare, lesgebonden ontsluiting en één vastgelegde bronversie per werkblad.

## Wat daadwerkelijk is gecontroleerd
- 72 combinaties: acht lessen × Alfa A/B/C × Voordoen/Samen doen/Zelfstandig, plus kaartjes en docentobservatie.
- Werkelijke browserweergave en drie huidige Mat-afdrukken. Geen browserfouten tijdens de controle.
- Herladen na keuze Tas en rechtstreeks openen met een lesparameter.
- Drive-inventaris: oorspronkelijke afdrukken, afzonderlijke Mat-proef 05 en de actuele KPD08-index, docent-/opdrachtgegevens v0.4.3 en cursist-PDF's v0.4.
- Alle 240 opdracht-ID's geteld: uniek, 30 per les, tien per ronde. De voorbeeldzin en korte tekst zijn voor alle acht lessen gelijk aan die in de actuele app.
- Mat-proef 05 en de Mat-uitgave in KPD08 zijn naast de huidige appafdruk gelegd. Relevante pagina's visueel beoordeeld en PDF-resoluties uitgelezen.
- Geen volledige herbeoordeling van alle 240 opdrachten of alle 48 cursistpagina's, geen nieuwe volledige handenronde, fysieke proefdruk of klasproef. Deze review betreft de werkbladenfunctie en de aansluiting op de bestaande productie; geen volledige drukvrijgave.

## Bevindingen
| Onderdeel | Feitelijke werking | Gevolg / herstel |
| --- | --- | --- |
| Bestaande bestanden | Drive bevat 24 dubbelzijdige werkbladen voor acht lessen, 48 cursistpagina's en 240 opdrachten. Daarnaast bestaat een uitgewerkte Mat-set, proef 05, met zes pagina's en 30 opdrachten. | Sluit bestaande bestanden aan; vervang ze niet door opnieuw gegenereerde eenvoudige bladen. Versies tellen niet als extra lessen. |
| Huidige afdruk | De app genereert voor Mat A/B/C telkens één pagina. Het uitgewerkte materiaal bestaat uit twee pagina's per ronde. | De app toont dus niet de eerder ontwikkelde set. |
| Alfa A/B/C | De radioknoppen werken technisch. Doel, voorbereiding en de verborgen afdruk veranderen. A heeft letter-/woordwerk; B heeft zinswerk; C heeft tekstwerk. | De verandering is te slecht zichtbaar. Laat meteen het gekozen werkblad met voor- en achterkant zien. |
| Ondersteuning | Bij Alfa A zijn er drie verschillende gegenereerde vormen. Bij B en C zijn ‘Samen doen’ en ‘Zelfstandig’ exact identiek, bij alle acht lessen. ‘Voordoen’ voegt daar alleen een beginregel toe. | De bediening suggereert meer uitgewerkte variatie dan aanwezig is. Verwijder deze papierkeuze uit het voorstel totdat er echte, herkenbaar verschillende bestanden voor bestaan. Docentondersteuning kan als aparte aanwijzing blijven bestaan. |
| Vindbaarheid | Printmateriaal zit onder ‘Werkbladen printen’, onder lange teksten over doelen, voorkennis, ondersteuning en observatie. | Open met een lesoverzicht en een documentvoorbeeld, niet met voorbereiding. |
| Koppeling les → werkblad | Een actieve digibordles heeft geen rechtstreekse koppeling naar het bijbehorende blad. | Geef elke les een vaste werkbladactie met behoud van les en ronde; terug naar de les moet dezelfde lesstand herstellen. |
| Keuze bewaren | Na Tas kiezen en herladen wordt weer Mat getoond. Een URL met `teacher/materials?lesson=tas` opent de werkbladenpagina niet. | Leg les en ronde vast in de route. Terug, vooruit en herladen moeten dezelfde keuze behouden. |
| Materiaalsoorten | Cursistenblad, kaartjes en docentobservatie zitten in een keuzelijst onder hetzelfde inklapblok. | Toon ze als duidelijk benoemde documenten bij dezelfde les; houd het cursistenblad als primaire keuze. |
| Printen/downloaden | De primaire actie is de browserafdruk van de gegenereerde pagina. Er is geen directe download van de uitgewerkte PDF, geen duidelijk paginatal en geen zichtbare voor-/achterkant. | Bied PDF bekijken, downloaden en printen. Vermeld dubbelzijdig en omslaan langs de lange zijde; beweer niet dat de app de printerinstellingen automatisch instelt. |
| Informatie op verkeerde plek | Lesplan, voorkennis en geluidcontrole staan in het werkbladenoverzicht. De geluidtekst noemt zelfs m, korte a en t bij andere lessen. | Algemene handleiding in Studio; benodigde antwoorden/voorbereiding alleen contextueel bij de les. Verwijder de algemene geluidcontrole uit het werkbladenoverzicht. |
| Bronversies | Mat-proef 05 en Mat in KPD08 hebben niet exact dezelfde opmaak en antwoordkeuzes. Bijvoorbeeld bij ‘Wie komt binnen?’ verschilt de antwoordset. | Leg één gekozen Mat-uitgave vast en neem de bijpassende antwoorden over. Niet automatisch mengen op basis van een hoger versienummer. |
| Vrijgavestatus | Zowel de Mat-leesmij als de actuele KPD08-index noemen nog geen definitieve vrijgave. De index noemt open beeld-/druk- en praktijkpunten. | Houd beschikbaarheid, koppeling en goedkeuring apart. Noem een teruggevonden bestand niet automatisch de goedgekeurde officiële uitgave. |

## Voorgestelde schermen
### 1. Overzicht
De bestaande appkop, linkernavigatie, kleuren, typografie en knoppen blijven de basis. In de hoofdkaart staan dezelfde acht lessen als bij het digibord. Elke les heeft twee vaste keuzes:
- **Mat · Digibordles** — direct de les openen.
- **Mat · Werkblad** — de bijbehorende afdrukken bekijken.

Hetzelfde patroon geldt voor Tas, Map, Man, Pan, Jas, Pen en Pet. Geen uitgebreide lesplannen boven dit overzicht. Het bijgevoegde dashboardbeeld is uitsluitend een statisch voorstel, geen al aangesloten scherm.

### 2. Mat · Werkblad
Vaste kop: terug naar Werkbladen, ‘Mat · Werkblad’ en ‘Naar digibordles’. Daaronder drie duidelijke keuzes voor de docent:

| Keuze | Wat er zichtbaar wordt |
| --- | --- |
| Woord · Alfa A | Bijbehorend dubbelzijdig woordwerkblad |
| Zin · Alfa B | Bijbehorend dubbelzijdig zinswerkblad |
| Tekst · Alfa C | Bijbehorend dubbelzijdig tekstwerkblad |

Voor- en achterkant staan meteen in een vaste voorbeeldruimte. Daarnaast: **2 pagina's · 10 opdrachten · dubbelzijdig**, PDF bekijken, Download PDF en Print. Een afzonderlijke actie kan alle drie bladen van Mat samen aanbieden: zes pagina's. Kaartjes en antwoorden zijn afzonderlijk benoemde documenten; een docentblad wordt nooit ongemerkt meegeprint als cursistenblad. Alfa-labels zijn docentkeuzes, geen vereiste toevoeging op de cursistenpagina.

### 3. Vanuit de digibordles
Een vaste actie ‘Werkblad’ opent dezelfde les en sluit aan op de actieve ronde: Woord → Woordblad, Zin → Zinsblad, Tekst → Tekstblad. De docent kan daarna bewust een andere ronde kiezen. Open geen nieuwe voorbereidingstap. Bij teruggaan zijn geplaatste kaartjes, eigen zinnen en lespositie behouden. De werkbladkeuze verandert de digibordles niet.

## Inhoud en drukwerk
De bestaande serie bevat al een echte opbouw van woord naar zin naar tekst; het is niet nodig om alleen andere doelen boven hetzelfde blad te zetten. De ondersteuning Voordoen/Samen doen/Zelfstandig is een andere dimensie dan Alfa A/B/C. Als drie papieruitgaven werkelijk nodig zijn, moeten het eigen gecontroleerde documenten worden. Voor de eerste goede aansluiting adviseer ik één herkenbare bestaande uitgave per les en ronde.

Mat-proef 05: zes A4-pagina's; de gecombineerde afbeelding op de eerste pagina heeft circa 168 × 166 ppi, onder de streefwaarde 300. Andere geplaatste Mat-foto's hebben meer dan 500 ppi. Dat is geen bewijs van Krea-enhancement en geen volledige scherpte-/drukvrijgave. De productie-index houdt bij de bredere serie onder andere MAN-handen, JAS-scherpte, herkomst/rechten en fysieke proefdruk open. De afgesproken digibordtekst blijft behouden; een oude open inhoudsnotitie is geen aanleiding die stilzwijgend te veranderen.

**Vergeet niet je afbeeldingen te boosten/controleren vóór het drukken.** Deze review levert geen nieuw drukbestand op. Krea-bewijs en definitieve druk-/praktijkcontrole blijven open.

## Aanpak en acceptatie
1. Leg de gekozen Mat-PDF en bijbehorend antwoordbestand vast; noteer de verschillen tussen Mat-proef 05 en KPD08.
2. Sluit één volledig Mat-pakket aan via de gedeelde les-ID: digibord, drie bladen en antwoorden.
3. Bouw het overzicht en de leskoppelingen met de bestaande schermstructuur. Geen nutteloze ondersteuningskeuzes.
4. Controleer openen, teruggaan, herladen, vaste kaartposities, beide PDF-zijden, download/afdruk en scheiding van cursist-/docentmateriaal.
5. Sluit dezelfde structuur aan op de zeven andere bestaande pakketten, met hun eigen bron- en vrijgavestatus.

Een oplevering is pas functioneel compleet als een docent vanuit Mat met één gerichte actie het Mat-blad bereikt, de keuze zichtbaar echt een ander document toont, teruggaan de les herstelt en het gedownloade bestand exact de gekozen uitgave is. De app is voor deze review bewust ongewijzigd gebleven; het voorstel is nog geen implementatie of publicatie.

## Bronnen en herstel
- Projectmap: https://drive.google.com/drive/folders/1BonW2_yUQW8TAu_mWB1RVfM8iaxq9C7O
- Mat-proef 05: https://drive.google.com/drive/folders/10XJj3EBIO2Yna9SBWIazuEBD1Hy5M1Cc
- KPD08-index: https://docs.google.com/document/d/1GP1BY3qKYELwBwZtqFL32g_LN-EO0qEabc9ZIUV0pw0/edit
- Actuele opdrachtgegevens: https://drive.google.com/file/d/120Hde8UqeHXILAX_UsWi6L_OMhljeV-V/view
- Code: components/product/teacher-classroom.tsx (TeacherMaterials, Worksheet), teacher-route-stage.tsx (RouteWorksheet), teacher-workspace-frame.tsx.
- Bewijs: outputs/werkbladen-review-20261031/app-review.json, bronvergelijking.json, huidige Mat-afdrukken, originele Mat-PDF's, resolutiecontrole en dashboardvoorstel.
