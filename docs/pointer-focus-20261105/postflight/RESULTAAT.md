Klink — klikranden gepubliceerd — 5 november 2026

Live: https://klink.taalroute.nl
Bron: 8f310654410c683c772ce889b2164441b8a2a8c0 (schone canonieke main)
Worker: fd9181b8-18bf-4d5b-a690-227f9f180968
Publicatie: 5 november 2026, 11:20 Nederlandse tijd, via npm run deploy.

Vóór publicatie zijn de werkelijke livebron 487be7bb68af6d883b479d00096a79d12ac42791 en canonieke GitHub-basis be7c4b36546bc0d5ce5fed38d1bdeebfdee985ff bevestigd. Deze versie is hun afstammeling. Het exacte publicatieverzoek, de gerichte vrijgavepoort en geverifieerde bronback-up staan in ../publication. Alle publicatiebeveiligingen bleven actief.

Uitsluitend twee CSS-bestanden veranderen het appgedrag: geen standaardrand rond automatisch gefocuste titels, geen ongewenste focusrand na aanwijzerbediening, en oefenkeuzekaarten tonen hun focusrand alleen bij toetsenbordbediening. Focus zelf, toetsenbordmarkering, selecties en foutmeldingen blijven behouden. Geen wijziging aan inhoud, audio, opslagcode, routes, database of overige vormgeving. Het oorspronkelijke uiterlijkreferentiepunt is behouden; het specifieke eigenaarsakkoord is brongebonden vastgelegd.

Controles
- Types, lint en 49 curriculumproeven geslaagd. Nieuwe focusvrijgave: 12 negatieve mutaties afgewezen; bestaande opslagvrijgave: 12; leesvrijgave: 8.
- De gewone volledige publicatiepoort en verse productieopbouw binnen npm run deploy zijn geslaagd. De ongewijzigde bron-/mediacontroles uit de eerdere herstelpublicatie blijven van toepassing; geen overgeslagen poort of aangepaste limiet.
- Live 8 browser-/schermmaat-/kleurstandproeven voor automatische focus, klikken, Tab, native audio en volgende oefening; tekst en geometrie gelijk aan de gecontroleerde kandidaat. Daarnaast 4 oefenkeuzekaartproeven met echte toetsenbord- en muisbediening. Chromium en WebKit, mobiel en desktop.
- Live 6 opslag- en 12 schrijfproeven, inclusief herladen, oude antwoorden, concepten, geblokkeerde opslag en gelijktijdige tabbladen; geen fouten.
- Live 8.134 mediabestanden exact teruggelezen. 401 bestaande woordopnamekoppelingen (395 unieke bestanden) gecontroleerd op bytes, ingebedde Taalroute-metadata en volledige decode; geen nieuwe audio.
- Twee nieuwe en twee behouden oefenbanken exact teruggelezen; zes eerder ingetrokken dicteebanken blijven 404.
- Acht voor/na-schermparen van de werkelijke oude en nieuwe liveversie: gelijke tekst/geometrie. Zeven paren hebben buiten de toegestane titelrand geen verschillen boven twee kleureenheden. Chromium desktop/donkere browserstand heeft negen rasterpixels aan de bestaande afgeronde rechterrand van Start (x205–206, y88–135; maximaal 33 kleureenheden). De knopbron en zijn stijlen zijn ongewijzigd; visueel bekeken. Deze kleine rasterafwijking is expliciet geregistreerd, geen volledige pixelgelijkheidsclaim. De oorspronkelijke strikte mislukte vergelijking en de aanvullende volledige diagnostiek blijven bewaard.
- Release.json exact gelijk aan de gepubliceerde productiebron; Wrangler bevestigt 100% verkeer op bovenstaande Worker. 21 geüploade + 19.979 behouden assets = 20.000. Worker gzip 6.136,75 KiB.

Geen GitHub Actions-workflows aanwezig of toegevoegd; controles lokaal. Geen budgetwijziging.

Herstel: de geverifieerde bronback-up is Drive 1WKPSSi6q5nFHfPAKmt28H3Cz9syq7HYO. Die bevat de exacte nieuwe bron en de eerdere focuskandidaat. De volledige vorige bron-/mediaherstelback-up blijft Drive 1m7vee3Fe_Zp6J6OIIZ8X0oeQHXW4TblK. Het definitieve aanvullende pakket bevat de gepubliceerde Git-bron, alle nieuwe bewijsstukken, schermafbeeldingen en de bronback-up; de ontvangstcontrole staat in backup.json.

Beperkingen: echte browserengines op gesimuleerde schermmaten, geen fysieke telefoonproef of nieuwe menselijke luisterronde. Bestaande audio is bytegelijk behouden. De bewijsopvolger op main bevat alleen documentatie en wordt niet opnieuw gepubliceerd.
