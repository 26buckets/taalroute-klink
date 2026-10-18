# Klink: menureview, tegenlezing en herstel

## Status en werkwijze

18 oktober 2026. Review van de werkelijk bereikbare online cursist- en
docentomgeving en van de lokale ontwikkelversie met de nieuwe leerreeksen.
De aanpassingen hieronder zijn lokaal toegepast. Niets gepubliceerd of gepusht.
De eerdere nieuwe leerreeksen blijven afzonderlijk wachten op inhoudelijke vrijgave.
Geen audio gemaakt, gewijzigd of nieuw gekoppeld; Nico's audiopauze staat nu ook
in PUBLICATIE.md. Bestaande media, vijftien woordonderdelen, 302 lesroutes en de
Lexicon-indeling blijven ongewijzigd.

Dit zijn acht invalshoeken binnen één agentreview, ondersteund door kliktests.
Het zijn geen acht onafhankelijke menselijke experts, geen gebruikersonderzoek
en geen cursistproef. De oefenproductieskill bewaakt dat menu-ingangen en
oefendeelname niet als een aangetoond taalniveau worden voorgesteld. De
React-/reviewskills sturen behoud van gedrag, opslag, toetsenbordbediening en
gerichte regressietests. De opgegeven DigiBord-stijlreferentie is niet aanwezig
op het opgegeven pad; bestaande typografie, iconen, kleuren en knoppen zijn
hergebruikt. Geen nieuwe vormgevingsrichting geïntroduceerd.

## Eerste review

| Invalshoek | Concrete bevinding | Gevolg |
| --- | --- | --- |
| Beginnende lezer | Twaalf vaardigheidsnamen vragen een inhoudelijke keuze; iconen maken die keuze niet automatisch begrijpelijk. | De bestaande start en fotokaarten blijven de ingang voor begeleid beginnen. Geen claim van zelfstandig instappen. |
| Weinig digitale ervaring | De online woordenpagina hield het adres van het beginscherm. Na verversen verscheen opnieuw het beginscherm. | Een gevonden plek was niet betrouwbaar terug te vinden. |
| Docent | Leesstappen/Oefenkaart bij de docent, Lessen/Oefenen bij de cursist; een badge 10 naast Leesstappen sloot niet aan op de vijftien zichtbare onderdelen. | Mondelinge aanwijzingen kwamen niet overeen met wat de cursist zag. |
| Informatiearchitectuur | Woorden in het hoofdmenu is een woordbibliotheek; Woorden onder Oefenen is een verzameling opdrachten. | Dezelfde naam beloofde twee verschillende dingen. |
| Didactiek | Een fotokaart opent bewust eerst het gezamenlijke woordenoverzicht, niet onmiddellijk een les. | De uitleg van de klikroute moest dat tussenstation benoemen. |
| Toegankelijkheid | Het docentmenu verborg op een smal scherm bestemmingen in een horizontale scroller. Docentknoppen hadden geen actuele-pagina-aanduiding. | Niet alle ingangen waren direct zichtbaar of semantisch herkenbaar. |
| Bediening | De docentkop bevatte Zoeken en Meer zonder enige gekoppelde handeling. | Klikken leverde niets op; er werd functionaliteit beloofd die er niet was. |
| Technische kwaliteitscontrole | Hoofdstukken hadden deelbare adressen, maar andere pagina's en docenttabs niet. | Terug/vooruit en herladen gedroegen zich ongelijk. |

De livewaarneming van de fout: na klikken op Woorden bleef het adres
`#learner/home`; na herladen verscheen de startpagina. Er zijn geen
cursistantwoorden ingediend of online gegevens gewijzigd tijdens deze inspectie.

## Advocaat van de duivel

1. **Meer uitleg is geen oplossing voor iemand die nauwelijks leest.**
   Daarom geen uitgebreide handleiding boven de cursistkaarten. De klikwijzer
   staat uitsluitend bij de docent. De cursist krijgt alleen een korte
   plaatsaanduiding, bijvoorbeeld Oefenen · Klanken.
2. **Een nieuwe menustructuur zou eerder geleerde bediening weggooien.**
   De vijf hoofdknoppen, twaalf hoofdstukken, fotokaarten, woorden en lesroutes
   blijven behouden. Alleen de dubbelzinnige hoofdstuktitel Woorden wordt
   Woorden oefenen. De achterliggende adressen blijven gelijk.
3. **Een knop Zet klaar zou suggereren dat een leerling een opdracht ontvangt.**
   Dat bestaat hier niet. De docentwijzer opent de cursistweergave op hetzelfde
   apparaat; hij maakt geen toewijzing, profiel of voortgang aan.
4. **Verder kan op een gedeeld apparaat de les van iemand anders hervatten.**
   De docentwijzer benoemt apparaatgebonden opslag. Begin hier is geen instaptoets.
   De docent kiest bij een nieuwe cursist samen een passend onderdeel.
5. **Een mooi menu kan onafgemaakte inhoud verbergen.**
   Een hoofdstuk is een ingang, geen bewijs van volledige grammatica-, spelling-
   of niveaudekking. De bestaande inhoudelijke vrijgave blijft apart staan.
6. **Extra gesproken uitleg zou de audiopauze omzeilen.**
   Geen nieuwe opnamen, koppelingen of automatische spraak toegevoegd.
   Zonder verdere luistersteun blijft begeleiding bij de eerste navigatie nodig.

## Toegepast

- De docentnav gebruikt Overzicht, Lessen, Oefenen en Media; de cursistnav blijft
  Verder, Lessen, Oefenen, Woorden en Herhalen.
- Docentonderdelen gebruiken dezelfde cursistentitels als de fotokaarten.
  Het onderdelenaantal komt uit de actuele inhoud, niet uit een vaste badge 10.
- Woorden oefenen onderscheidt opdrachten van de algemene woordbibliotheek.
- Bij een hoofdstuk staat de plaatsaanduiding boven de bestaande paginatitel;
  geen voorbeeldwoord dat een antwoord kan verklappen.
- Cursistpagina's, woordonderdelen en docentpagina's krijgen passende adressen.
  Herladen en browsernavigatie keren terug naar die bestemming.
- Een onderdeel herladen opent het gezamenlijke woordenoverzicht. Een specifieke
  lopende les wordt nog steeds via Verder hervat; de nieuwe onderdeel-URL is geen
  permanente link naar iedere interne tab of afzonderlijke leshandeling.
- De docent krijgt een zichtbare klikwijzer met echte links naar cursistpagina's
  en alle twaalf hoofdstukken, plus uitleg over teruggaan via de browser.
- Niet-werkende Zoeken-/Meer-knoppen zijn verwijderd. Afsluiten heeft een
  passende toegankelijke naam.
- De vier docentknoppen blijven op smalle schermen zichtbaar in een eigen rij
  in dezelfde bovenbalk. Geen extra cursistknoppen of nieuwe zijbalk.
- Docentknoppen hebben minimaal 48px tikhoogte en een actuele-pagina-aanduiding.
  Een menukeuze begint bovenaan de pagina, ook op een telefoon.

## Waar klik je? — docentwijzer

| Doel | Klikroute | Wat volgt |
| --- | --- | --- |
| Voor het eerst beginnen | Beginscherm → Begin hier | Woordenoverzicht van het eerste onderdeel; kies samen of dit het juiste begin is. |
| Een les volgen | Lessen → fotokaart → Lessen → leskaart | Kleine opeenvolgende opdrachten in de bestaande lesroute. |
| Alle woorden uit één onderdeel samen oefenen | Lessen → fotokaart → Samen oefenen → oefenvorm | De gekozen oefenvorm met de beschikbare woorden van dat onderdeel. Waar passend: Eén voor één / Op één blad. |
| Rechtstreeks klanken, spelling of grammatica oefenen | Oefenen → hoofdstuk → oefenvorm → reeks | Geen verplichte omweg via een woordles. De nieuwe leerreeksen staan alleen in de ontwikkelversie. |
| Een woord terugvinden | Woorden → onderdeel kiezen | Woordbeelden, bestaande audio en Bewaar. Geen automatisch gestart oefenprogramma. |
| Eerder geoefende inhoud terughalen | Herhalen | Bewaarde woorden en beschikbare herhaling. Oefen opnieuw verschijnt alleen wanneer eerder gemaakte opdrachten aan de beurt zijn. |
| Bingo of gemengde oefenvormen kiezen | Oefenen → Samen herhalen → oefenvorm → woorden | Vrij oefenen; niet hetzelfde als de opgeslagen herhaalinhoud van de hoofdknop. |
| Een bestemming voor een cursist openen | Docent → Overzicht → Waar moet ik zijn? | Klik op de hoofdroute, of open de uitklaplijst met de twaalf hoofdstukken. Terug via de browser. |

## Tweede review

De tegenlezing leidde nog tot een aanvullende mobiele correctie: het docentmenu
moest niet alleen technisch horizontaal scrollbaar zijn, maar alle vier
bestemmingen tegelijk tonen. Dit is toegepast en met raakvlakcontroles getest.
Ook terugkeer naar de paginabovenkant via een actieve docentmenuknop is getest.

De brede hercontrole vond bovendien een opslagrace bij snel verlaten van een
gemengde oefenronde: de volgende opdracht was al zichtbaar, terwijl de opgeslagen
positie nog naar de vorige wees. De speler legt de positie nu vast vóór de
zichtbare schermwisseling. De regressietest controleert zowel de direct opgeslagen
positie als hervatten na onmiddellijk verlaten, met behoud van de lesvoortgang.

Een tweede regressiecontrole vond een dubbele afspeelonderbreking bij een
hoofdstuklink. Daardoor kon onterecht een geluid-foutmelding verschijnen, die de
woordkaart verschoof. De dubbele onderbreking is verwijderd; de bestaande
pagina- en spelerlevenscyclus blijft het afspelen stoppen bij weggaan. De vaste
kaartmaat en positie zijn opnieuw gecontroleerd met lam/kat, teruggaan, afspelen,
afbeeldingsladen en echt gesimuleerde afspeelfouten op vijf schermformaten.

De gerichte menutest controleert:

- Alle vijf hoofdknoppen, actuele selectie, verversen en browser terug/vooruit.
- Het juiste onderdeel na herladen en veilig terugvallen bij een onbekend onderdeel.
- Alle vier docentbestemmingen na herladen en alle twaalf hoofdstukverwijzingen.
- Geen verandering van de opgeslagen les door alleen een docentlink te volgen.
- Hervatten van de exacte opgeslagen oefening via Verder.
- Desktop, tablet en telefoon; zichtbare docentknoppen, 48px raakvlakken,
  geen horizontale pagina-overloop en een bereikbare Verder-knop.
- Toetsenbordbediening en geen docenthandleiding in het cursistscherm.

Het eindoordeel is beperkt: de concrete navigatiefouten zijn hersteld, maar dit
bewijst niet dat een niet-lezer het menu zonder begeleiding begrijpt. Een
praktijkproef is niet uitgevoerd en wordt niet alsnog als verplichte
publicatievoorwaarde ingevoerd. De volledige DigLin-inhoudsvergelijking blijft
een afzonderlijke, open opdracht. Publicatie is geen onderdeel van deze review.

## Afgeronde technische controle

- De volledige lokale `test:review`-keten, inclusief de vervolgtests voor
  groepsopdrachten, hoofdstukken, vaste kaartmaten, werkbladen, leerreeksen en
  menu's, is op de definitieve bron geslaagd: 75 unittests en 128 aanvullende
  script-/browsercontrolepunten, zonder gerapporteerde fouten.
- TypeScript, de gerichte lintcontrole van de aangepaste menubestanden en
  speler, en de diffcontrole zijn geslaagd. Dit is geen claim dat alle bestaande
  lintmeldingen in de gehele repository zijn opgelost.
- De productiebuild is geslaagd. De bestaande vinext-melding over onvolledige
  automatische routeclassificatie blijft zichtbaar; de werkende routes zijn
  afzonderlijk in de lokale browser getest.
- Alle zware controles zijn lokaal uitgevoerd. Geen push, GitHub Actions-run
  of publicatie gestart. Geen inhoudelijke vrijgave gewijzigd.
- Geen menselijke cursistproef of praktijkcontrole met een schermlezer uitgevoerd.
