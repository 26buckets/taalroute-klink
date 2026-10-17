# Klink — vaste bouwchecklist en vervolglijn

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
