# Woordbetekenissen en niveaukoppelingen — 31 oktober 2026

Status: lokale inhoudelijke herstelversie, NIET gepubliceerd. De huidige opdracht bevat geen nieuwe publicatieopdracht. Geen push en geen GitHub Actions gestart.

Basis: 7f465f53dc13176e98217231ccfb900b84f879ca, documentatie-afstammeling van de goedgekeurde livecommit 54e9d39b57f9190523e6903f1e0fad24eda484b3. Aparte reviewbranch; main niet gewijzigd.

## Uitkomst

- 5.848 actieve woord-betekeniscombinaties redactioneel gelezen: 5.649 uit de leesreeksen plus 199 extra woordbouwomschrijvingen. De betekenissen in de curriculumwoorden overlappen met deze inventaris.
- Daarnaast 42 oude CP-bronnotities bekeken. Die zijn geen nieuw ingevoerde leerlinginhoud. De voorstellen in fixes.json onder legacyPackageProposalsNotApplied zijn bewust niet toegepast.
- 111 betekenisomschrijvingen hersteld op 1.113 plaatsen, waaronder 409 unieke oefeningen. 242 inhoudsbestanden gewijzigd. Alleen betekenisvelden en gekoppelde altText-omschrijvingen aangepast.
- 4 beoordelingsgroepen / 22 woordvormen staan in decisions.json. Geen individuele ERK-niveaus gecertificeerd en geen onzekere herindeling doorgevoerd. De bestaande docentsteun en de eerdere 28 B1-verdiepingswoorden behouden.
- Antwoorden bleven intact: de controle vond geen extra concrete antwoordfout. Geen nieuwe audio geproduceerd. Menselijke luisterreview en praktijktoetsing blijven open.

## Bereik en bewijs

inventory.json, extra-lexicon.json en supplementary-inventory.json bewaren de gelezen bronnen. fixes.json bevat exact voor/na en reden. changes.json legt alle gewijzigde velden en bestandshashes vast. Oude gehashte openbare bestanden zijn behouden; nieuwe URL's verwijzen voor voortgang naar dezelfde oorspronkelijke sleutels. Antwoordmodellen, oefen-ID's, volgorde, aantallen en rondes zijn gelijk gebleven.

verification.json bewijst behoud buiten meaning/altText en controleert 137 betrokken bestaande audiobestanden met ffprobe. report-audio-check.json bewaart de ingebedde Taalroute-merkvelden van de zes afspeelbare twijfelgevallen in het verslag. Niets is beluisterd of opnieuw opgenomen. Bestaande synoniemen, langere teksten en dialogen zijn in deze ronde niet opnieuw volledig redactioneel beoordeeld.

production-check.json: 1.462 collecties, 59.532 oefenplaatsen en 5.913 mediaverwijzingen. answer-level-audit.json: niveau- en antwoordcontrole, inclusief letterbouw, sorteerregels en audio-bronlabels. Geen bevindingen. Deze bronlabelcontrole bewijst niet wat een opname werkelijk zegt.

unit-tests.log: 16 lokale tests geslaagd. production-browser-check.json en browser-test.log: alle 16 productiewerkvormen bediend plus 65 bestaande beeldkoppelingen geladen. targeted-browser-check.json: gewijzigde hints zichtbaar, verkeerde antwoorden afgewezen, juiste antwoorden geaccepteerd; verslag zoeken, mobiel en audiobestandsgegevens gecontroleerd.

De bestaande exporttest is bijgewerkt om alleen de exact vastgelegde meaning-correcties toe te staan; alle overige velden worden nog steeds met de oorspronkelijke export vergeleken. Geen originele externe export overschreven.

## Herstel en vervolg

Gebruik fixes.json en changes.json als brongebonden wijzigingsregister. prepare-fixes.py en apply-fixes.py documenteren de reproductie vanaf de vastgelegde basis; apply-fixes.py weigert een andere commit of reeds gewijzigde runtimebron. Dit zijn eenmalige herstelscripts, geen app-runtime.

Voor een eventuele latere publicatie: eerst de dan actuele livebasis opnieuw vaststellen, de gerichte wijzigingen overnemen op een afstammeling daarvan, publicatiecontracten en noodzakelijke tests opnieuw beoordelen. Geen oude geïsoleerde checkout rechtstreeks publiceren. Alle oorspronkelijke woorden, bronnen en bestaande media blijven behouden.
