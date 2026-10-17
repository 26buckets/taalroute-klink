# Klink: cursistentaal, lijsten en woordbeelden

Nico vroeg op 17 oktober om eenvoudige, minder aanwezige cursistentaal, alle bestaande lijsten, volledige media en online publicatie. De cursistpilot volgt pas aan het einde en is geen voorwaarde voor deze werkzaamheden.

- Alle 16 lijsten en 302 lesroutes staan in de cursistnavigatie. Kaarten tonen echte les- en woordaantallen in plaats van een onduidelijk klein woordvoorbeeld.
- Interne lijstnamen en oefencategorieën zijn vervangen door korte leerlinglabels. De bronleerlijn, betekenis-ID's, routes en opslag blijven behouden.
- Vierkante, rustige bediening en aparte scrollruimte voor oefeningen blijven uit de eerdere UI-review behouden. Lijstaantallen en Open hebben vaste tussenruimte. Een beschikbare foto verderop in de lijst kan als lijstbeeld dienen.
- Contextbeelden bij functiewoorden en abstracte relaties zijn gemarkeerd met `imageUse: context`. Ze blijven zichtbaar bij de introductie en woordkaarten, maar worden niet gebruikt als zelfstandig goed/fout-antwoord bij fotokeuze, koppelen of memory. Dit voorkomt bijvoorbeeld dat een voorwerpfoto wordt getoetst als betekenis van het lidwoord 'de'.
- 19 van de 161 ontbrekende woordbeelden zijn toegevoegd en door de assistent visueel gecontroleerd. Er ontbreken nog 142 beelden. De eerste brief is wegens pseudoletters vervangen; het fietspadbeeld met een linksrijdende fietser is apart bewaard en niet gekoppeld. Menselijke beeldvrijgave staat open.
- De merkvelden van 338 woordopnamen, 12 contextopnamen, 18 instructieopnamen en 7 extra begripsopnamen zijn gecontroleerd. Er ontbreken geen gekoppelde opnamen.
- Het nieuwe taal-/lijstonderzoek controleert alle 16 lijsten en 302 lesroutes. Desktop en mobiel zijn visueel bekeken. De echte-audiotest slaagt tegen de gebouwde app; een eerdere timeout trad op tijdens ontwikkeling met herladen van bronbestanden.

Bewijs, generatieprompts, originele beelden en afzonderlijke testlogs staan in `outputs/alfa-publicatie-20261017/`. Het productieregister bewaart de hashes van bron en webbeeld. `scripts/import-klink-image-completion.mjs` koppelt alleen visueel goedgekeurde batchregels en overschrijft geen bestaand ander beeld.

Nog niet gepubliceerd. De normale publicatiecontrole blijft intact. De herkomst van de huidige liveversie is opnieuw bevestigd; definitieve media, inhoudelijke vrijgave en de laatste lokale controles moeten af zijn vóór publicatie vanuit de canonieke main-branch. Een menselijke review mag niet worden ingevuld alsof die is uitgevoerd wanneer alleen automatische controle is gedaan.
