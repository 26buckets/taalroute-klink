# Time-outs — lokaal gecontroleerde reparatie, niet gepubliceerd

Nico heeft op 6 november 2026 onderzoek en lokaal herstel gevraagd, met behoud van inhoud, audio, voortgang, links, toetsenbordbediening en uiterlijk. Geen toestemming voor publicatie. De basis is canonieke main f9299b107610c25975fcd2cfb164c0981928385d, een bewijsopvolger van livebron db57924f60e8d632eed0d1b75c9b48a7491da709. De wijziging staat uitsluitend op de lokale branch codex/concurrent-request-repair-20261106.

## Bevinding en begrenzing

De vorige livecontrole legde vastlopende aanvragen naar bestaande /api/grammar-aa-assets/-bestanden vast, terwijl gewone statische bestanden wel antwoordden. Het serverlog toonde annulering zonder foutmelding. De nieuwe korte meting met zes gelijktijdige controles gaf lokaal 24/24 en live 24/24 antwoorden: het verschijnsel is niet permanent.

In de geïnstalleerde serverbibliotheek vinext 1.1.0 is lokaal een concreet vastlooppad aangetoond: als de tracing-integratie asynchroon faalt voordat zij de aanvraagcallback aanroept, wordt die fout weggeslikt en blijft de antwoordbelofte onafgehandeld. De bestaande bestandsfunctie zelf gaf onmiddellijk de juiste bytes terug. Deze fout is bewust geïnjecteerd. **Dat dit precies de aanleiding van de eerdere live-time-outs was, is niet bewezen.** Zie reproduce-tracing-stall.mjs, tracing-stall.json en framework-source.json. Er is geen fictieve livebevestiging geregistreerd.

## Gerichte reparatie

worker.ts handelt uitsluitend de bestaande openbare bestanden met canonieke hashadressen en de geregistreerde oude oefenlinks af vóór de algemene appafhandeling. De bestaande GET/HEAD-functie en practiceBundleResponse blijven ongewijzigd in gebruik: geen kopie van bereik-, ETag- of foutlogica. De eerdere middleware voor oefenlinks vervalt omdat dezelfde afhandeling nu eerder plaatsvindt. Alle overige aanvragen gaan met hetzelfde Request-object, dezelfde bindings en dezelfde uitvoeringscontext naar de oorspronkelijke apphandler. Andere methoden op de API blijven via die handler lopen. De initialisatiefunctie van de app blijft behouden.

Geen wijzigingen aan app/componenten, CSS, inhoudsregisters, bronbestanden, audio, opslag, databases, links, afhankelijkheden of logo. Geen extra assets: 18.393, met 1.607 plaatsen over. De gewone Vite/Cloudflare-configuratie gebruikt de nieuwe entry; npm run deploy en de publicatiebeveiliging zijn niet omzeild of gewijzigd.

## Lokale controles

- Acht gerichte tests, waaronder alle 81 API-bestanden en alle 1.720 oude oefenlinks terwijl de algemene apphandler expres vastzit; behoud van exacte bytes, HEAD, ETags, bereikvragen, fout/herstel, annulering en doorgeven van overige aanvragen.
- 4.312 aanvragen op 24 gelijktijdige verbindingen, 48 afgebroken aanvragen en 24 vervolgaanvragen: geen fouten, geen time-outs. Deze belastingtest weigert een liveadres.
- 20.149 bestaande en gebundelde bestanden bytegelijk; oude URL's en HEAD/304/405/404 gecontroleerd.
- Alle 1.809 oefenblokken en 154 ingangen geopend; 226 bundelopeningen, twee fout/herstelgevallen en vier echte oude-clientgevallen.
- 268 toetsenbordstappen en 52 bladopdrachten met echte audio, parallel in Chromium/WebKit op desktop/mobiel; op de definitieve build herhaald en geslaagd.
- 32 pixelgelijke schermparen tegen de huidige gepubliceerde code, inclusief Klink+docent, desktop/mobiel en licht/donker. Een aparte pre-bundling client controleert oude bestandslinks; dit is niet de referentie voor het huidige uiterlijk.
- Zes opslag-, twaalf schrijf-, 48 venster- en acht Help-controles; 49 curriculumtests; typecontrole, lint, build en Cloudflare dry-run geslaagd.

De eerste browserstarts begonnen voordat de lokale server gereed was. Een tweede compatibiliteitspoging gebruikte ten onrechte de huidige, reeds gebundelde client als oude client. Beide testopstellingen zijn gecorrigeerd, zonder productwijziging of afgezwakte controles; de eerste logs zijn in het herstelpakket bewaard. De browserproef legt nu de huidige vergelijkingsbasis en de afzonderlijke oude client vast. De resterende bestandslimietwaarschuwing is terecht en blijft actief.

## Status en vervolg

Niet gepusht en niet gepubliceerd. De bestaande publicatiepoort wijst de ongepubliceerde wijziging terecht af; die blokkade is als positieve veiligheidscontrole vastgelegd. Een toekomstige expliciete publicatieopdracht vereist opnieuw de actuele live/main-vergelijking, opname van worker.ts in de brongebonden publicatiecontrole, de normale route en gerichte livecontroles. Geen rechtstreekse wrangler-uitrol buiten npm run deploy en geen beveiligingen omzeilen.

De livewerking van deze reparatie is nog niet bevestigd, omdat publicatie niet is toegestaan. Een fysiek telefoontoetsenbord en een schermlezer zijn niet getest. Alle ongewijzigde audio blijft behouden; technische audiocontrole is geen nieuwe menselijke luisterreview.

verification.json bevat bron- en bewijshashes. backup.json verwijst naar de volledig teruggelezen Drive-herstelkopie, inclusief schermbeelden, ruwe metingen en herstelbron. De vorige volledige publicatieherstelkopie blijft de ongewijzigde basis; deze lokale reparatie wordt als afzonderlijk pakket toegevoegd.
