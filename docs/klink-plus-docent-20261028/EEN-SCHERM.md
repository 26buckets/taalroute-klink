# Eén scherm — aanvulling 28 oktober 2026

Op verzoek van Nico staan foto en woord naast elkaar: foto links, woord rechts, met de bijbehorende bediening onder ieder deel. Dit geldt bij kijken, luisteren en de foto ter controle na het zelfstandige lezen. Onthullen/verbergen blijft docentgestuurd; de zelfstandige leesbeurt toont vooraf geen foto of audio.

De actieve les gebruikt op schermen vanaf 900 px breed en 650 px hoog de beschikbare schermhoogte onder de bestaande header. Titelbalk, acht faseknoppen, lesvlak, vijf hulpmiddelen en vorige/volgende blijven tegelijk bereikbaar. Geen pagina-inhoud wordt met overflow verborgen. Op mobiel en bij de apart geopende bestaande Klink-oefeningen blijft een natuurlijke scrollpagina beschikbaar. Voorbereiding, printopmaak en de reguliere cursistenomgeving behouden hun bestaande opzet.

Gecontroleerd: alle acht fasen met onthulde inhoud op 1280×720, 1366×768, 1024×768 en 1920×1080 (32 toestanden), zonder paginascroll of overlap met de hulpmiddelen. De aparte fotocontrole bij lezen is eveneens visueel gecontroleerd op 1280×720. De bestaande Chrome/WebKit-lesregressie is uitgebreid met laptopformaten en controleert foto-links/woord-rechts plus afwezigheid van verticale scroll in het kijkvenster. 159 lescontroles slagen; types, gerichte lint en productiebuild slagen. Fysieke bordhardware blijft niet getest.

De wijziging blijft op dezelfde concept-PR; geen livepublicatie. De code, testbewijs en actuele screenshots worden als aanvullende herstelback-up in dezelfde KPD-projectmap opgeslagen. Werkblad-PDF's en bestaande media zijn inhoudelijk ongewijzigd.
