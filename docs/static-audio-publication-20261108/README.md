Gratis statische audio — publicatievoorbereiding 8 november 2026

Op expliciet publicatieverzoek van Nico. Actuele livebasis 693b58c1 en canonieke main 98568bd3 opnieuw bevestigd. Geen inhoud, audio, routes voor de gebruiker, opslagcode of vormgeving gewijzigd.

Normale route blijft npm run deploy: historische brongebonden poorten, build, nieuwe native statische audioroute, volledige bytecontrole, dan pas hoofdapp zonder dubbele audio. App: 4.562; audio: 13.831 assets. Geen R2, proxy-worker, run_worker_first, migratie, workflow of betaalde upgrade. De bestandswaarschuwing telt afzonderlijk; boven 20.000 per deel blijft publicatie geblokkeerd.

Terugval: bij mislukte audiastap uitsluitend de nieuw aangemaakte audio-worker verwijderen, terwijl de volledige oude app actief blijft. Bij mislukte appstap terug naar de vastgelegde vorige Worker-versie; de al gecontroleerde audioroute blijft dan beschikbaar. Voor latere volledige terugkeer eerst de volledige app met audio herstellen, controleren, daarna pas de audioroute verwijderen. Volgorde met foutinjecties lokaal getest; geen productie-uitval geforceerd.

Alle 13.759 losse opnamen en 6.293 segmenten in 72 bundels onderzocht. Native WAV RIFF-velden worden volgens hun formaat beoordeeld: artiest/auteursrecht Taalroute en passend album; MP3/M4A hebben ook albumartiest en uitgever/label. Geen audiobytes veranderd. Door volledige SHA-256-controle na upload wordt ook behoud van deze metadata gecontroleerd.

Accountabonnement kan met de beschikbare rechten niet worden gelezen (403). Static Assets opslag en aanvragen zijn volgens Cloudflare gratis; geen productactivatie of budgetwijziging. Websitezone staat op Free. Dit is geen verklaring over eventuele bestaande andere accountkosten.

Eerder volledig lokaal gecontroleerd op actuele basis: docs/static-audio-local-20261108/. Nieuwe publicatieconfiguratie, foutafhandeling, limiettelling, lint en typen opnieuw gecontroleerd. Geen fysieke telefoon of nieuwe menselijke luisterronde; bestaande Alfa C klikoverlap blijft behouden. Livebewijs volgt na publicatie.

Eerste echte omschakeling: negen eerste aanvragen bereikten nog de oude route; 13.822 audiobestanden waren exact. De normale route stopte en verwijderde de nieuwe audio-worker succesvol. De hoofdapp bleef op 693b58c1. De routecontrole wacht voortaan begrensd op twee opeenvolgende positieve controles, ook bij het omschakelen van de appversie; onstabiele of onverwachte versies blijven blokkeren. Lokaal getest met vertraagde, onderbroken en blijvend oude publicatie.
