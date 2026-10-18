# Zes eigen Klink-spelers — lokale implementatie, 18 oktober 2026

Vervolguitbreiding: zie `KLINK-STANDAARDSPELERS-INTEGRATIE-20261018.md`. Onderstaande aantallen beschrijven de eerste, beperktere aansluiting.

Geen push of publicatie. De livebron blijft `bd21413c5673cab5758e454e656a6e89fd35a430`; de ontwikkelbranch is `codex/six-klink-players-20261018`. Aan het begin was de werkmap schoon en was de livecommit een voorouder van HEAD. `outputs/standard-players-20261018/baseline.json` bewaart de teruggelezen liveversie.

## Spelerregister

| Speler | Bouwstatus | Aangesloten inhoud | Beoordeling en grens |
|---|---|---|---|
| Sorteren | Nieuw | Drie sorteerborden met mat, tas, jas, man, map, pan: beginletter m, eindletter s, persoon/voorwerp. Zes instanties door hergebruik in twee bestaande pakketten. Eén voor één of op één blad. | Betekenis/letter/spelling; geen a/aa-contrast en geen klankbeheersingsclaim. Klankvariant technisch aanwezig, maar niet aangeboden zonder passende bestaande goedgekeurde opnamen. |
| Woorden aanwijzen | Bestaande `text-evidence` uitgebreid | Exacte woord-/woordgroepselectie bij 90 bestaande teksten, 379 route-instanties. Bij 66 andere teksten blijft de bestaande bewijszinselectie behouden. Samen blijven het 156 unieke bronteksten en 657 instanties. | Alleen een letterlijke antwoordspan in de oorspronkelijke bewijszin. Geen gegenereerde bewijsplaats of stilzwijgend nieuwe begripsvraag. |
| Aanvullen | Bestaande `verb-choice` uitgebreid | 28 bestaande ik-zinnen, 48 route-instanties. Zelf typen zonder volledig model; de gegeven werkwoordnaam maakt duidelijk welke vorm wordt gevraagd. Optioneel kiezen en voorbeeld. | Afgebakende werkwoordaanvulling, geen volledige grammaticale of semantische leerlijn. Toegestane antwoorden staan in de content. Keuze-/modelhulp wordt geregistreerd. |
| Volgorde | Bestaande `ALF-CMP-013` uitgebreid | Drie bronnen: De taxi, Het boek, Een boek lenen; 18 route-instanties. Tekstregels en gespreksbeurten, geen extra woordbouwspeler. | Bronvolgorde expliciet gevraagd. Alternatieve volgordes en beeldtegels technisch ondersteund en met fixtures gecontroleerd. Een nieuwe beeldverhaalreeks is niet gemaakt. |
| Situatiebeeld aanwijzen | Nieuw | Eén opdracht bij bestaand `situatie-map`: Wijs de map aan. Drie genummerde plekken en een lijstalternatief. | De map wordt in het bestaande tafelbeeld herkend. Geen willekeurige foto, geen nieuw beeld of automatisch vrijgegeven beeldbank. |
| Vertakte praktijk | Nieuw | Eén situatie bij `klink-dialogue-c3ecb2965e20ece2`, zeven route-instanties. Kofi vraagt Daan om een plaats op de bank. Twee of drie beslismomenten, verschillende gevolgen, teruggaan. | Alle keuzes zijn oefenroutes. Afronden is deelname, nooit automatische spreekbeheersing. Nieuwe reacties/gevolgen zijn conceptannotaties; menselijke review blijft open. |

Alle zes zijn aangesloten via `groupExercises`, de bestaande hoofdstukken en oefenfasen. Er is geen nieuwe app, cursistenroute of H5P-afhankelijkheid. De technische fixtures zijn uitsluitend onderdeel van lokale tests. De bestaande `missing`-speler blijft voor letteraanvulling behouden.

## Klikroutes

Lokaal in dezelfde Klink-app, via de bestaande hoofdingangen:

- Woorden oefenen → Sorteer de woorden → tas · map.
- Teksten → Zoek het antwoord → bron kiezen.
- Grammatica → Kies het werkwoord → bron kiezen; de opdracht zelf heet Vul het werkwoord in.
- Teksten → Zet de stappen op volgorde → bron kiezen.
- In de praktijk → Wijs aan in de situatie → tas · map.
- In de praktijk → Wat doe je nu? → tas · map.

Binnen het eerste woordpakket staat sorteren onder de bestaande oefentab. Contextvormen staan onder Gebruiken; kies passend aanbod met de docent. `player-register.json` bevat de exacte bestaande hashlinks. De apart door Nico gevraagde verduidelijking van menukoppen is werk uit de andere chat en blijft behouden.

## Geschiktheid, audio en voortgang

De nieuwe opdrachten zijn docentondersteunde conceptcombinaties. Het woordniveau van de zes startwoorden geeft geen automatische leesvrijgave voor instructies, een tekst, een gesprek of een situatie. Voor een echte Alfa A-inzet moeten opdrachtbetekenis en bediening mondeling worden voorbereid; er is geen nieuwe instructie-audio gemaakt. Een bronlabel A1 is evenmin bewijs van zelfstandig lezen.

Bestaande opnamen blijven ongewijzigd op tempo 0,85. De bestaande tekstluisterknop en het gesproken invulvoorbeeld blijven bereikbaar en worden als hulp geregistreerd. Geen ElevenLabs, nieuwe opnamen, ontbrekende audiokoppelingen of ingetrokken uitleg geactiveerd. `media-needs.json` bewaart stabiele IDs voor de gepauzeerde instructies en vertakkingsspraak. Het bestaande tafelbeeld is als beschikbaar geregistreerd; geen ontbrekend beeld wordt met een willekeurig plaatje gevuld.

Antwoorden lopen via het bestaande `PracticeAttempt`-contract: antwoord, correctheid, pogingen, hulp, responstijd, doel en deelname/antwoord blijven onderscheiden. De nieuwe spelers kennen geen zelfstandig lezen of herhaalbeheersing toe. Teruggaan in een vertakking maakt de afronding weer onvoltooid en telt als steun. Zelfcheck en een knop Klaar worden geen beheersingsbewijs. Bestaande opslagkeys en lokale voortgang blijven behouden. Een afgeronde reeks betekent geoefend.

## Ontwerpbasis en docentkoppelingen

De vaste bron op Drive (`1iXr55yHAoIVVtu_J6yZrcqkjKca3USrz`) en de canonieke lokale kopie zijn gelezen. Bestaande bron-, oefening- en les-IDs blijven traceerbaar; `lesson-links.json` koppelt de nieuwe spelers aan `teacherPracticePlan`. De bestaande observatiereferenties en docenthandelingen zijn overgenomen, niet nieuw bedacht.

Het bestaande docentblok bevat betekenis/start, één handeling voordoen, zelf proberen met gerichte hulp, gebruiken met een ander en terughalen. De daarin genoemde 2/3/5/3/2 minuten zijn voorgestelde actieve oefentijd, geen nieuwe of dubbel getelde cursusuren. De docent moet de gekozen bron nog verbinden aan de werkelijk ingeroosterde bijeenkomst, het boekdoel en beschikbare tijd. Er is geen nieuw cursusprogramma en geen fictief boekpaginanummer of lesbezoekresultaat toegevoegd.

De offline tekst-/begripinventaris is geraadpleegd. Die bevat nieuwe conceptannotaties; deze zijn niet automatisch als vrijgegeven inhoud geïmporteerd. Deze implementatie gebruikt de bestaande bronvragen en drie gericht geselecteerde volgordebronnen. Een menselijke taal-/didactiekreview, daadwerkelijke lesplanning en cursistenpilot blijven open.

## Beeldreview: situatie-map

Bron: `public/package-media/cp001/aa-cp001-scene-table-on.webp`, 760 × 760 pixels. De bestaande canonieke context heeft `humanReview: approved`. Het bestand is ongewijzigd; nieuw zijn uitsluitend de interactieve aanwijsplekken.

Volledige visuele ronde op het oorspronkelijke beeld: boek links, beker boven het midden, blauwe ringmap rechts, pen op de tafel. Alle voorwerpen rusten op de tafel; geen zwevende ondersteuning of camera-aanbiedend personage. Er zijn geen personen, handen, vingers, polsen of handgrepen door mensen zichtbaar. De volledige handenronde heeft dus nul zichtbare handen; handdetailuitsneden zijn niet van toepassing. Er is geen generatieve reparatie uitgevoerd.

Drie genormaliseerde rechthoeken zijn visueel tegen deze objecten gecontroleerd. De speler gebruikt hun middelpunten op het ongecroppte beeld; de markeerknoppen blijven minstens 48 × 48 px. De lijst benoemt plekken, niet het juiste voorwerp, zodat het antwoord uit het beeld moet komen. Volledig beeld en werkelijk geplaatste weergave zijn op desktop, tablet en mobiel gecontroleerd. Een laadfout blokkeert antwoorden. Dit is een digitale appweergave, geen drukbestand; geen Krea-claim.

De afgesproken DigiBord-stijlbestanden waren op het opgegeven pad niet aanwezig. De bestaande Klink-typografie, Lucide-iconen en knoppen zijn behouden; geen nieuwe indeling is op die ontbrekende referentie gebaseerd.

## Technische controle en open punten

De nieuwe reeks is opgenomen in de bestaande lokale `posttest:review` en afzonderlijk uitvoerbaar met `npm run test:standard-players`. Geen cloudworkflow toegevoegd.

De lokale controlegegevens staan in `outputs/standard-players-20261018/`. `standard-unit.log`, `browser-checks.json` en `variant-checks.json` onderscheiden echte appbediening van synthetische testinhoud. Tests controleren fout/correct, stabiele keuzes, toegestane alternatieven, toetsenbord, echte tikken, sleepalternatief, focus, hulp, opnieuw proberen, afronden, herstel van voortgang en doelen van minstens 48 px op desktop/tablet/mobiel. De technische toegankelijkheidscontrole vervangt geen menselijke screenreader- of cursistenpilot.

`preservation.json` controleert ongewijzigde leerinhoud, mediabestanden, audiobeleid, afspeeltempo en opslagbron. De afzonderlijke menulabelwijziging in de docentenhandleiding is expliciet buiten de inhoudsinvariant gehouden. Er zijn geen GitHub Actions aangemaakt of uitgevoerd. Geen push en geen publicatie. De bestaande publicatiepoort en akkoordregisters zijn niet versoepeld.

De volledige lokale behoudreeks wordt bijgehouden in de regressielogs en het definitieve testoverzicht. Eerdere mislukte runs zijn niet als geslaagd gepresenteerd: één ontwikkelrun werd onderbroken door HMR; de vaste bouwversie bracht een verouderde verwachting voor ingetrokken instructie-audio aan het licht. Die test controleert nu dat aangeboden audio bytegelijk blijft en dat ingetrokken instructies/hulp nooit spelen. Een tweede behoudcontrole vond doelwoorden buiten een gekozen pakket bij de nieuwe contextspelers; de doelwoorden worden nu op het huidige pakket begrensd, terwijl alle overige bronwoorden in de leesvoorwaarden blijven. Een gerichte invarianttest bewaakt dit.

Nog open voor inhoudelijke vrijgave: menselijke beoordeling van nieuwe sorteer-/span-/regio-/vertakkingsannotaties, de koppeling aan een echte bijeenkomst, cursistenpilot en eventuele toekomstige hervatting van audioproductie. De spelerbouw heft deze grenzen niet op.

## Afgeronde technische eindstand

97 unittests en de volledige lokale behoudreeks zijn geslaagd, plus 13 nieuwe browsercontrolegroepen. De runs zijn na de beschreven herstelpunten hervat; er wordt geen ononderbroken geslaagde eerdere run geclaimd. De laatste bouw, TypeScript en gerichte codecontrole slagen. `test-summary.json` verwijst naar de logketen. De definitieve bronhashes zijn na de tests opnieuw gecontroleerd.
