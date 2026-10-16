# De bestaande Klink-route vollediger verbinden

De lokale werkversie blijft de bestaande Klink-app. De vaste Lexicon-editie, alle betekenis-ID’s, de tien bouwgroepen, vijf langere-woordroutes en voorbereiding blijven behouden. Geen extra import of nieuwe indeling. Geen nieuwe media of losse t-opname. Geen publicatie.

## Waar de uitbreiding staat

- **Cursist → Lessen:** de gekozen fotostrook vervangt alleen de sectieknop. De foto is een bestaand woordbeeld uit die sectie. Geen willekeurig vervangbeeld; ontbreekt een passende foto, dan staat er een boekicoon.
- **Cursist → Lessen → Start:** dezelfde oefenspeler ordent passende opdrachten als kennismaken, herkennen, zelf maken, gebruiken en herhalen. Alleen aanwezige fasen worden getoond. Op een smal scherm staat alleen de huidige fase in beeld.
- **Cursist → Oefeningen:** binnen een bestaande oefenvorm zijn varianten expliciet te kiezen, bijvoorbeeld natypen of dictee. Dit keuzemenu staat niet in de begeleide les.
- **Cursist → Verder:** hervat de laatst geopende opdracht op dit apparaat. Een afgeronde les wijst naar de volgende les binnen hetzelfde onderdeel; na de laatste les terug naar het lessenoverzicht. Geen fictieve datum of beheersingsclaim.
- **Docent → Oefenkaart:** per bestaande leesstap de vier statussen, voorbereide woorden, lesfasen en concrete tekorten. De eerdere mogelijkhedenbibliotheek staat ingeklapt daaronder.

## Didactische selectie

Alle woorden van een stap worden eerst aangeboden. Keuzealternatieven komen uitsluitend uit die voorbereide selectie. Verschillende betekenissen van hetzelfde geschreven woord worden niet als woordkeuze tegen elkaar uitgespeeld. Beeldkeuzes vereisen verschillende bestaande beelden. Koppelen gebruikt maximaal twee voorbereide beeld–woordparen en werkt met tikken of toetsenbord.

Een begeleide route bevat maximaal zestien opdrachten. Een eenvoudige stap met één woord is bewust korter dan acht opdrachten; er worden geen extra woorden verzonnen om een quotum te halen. Introducties en terugkeerwoorden verdwijnen niet. Bij langere routes blijven aanvullende varianten zoals letters aanvullen beschikbaar bij vrij oefenen, zonder alle varianten verplicht te maken.

Het woord bouwen met voorbeeld blijft beschikbaar. Nieuw zijn dictee zonder zichtbaar antwoord en een hoorbaar woord terugbouwen zonder volledig model. Dictee is bij alle woorden met audio beschikbaar, maar alleen in de langere-woordroutes standaard aangesloten: toetsenbordvaardigheid is geen instapvoorwaarde voor de eerste klankstappen.

Bij ontbrekende letters wordt een volledige bestaande leeseenheid weggelaten: bijvoorbeeld **b…k → boek**, niet het willekeurig opknippen van **oe**. Afleiders komen uit voorbereide lettereenheden; gelijke-klankparen zoals ei/ij en au/ou worden niet als auditief onderscheid behandeld. De keuze motiveert een letterpositie, niet een los geïsoleerd klankfragment. Ontbreekt woordaudio of een bruikbare afleider, dan ontstaat die opdracht niet.

‘Gebruiken’ bevat in deze ronde betekenis koppelen. Dat is uitdrukkelijk nog geen contexttransfer. De volgende inhoudelijke uitbreiding — eigen combinaties, zinnen en situaties — staat per stap als ontbrekend, met afzonderlijke voorwaarden voor luisteren en zelfstandig lezen. Er worden geen geknipte woordopnamen als zinsaudio gepresenteerd.

## Bediening en gegevens

- Een luisteropdracht wordt pas beantwoord nadat het geluid technisch is gestart. Een afspeelfout blijft zichtbaar en herstelbaar. Dat is geen beoordeling van de uitspraak.
- Goede beoordeelde antwoorden gaan na korte feedback automatisch door. **Blijf hier** stopt dat; daarna gaat de cursist zelf verder. Er zijn geen timers of tijdscores voor de cursist.
- Verkeerde antwoorden verplaatsen de keuzes niet. Koppelen bewaart goede paren en de geselecteerde bron. Woordbouw behoudt de gelegde letters en heeft **Eén terug**. Dictee behoudt de getypte tekst en ondersteunt Enter.
- De voorbeeldknop bij dictee/terughalen toont alleen op verzoek het woord. Gebruik ervan wordt als hulp vastgelegd.
- De cursor wordt betekenis- en lesgebonden gevalideerd. Beschadigde of verouderde browsergegevens worden genegeerd. Geblokkeerde opslag verhindert oefenen niet.
- Maximaal 200 lokale antwoordregistraties bevatten oefen-ID, modus, antwoord, correctheid, aantal pogingen, gebruikte steun, responstijd, leerdoel en het onderscheid antwoord/participatie. Geen persoonsgegevens, muisregistraties, uploads of opgeslagen stemopnamen. Dit is geen account of leerlingvolgsysteem.
- Nabouwen met een zichtbaar model wordt als modelsteun gemarkeerd. Nazeggen en schrijven na zelfcontrole zijn deelname, geen automatische uitspraak- of beheersingsgoedkeuring.

## Controle en begrenzing

De data-/contractcontrole dekt alle 302 selecteerbare routes: 37 kernleesstappen, 3 herhaalmomenten, 23 uitbreidingssets en 239 afzonderlijke woordroutes. Dit zijn niet 302 afzonderlijk geschreven lessen. De oorspronkelijke 337 woordvormen / 338 betekenissen blijven intact.

Lokale controles staan in `scripts/test-lesson-extension.mjs`, `scripts/test-lesson-extension-browser.mjs` en de bestaande curriculum-, browser- en levenscycluscontroles. De nieuwe browsercontrole omvat onder meer een complete kernroute, een langere-woordroute met dictee, foutafhandeling, hervatten, pauzeren, toetsenbordbediening, geblokkeerde opslag en desktop/tablet/390/320px. Audiofouten worden daarin gecontroleerd nagebootst; daarnaast controleert de bestaande browserreeks echte lokale audiobestanden. Dit is geen menselijke uitspraakcontrole, volledige screenreadersessie of cursistonderzoek.

Het volledige lintcommando heeft bestaande fouten in niet-gewijzigde UI-/demobestanden. Gewijzigde productiebestanden worden apart gecontroleerd; TypeScript en de productiebuild moeten slagen.

Publicatie blijft geblokkeerd door de bestaande vrijgavecontrole: ontbrekende woordmedia, instructie-audio en menselijke uitspraak-/beeldbeoordeling staan open. De cursistpilot is door de eigenaar niet verplicht gesteld. De werkbranch blijft los van de canonieke publicatiebranch. Er worden geen GitHub Actions toegevoegd of gestart voor deze controles.

## Gerichte tegencontrole

1. **Meer opdrachten ≠ meer leren:** de begeleide route is begrensd; extra typen blijven optioneel.
2. **Een correct model kopiëren ≠ zelf lezen:** modus en steun worden onderscheiden; dictee verbergt ook het woord in de lestitel.
3. **Aanwezige audio ≠ correcte uitspraak:** inhoudelijke beoordeling en instructie-audio blijven open.
4. **Eén woord ≠ twee betekenisopties:** geen kunstmatige keuze of memory bij de eerste éénwoordstap.
5. **Een foto koppelen ≠ handelen in context:** zinnen en situaties zijn niet ten onrechte als af gemarkeerd.
6. **Automatisch verder ≠ haast:** pauzeren blijft mogelijk; bij fouten gaat de route niet door.
7. **Een hervatplek ≠ beheersing:** geen niveau-uitspraak of adaptieve planning op basis van alleen een afgeronde les.
8. **Een groen technisch resultaat ≠ publicatie:** de bestaande vrijgavebeveiliging blijft ongewijzigd.

De exacte routekeuzes en ontbrekende inhoud zijn reproduceerbaar met `node scripts/export-lesson-coverage.mjs`. Die uitvoer hoort bij de privé-oplevering, niet bij het cursistenscherm.
