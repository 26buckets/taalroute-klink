# Klink — verdere UI-uitwerking, 9 november 2026

Lokale kandidaat. Niet gepubliceerd en niet gepusht. Deze ronde vervolgt de eerdere verbeteringen in `docs/ui-quality-20261109/`; die blijven onderdeel van de kandidaat.

## Uitgewerkt

- De gedeelde labels Luister, Foto en Tekst zijn vergroot van 12 naar 16 pixels. De luisterknop is waar nodig iets breder; raakvlakken, focus, audio en bewaargedrag blijven werken.
- De hulpbalk van de tekstspelers gebruikt vanaf 370 pixels een compacte rij met afzonderlijke labels voor Tekst horen, Uitleg horen, Voorbeeld en Help. Op smallere schermen blijven twee rijen beschikbaar. De oefeninhoud krijgt meer verticale ruimte.
- Grijze toelichtingen hebben sterker contrast. De zichtbare toetsenbordfocus in het cursistgedeelte is beter te onderscheiden op de lichte oefenruimte. Muis- en aanraakbediening krijgen geen nieuwe focusrand.
- Toegankelijke knopnamen sluiten aan bij de zichtbare teksten. Woordkaarten ontlenen hun naam aan hun inhoud; Bewaar/Bewaard blijft in de toegankelijke naam staan. De aanklikbare oefenkop bevat ook de titel in zijn naam.
- Echte veldgroepen vervangen niet-ondersteunde labels op gewone containers. De stappenteller wordt begrijpelijk voorgelezen. Lange oefenkoppen blijven binnen de beschikbare breedte.
- Lege herhaalsets worden niet meer aangeboden door verouderde totaalaantallen. De kaart toont het aantal oefeningen dat werkelijk aan de beurt is; de opgeslagen planning en voortgang worden niet gewijzigd. Een nieuwe regressieproef toont de fout vóór het herstel en de correcte lege, actuele en toekomstige selectie erna.
- Een praktisch testpakket met acht opdrachten, observatieformulier en acht afzonderlijke beoordelingsonderwerpen is gereed: `praktijktest.html`, `observaties.csv`, `beoordeling.csv`.

## Behoud

De bron is een opvolger van lokale kandidaat `00397f891e47feee73019a216c491b142fad4efb`, die afstamt van canonieke main `0e72bf0ead44306e77b85dd06ae4856e663ad755`. De livebron is opnieuw gelezen en staat in `live-basis.json`; dit is geen publicatie.

Alle 20.182 gecontroleerde inhouds- en mediabestanden zijn bytegelijk aan de basis, waaronder 13.891 audiobestanden. De uitsluiting van het menubalkscript betreft de al gedocumenteerde eerdere labelwijziging. Er zijn geen nieuwe audio-opnamen, opslagformaten, routes, diensten of afhankelijkheden toegevoegd. De bestaande bron-/mediaback-ups blijven noodzakelijk voor volledig herstel.

De twaalf hoofdcategorieën, niveaus, klankenkaart, verborgen B2-ruimte, bestaande startopzet, logo's en de opzet van Klink+docent blijven behouden. De oorspronkelijke uiterlijkreferenties, publicatiebeveiliging en workflows zijn niet veranderd. De afzonderlijke DigiBord-stijlmap was niet beschikbaar; de bestaande Klink-stijl is gebruikt.

De gratis bestandscontrole blijft actief: 8.587 app-assets en 13.831 audio-assets. Geen cloudtestrun, push, betaalde dienst of publicatie uitgevoerd. Dit betreft de gebruikte middelen; er is geen volledige accountfactuur beoordeeld.

## Controle en afbakening

De feitelijke uitkomsten en logverwijzingen staan in `checks.json`. De schermbeelden en uitvoer staan in `outputs/ui-refinement-20261109/` en in het gecontroleerde herstelpakket.

De aanvullende axe-controle gebruikt tijdelijk gedownloade axe-core 4.14.0 buiten de projectafhankelijkheden. Reproduceren: pak die versie uit buiten de repository en geef het pad naar `axe.min.js` mee met `KLINK_AXE_PATH`; voer de lokale runner uit met `KLINK_AUDIT_PHASE=after`. De hash van het gebruikte bestand staat in de uitvoer. De steekproef omvat zeventien schermen op vier breedtes. Dit is geen volledige WCAG-certificering.

De proef op 640 × 450 controleert de beschikbare layoutruimte die hoort bij een desktopvenster van 1280 × 900 op 200% browserzoom. Er is geen fysieke browserzoom- of schermlezerproef mee bewezen. Werkelijke vergroting, schermtoetsenbord, voorleessoftware, projectieafstand en telefoons staan daarom expliciet in het praktijkprotocol.

De contrastmeldingen die automatische beoordeling openlaat door het decoratieve watermerk zijn afzonderlijk beoordeeld met de werkelijke kleuren en een conservatieve berekening met een zwart watermerk op dezelfde dekking. Dit verandert geen afbeelding of inhoud. Het contrastbewijs staat bij de uitvoer.

## De stap naar 9,5

Er is geen verzonnen eindscore of menselijke testuitslag ingevuld. Het doel geldt afzonderlijk voor hiërarchie, navigatie, leesbaarheid, knoppen/audio, mobiel, consistentie, toegankelijkheid en feedback/herstel. Technische controles onderbouwen de werking; het praktijkprotocol moet aantonen waar echte gebruikers nog twijfelen of hulp nodig hebben.

Voer de eerste kwalitatieve ronde uit met cursisten op verschillende niveaus en docenten. Leg resultaten vast per taak en versie. Herstel blokkerende en terugkerende ernstige problemen, test die opnieuw en beoordeel ieder onderdeel afzonderlijk. Een gemiddelde van 9,5 verbergt geen zwakker onderdeel. Zonder die praktijkwaarnemingen blijft de eindscore open.

## Publicatie en herstel

Werkbranch: `codex/ui-refinement-20261109`. De kandidaat is uitsluitend lokaal beoordeeld. Voor publicatie zijn een afzonderlijke opdracht, een nieuwe vergelijking met de actuele livebasis en de normale volledige publicatieroute nodig. De historische referenties en poorten zijn niet aangepast om tests kunstmatig te laten slagen.

Het herstelpakket bevat de gewijzigde bronnen vanaf main, Git-bundel, toepasbare patch, controle-uitvoer, werkelijke schermvoorbeelden en het praktijkpakket. De upload en teruggelezen bestanden worden afzonderlijk gecontroleerd in de bestaande Drive-projectmap. Oude media blijven via de bestaande back-upketen beschikbaar.
