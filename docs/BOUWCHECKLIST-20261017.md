# Klink — vaste bouwchecklist en vervolglijn

## Nieuwste implementatiestand: groepsbibliotheek

Zie `KLINK-GROEPSOEFENINGEN-20261017.md`. De uitbreiding is nu gebouwd: maximaal 31 eigen oefenkeuzes per bestaande woordgroep, met slepen/tikken, twee meerwoordenwerkbladen, bingo, zinnen zoeken/dictee/nazeggen en optionele temposteun. Veertien bredere hoofdonderwerpen staan in de docentkaart met werkelijke dekking en hiaten. Negen nieuwe instructieopnamen hebben een vaste ID; ze zijn nog niet geproduceerd. Geen publicatie of volledige methodepariteit. Onderstaande inventaris-/tussenstanden blijven historische onderbouwing; de actuele gegenereerde vergelijking en dit nieuwe verslag hebben voorrang voor de lokale bouwstatus.

## Concrete uitbreidingsvolgorde: hele woordgroepen

De actuele uitwerking staat in `KLINK-OEFENPAKKET-EN-VERGELIJKING-20261017.md` en `outputs/diglin-comparison-20261017/comparison.json`: 38 functies, 15 eigen onderdelen en expliciete lokale/live-afbakening. Prioriteit: gezamenlijk woordenoverzicht; woordbouw met slepen én aantikken als reeks én werkblad; woord-/beeldbingo; zoek de zin uit bestaande inhoud; overige vormen. Losse t blijft geparkeerd. Na opnieuw aanmelden zijn alle 16 ABC-menu's en 12 hoofddomeinen geïnventariseerd: lijst 1–13 elk 24 menukeuzen, lijst 14/15/16 respectievelijk 21/19/18. Alle 370 ABC-keuzen hebben een eigen functievergelijking. Dit is volledige menudekking, geen volledige interactie-, media- of inhoudscontrole en geen gelijkwaardigheidsclaim.

## Aanvulling 17 oktober: bredere inhoud en audio als aparte werkvoorraad

Nico heeft inhoud en aansluiting voorrang gegeven; nieuwe audio mag later. Dit is geen opdracht om scripts meteen te genereren of audioafhankelijke oefeningen zonder stimulus als voltooid te registreren.

Teruggevonden en gelezen op Drive:

- Analyse Diglin+ en advies voor Taalroute Woordstap (3 september): `1c72oaNC3C5DuCfZGeC8303FI0BPFt0Yqpeddt8kNT8A`. De twaalf categorieën en historische aantallen beschrijven de referentieomgeving van die inspectie, geen huidige Klink-dekking.
- Vaste productiespecificatie CP001–CP016: `1LVle7WSl3FwXJpk1kREnruTKAM6fayyykzUoT_-avic`. Elf woordvarianten, aanvullende klanktaken, contextzinnen, microteksten, dialogen, schrijven, formulieren en spelconfiguraties waren al voorzien. Een voorschrift is niet hetzelfde als een geproduceerd en aangesloten item.
- Productarchitectuur AlfaBetaPlus: `1Si4Uda_Y1vbgHsTgqsmvN3qGXvbb9kiD`.
- Verticale leerlijnmatrix per domein: `1JQjppc8ERh160Rg1bGw7mVRZg8bZEjVP`. Technisch en functioneel lezen/schrijven, auditieve vaardigheden, interactie, mondelinge productie, strategieën en attitudes zijn breder dan de huidige woordspeler.
- De eerdere P0-bouwopdracht van 18 september (`12-Hm4UgDUJ9b52vLGZngjedWaObBMUIz`) beperkte toen de implementatie tot zes componenten; spellen, formulieren en bredere lees-/schrijftaken vielen er expliciet buiten. Dit is historische context, geen nieuwe uitvoeringsinstructie. De latere Taalroute-indeling blijft leidend.
- Ontwerpbasis `1iXr55yHAoIVVtu_J6yZrcqkjKca3USrz`: materiaal koppelen aan boekdoel en docentlesplan; geen volledige cursus of praktijkvalidatie uit de technische aansluiting afleiden.

**Verklaring van de kloof:** de huidige generator sluit tien componentfamilies aan, niet alle achttien eerder beschreven families. De aangesloten 1.292 zinnen, 192 teksten en 128 gesprekken zijn overwegend luister-/meeleesinhoud. De aanwezigheid van tekst, een script of een ongebruikte renderer bewijst niet dat een zinsbouw-, schrijf-, bingo- of begripsopdracht werkt. De brede bronuitwerking is dus echt teruggevonden, maar niet integraal gerealiseerd. Een volledige afzonderlijke grammaticaroute of Junior-productlijn is in deze controle niet vastgesteld; niet stilzwijgend uit een referentiemenu overnemen.

### Wat deze wijziging toevoegt

In de bestaande **Docent → Oefenkaart → Volledige inhoudslijn** staan twaalf eigen inhoudsdomeinen met ontwerp, feitelijke aansluiting en open bouwstap. Bij **Docent → Media** staat een doorzoekbare audiomatrix met paginering, onderdeel- en statusfilter, afspelen van gekoppelde audio en JSON-export. De grote voorraad wordt uitsluitend op verzoek geladen. Er zijn geen cursistmenu's, woorden, leerstappen of oefeningen toegevoegd of verplaatst.

`npm run inventory:audio` bouwt de matrix uit huidige inhoud en de eerdere lokale broninventaris. Het script produceert geen opname en wijzigt geen broninhoud. De private bronverwijzingen blijven in `outputs/content-audio-register-20261017/source-map.json`, niet in de publiceerbare matrix. De generator verwacht de bestaande inventaris `outputs/content-inventory-20261017/inventory.json` uit het gecontroleerde bron-/herstelpakket.

- Huidige inhoud: 2.393 audio-ID's, waarvan 2.354 met aanwezig bestand; 38 ontbrekende klank-/uitspraakvoorbereidingen en één geparkeerde korte t. Een schrijfwijze-/klankvoorwaarde is niet altijd één afzonderlijke foneemopname. De uitspraakfunctie moet eerst vastliggen.
- De 22.898 voorbereide scriptverwijzingen zijn samengebracht tot 22.473 unieke combinaties van exacte NFC-tekst en stemrol. Daarvan hebben 391 een exacte tekst-/rolmatch met een bestaande gekoppelde opname; 216 alleen een archiefkandidaat; 21.866 geen gevonden opname. Deze voorraad is nog niet geplaatst in de huidige route en is geen bestellijst voor audiogeneratie.
- Actieve inhoud en voorraad overlappen; aantallen niet optellen als unieke opnamen of lessen. `Bestand gekoppeld` is technische beschikbaarheid, geen nieuwe uitspraakgoedkeuring. Exacte tekst alleen bewijst geen juiste stemrol of geschikte opname.
- Bestaande audio-ID's blijven behouden. Voorraad-ID's worden deterministisch uit stemrol en exacte tekst afgeleid, niet uit positie of lijstnummer. Een tekstcorrectie krijgt een andere ID. Herkomst en oorspronkelijke script-ID's blijven in het private register.
- `data/klink-audio-bindings.json` is leeg. De resolver kan een ontbrekende woordopname later op ID koppelen na exacte tekst-/rolcontrole, review, voice-ID en metadatavrijgave; hij vervangt nooit stilzwijgend bestaande audio. Voorraadscripts moeten eerst inhoudelijk geplaatst worden; de matrix alleen activeert geen oefening. Nieuwe audiobestanden vragen nog de werkelijke bestands-, metadata- en luistercontrole.

Geen nieuwe audio gemaakt. Geen publicatie. De eerdere vrijgavepoort voor de gemengde oefencombinaties blijft onveranderd open. Deze inventaris sluit geen boek-/lesplankoppeling, cursistbeoordeling of volledige methodepariteit af.

## Plaats en betekenis

De bestaande lokale app, **Docent → Oefenkaart → De route per leesstap**, bevat nu een vaste checklist met vijftien leerfuncties. Elke bestaande leesstap houdt zijn ID, woordbetekenissen, oefeningen en begeleide volgorde. Geen nieuwe app, learner-UI, woordselectie, media of publicatie.

- **Werkt:** de handeling is voor alle doelwoorden aangesloten in de begeleide route, met de daarvoor gecontroleerde mediavelden en gesproken instructie. Dit is beschikbaarheid, geen uitspraak-, beeld- of beheersingsgoedkeuring.
- **Gedeeltelijk:** wel onderdelen beschikbaar, maar onvoldoende dekking, alleen vrij oefenen, ontbrekende media of een nog onvolledig leerdoel.
- **Ontbreekt:** deze leerfunctie is niet aangesloten bij de geselecteerde leesstap.
- **Bewust anders:** een gemotiveerde ontwerpkeuze, bijvoorbeeld geen kunstmatige tweede antwoordkeuze bij één woord of geen verplichte tijdscore.

De checklist is berekend uit de huidige lesgegevens, niet als handmatig groen afvinklijstje. Per regel worden onderdeel-ID, leesstap-ID, doelwoord-ID’s, daadwerkelijk aangesloten oefen-ID’s en de dekking in de begeleide route bewaard. De oudere oefeninventaris blijft beschikbaar onder **Alle oefenvormen en ontbrekende inhoud**. Alle vergelijkingstekst blijft in dit interne document; op de apppagina staan uitsluitend eigen Taalroute-doelen.

## Functionele vergelijking — interne bouwreferentie

Referentie: de officiële uitgevershandleiding **Werken met DigLin+**, augustus 2017, https://www.nt2.nl/documenten/diglin/werken_met_diglin_.pdf, opnieuw geraadpleegd op 17 oktober 2026. Dit is geen controle van de actuele ingelogde productversie en geen volledige functiepariteit. De vergelijking gebruikt leerfuncties, niet dezelfde lijsten, vormgeving of materialen.

| Functie in de handleiding | Klink-checklist | Bouwconclusie uit de eigen code |
| --- | --- | --- |
| Woord, beeld en geluid; klank-tekenkoppeling (p. 4–5) | word-model, sound-letter | Woordroute aanwezig; beelddekking en los klankmateriaal onvolledig. |
| Auditieve synthese, woordherkenning en typen (p. 6–7) | sound-synthesis, word-recognition, word-production | Hele woorden herkennen/maken bestaat; echte klankensynthese niet. |
| Geautomatiseerde herkenning en herhaling (p. 7–8) | repetition, interaction | Vaste herhaling bestaat; geen verplichte tijdsdruk en geen claim van adaptieve beheersing. |
| Ondersteund en zelfstandig zinslezen (p. 9) | sentence-listening, sentence-reading | Luistermodellen zijn nog geen onafhankelijke lees- of begripsopdrachten. |
| Teksten, vragen en zinsopbouw (p. 11–15) | text-understanding, sentence-building | De overgang naar zelfstandig tekstbegrip moet inhoudelijk en technisch worden gebouwd. |

Spreken, dagelijks handelen en werktoepassing zijn tevens eigen Taalroute-doelen. De bron bewijst niet dat een andere app adaptieve herhaling of automatische uitspraakbeoordeling heeft; die eigenschappen worden haar hier niet toegeschreven.

## Wat eerst wordt uitgebreid

1. **De woordbasis behouden.** Media laten beoordelen; echte hiaten per stap zichtbaar houden. De geparkeerde losse t wordt niet alsnog gebruikt. Klankensynthese blijft een benoemd afzonderlijk hiaat.
2. **Een zin beluisteren én begrijpen.** Aan de al gekoppelde zinnen concrete betekenisvragen toevoegen. Antwoordmogelijkheden moeten bekend en inhoudelijk verdedigbaar zijn. Afspelen of op Klaar klikken is geen bewijs van begrip.
3. **Die zin zelfstandig lezen.** Alle woorden voorbereiden; dezelfde betekenis opnieuw aanbieden zonder de gehele zin vooraf voor te zeggen. Modelsteun en luisterhulp apart registreren. Een zin bij een foto kiezen mag niet oplosbaar zijn op één opvallend woord terwijl zinsbegrip het doel is.
4. **Zinnen maken en korte teksten begrijpen.** Bekende woorden in betekenisvolle volgorde gebruiken. Enkele samenhangende zinnen, vragen over wie/wat/volgorde en feedback terug naar het relevante tekstdeel. Meerdere natuurlijke formuleringen toestaan waar het doel dat vraagt.
5. **Dagelijks en werkgericht toepassen, later herhalen.** Een echte keuze/handeling in een volwassen context. Mondelinge toepassing kan al vroeg; zelfstandig lezen van nieuwe contexttaal krijgt eigen voorwaarden.

Bij elke leesstap staat **Van deze woorden naar zinnen en tekstbegrip**. Dit toont uitsluitend echt gekoppelde contextmodellen, de geschreven woorden die buiten de selectie van die stap vallen en dezelfde zes bouwfasen. Het overzicht zegt nadrukkelijk niet dat woorden binnen de stap al beheerst worden. Betekenis, vorm, klankvoorwaarden en zinsbouw vragen afzonderlijke beoordeling. Bij een stap zonder model wordt geen willekeurige zin geleend van een ander woord.

### Eerste concrete inhoudelijke aansluiting

Begin bij de bestaande pan-route (bouwgroep 2, `klink-leesstap-04`), niet met een nieuwe losse demonstratie-app. Daar zijn al een korte zin en de situatie over de vieze pan aan verbonden. De eerste nieuwe oplevering moet bevatten:

- een mondelinge begripsopdracht bij die bestaande inhoud;
- expliciete voorbereiding van de overige woorden, waaronder de functiewoorden;
- een apart leesdoel zonder voorafgespeelde volledige zin;
- een vraag bij het korte verhaaltje die echt informatie uit de tekst nodig heeft;
- doelgebonden feedback, tikbediening, herhaalbare steun en afzonderlijke registratie van hulp.

De huidige opname of het beeld mag niet stilzwijgend goedgekeurd worden. De eigenaar beoordeelt de concrete media zelf. Daarna deze aanpak over de bestaande leesstappen uitbreiden waar de leesvoorwaarden passen; niet verplicht dezelfde opdrachten bij elk woord. Dit document en de docentkaart leggen de bouwopdracht vast; de nieuwe begrips- en zinsbouwopdrachten zijn in deze wijziging nog niet geproduceerd.

## Omvang zonder schijnvergroting

Er zijn 10 bouwgroepen, 37 kernleesstappen, 3 vaste herhaalmomenten, 23 uitbreidingssets en 239 individuele woordroutes. Samen 302 selecteerbare routes, **niet 302 afzonderlijk geschreven lessen**. De 337 geschreven woordvormen / 338 betekenissen blijven ongewijzigd. Een grote hoeveelheid gegenereerde oefeninstanties bewijst geen volledige leerlijn of gelijkwaardigheid met een andere methode.

## Controle en overdracht

Gerichte data-/statuscontroles staan in `scripts/test-build-checklist.mjs`; browsercontrole is toegevoegd aan de bestaande lokale lesroute-reeks. Onder meer: geen groen bij ontbrekende media/steun/routebinding, geen woordkopie als zelfstandig herkennen, geen luistermodel als zelfstandig zinslezen, geen bronverandering door de checklist, alle bestaande routes bereikbaar en geen checklist op het cursistenscherm. Het bestaande exportbestand krijgt de checklist en zinnenbrug erbij zonder oude velden te verwijderen.

De aparte chat **Klink — UI en gebruiksgemak** werkt uitsluitend aan UI-review en voorstel. Zij wijzigt voorlopig geen gedeelde appbron en publiceert niet. De huidige taak wijzigt alleen de docentkaart en bijbehorende inventaris/tests. Geen automatische GitHub Actions-controles of publicatie; uitgebreide controles lopen lokaal. Media- en publicatievoorwaarden blijven afzonderlijke poorten.

### Uitgevoerde controle op 17 oktober 2026

- Alle 28 data-/contracttests geslaagd, inclusief de vier nieuwe checklisttests over alle 302 routes.
- De volledige lokale `test:review`-reeks geslaagd: bestaande speler, levenscyclus, foutherstel, lesuitbreiding, echte audio en automatisch doorgaan. Geen browserfouten in de rapporten.
- TypeScript, gerichte lintcontrole, diffcontrole en productiebuild geslaagd. Bestaande buildwaarschuwingen over grote bundels en deprecatie zijn niet in deze inhoudelijke wijziging opgelost; volledige repositorylint is niet opnieuw uitgevoerd.
- De docentkaart en de zinnenbrug visueel bekeken; bereikbaar op desktop en smalle schermen. Geen menselijke uitspraak-/beeldgoedkeuring, nieuwe cursisttest of volledige screenreadercontrole geclaimd.
- Geen workflows gevonden in de werkbranch of de opgehaalde `origin/main`; geen cloudtest of publicatie gestart.

Herstelbasis is broncommit `2ba3a5ea53fd5c20f964d03d2a6f02d9a26f1eaf`. De reeds geverifieerde volledige bronback-up in de bestaande Drive-projectmap heeft bestand-ID `1J__EyEl_pIA9MQ6AdzcXC5ZdkZ9XhOEo`. De aanvullende back-up van deze ronde bevat alle gewijzigde bronbestanden, een toepasbare commitpatch, de volledige bijgewerkte inventaris en lokaal testbewijs. De bestaande beelden, audio en hersteloriginelen worden niet onnodig gedupliceerd. Deze back-up is geen livepublicatie en geen publieke link in de app.
