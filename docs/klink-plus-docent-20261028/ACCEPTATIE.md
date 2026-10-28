# Acceptatie en herstel — 28 oktober 2026

Eigen implementatiereview en lokale controles; geen onafhankelijke review of menselijke pilot. De exacte commit wordt bij de overdracht in `delivery.json` vastgelegd. Bewijs: `browser-checks.json`, `edge-checks.json`, `pdf-checks.json`, screenshots en logbestanden in dezelfde overdracht.

| Eis | Status en bewijs/grens |
|---|---|
| P0-01 identiteit | GETEST: bestaande header, D-logo, docentmenu en tokens; screenshots desktop/mobiel |
| P0-02 één scherm | GETEST: alle fasen/varianten in één browservenster; geen fysiek gedupliceerd digibord getest |
| P0-03 privacy | GETEST: publieke DOM/tekst, tools, varianten, reload, terug, routes, gordijn, opslagfouten; print uitsluitend privé |
| P0-04 curriculum | GETEST: canonieke woord-, les-, media- en oefenrefs in unitchecks |
| P0-05 betekenis | GETEST: beeld zonder woord en afzonderlijke onthulling |
| P0-06 helewoordaudio | GETEST: echte native playback en foutpad; menselijke review blijft open |
| P0-07 fonemen | GETEST: drie onafhankelijke resolvers; daadwerkelijke opnamen OPEN |
| P0-08 ontbrekend geluid | GETEST: drie X's; alleen a ontbreekt terwijl m/t functioneren |
| P0-09 herstel audio | GETEST: manifest wijzigen en retry zonder componentcode; fixture geen inhoudelijke klankreview |
| P0-10 tegels | GETEST: echte touch-events, klik/toetsenbord, verkeerde volgorde, hint, lokale reset en statusbehoud |
| P0-11 zelfstandig lezen | GETEST: geen foto of autoplay vóór de leesbeurt; eigen onthulling |
| P0-12 afleiders | GETEST: lege contrastset, geen verzonnen meerkeuze |
| P0-13 toepassen | GEBOUWD/BRONGEREVIEWD: mondelinge transfer, geen verplichte zinsdecodering; pilot open |
| P0-14 papier | GETEST: drie onderscheiden neutrale bladen plus docentkaart/letters, vijf A4-PDF's zonder afsnijding |
| P0-15 herhaling | GETEST: bestaande drie mat-oefeningen werkelijk geopend, bestaande speler gebruikt |
| P0-16 tools | GETEST: vijf tools, fase/onthulling/tegels en schrijfbord blijven bij terugkeer behouden |
| P0-17 H5P vrij | GETEST: geen dependency/import/runtime of nieuw pakket; lockfile ongewijzigd |
| P0-18 publicatie | GEBORGD: branch en concept-PR; geen deploy; bestaande poort blokkeert nieuwe scope |
| P0-19 regressie | GETEST: bestaande menu-/curriculum-/Alfa-C-/logocontroles, types en build |
| P0-20 lesinhoud | BRONGEREVIEWD: 18 traceerbare bronitems, acht fasen; F5.3 terecht uit, tweede foto bronconform open |
| P1-01 toegankelijkheid | GETEST: toetsenbord, Escape/focusterugkeer, 52px-knoppen; geen volledige screenreader-audit |
| P1-02 aanraken | GETEST: browser-touch, muis en toetsenbord; echte bordhardware open |
| P1-03 schermen | GETEST: 390×844, 768×1024, 1920×1080 en 1280×960; geen horizontale overflow |
| P1-04 leesrichting | GETEST: drie vaste slots links naar rechts, afzonderlijk aanwijsbare letters |
| P1-05 timing | GETEST: native playback en stoppen bij fase/tool; geen automatische leesaudio |
| P1-06 foto/tekst | GETEST: afzonderlijke knoppen voor beeld en schrift |
| P1-07 terugkeer | GETEST: overlay/dialogue, Escape/focus, tegel-/onthul-/tekenstatus |
| P1-08 printer | GETEST: vijf A4-PDF's gerenderd, visueel/geometrisch en grijswaarden gecontroleerd; fysieke afdruk open |
| P1-09 observaties | GETEST: alleen private voorbereiding/print, geen centrale leerlingopslag |
| P1-10 eenvoud | GEBOUWD: vaste vorige/volgende/onthul/resetacties; beginnende-docentenpilot open |
| P1-11 media | DEELS: bron en open review traceerbaar; beeldresolutie goed; rechten/menselijke mediareview open |
| P1-12 state | GETEST: reload, terug, corrupte JSON/objecten, geblokkeerde opslag en netwerkfout |
| P1-13 zoom | GETEST: CSS-zoom 100/125/150%; echte browserzoom en bord open |
| P1-14 overdracht | GEBOUWD: bronkaart, startinstructies, data, tests, screenshots, PR en Drive-herstelpakket |

## Gevonden en hersteld

1. Globale SVG-regels maakten het schrijfbord te laag. Expliciete tekenhoogte toegevoegd; tekenen en behoud na toolswitch opnieuw gecontroleerd.
2. Eerste papierexport nam een schermachtergrond/letterspatiëring over. Printregels geïsoleerd, witte pagina en neutrale metadatatitel; alle vijf pagina's opnieuw bekeken.
3. Bestaande menutest kende het nieuwe docentitem nog niet. Alleen die verwachting aangepast; bestaande menucontroles slagen.
4. Beschadigde objectstatus zonder `active` kon als inactief worden gelezen. Alleen expliciet `false` wordt als inactief beschouwd; unitcheck en browserroutecontrole toegevoegd.
5. Na touch-slepen kon een achtergebleven klikonderdrukking de eerste toetsenbordaanslag overslaan. Pointerklikken en toetsenbord onderscheiden; echte touch gevolgd door Enter opnieuw getest.
6. Een vooraf geopend headermenu kon bij programmatische routewisseling openblijven. Lesmodus sluit bestaande details; normale headerbediening blijft intact.
7. Oplossing tonen vulde aanvankelijk alleen het woordvoorbeeld. De drie vakken tonen nu eveneens m-a-t, terwijl het eigen werk bewaard blijft tot de oplossing weer wordt verborgen.

Niet als productfout verhuld: de bestaande publicatie-whitelist accepteert de nieuwe feature nog niet. Die beveiliging wordt in deze opdracht niet aangepast. Onafhankelijke tegenreview en praktijkvalidatie zijn open, ook als de lokale tests slagen.

## Aanvulling: drie routes en compact woordmerk — 28 oktober 2026

- Naam: officieel ongewijzigd Klink D-vectorlogo + compacte bewerkbare tekst +Docent; menu en schermnaam gelijk.
- Lesinhoud: Alfa A woord/klanken, B zin/plaatsbegrip/woordkaartjes, C praktisch bericht/verwijzing/handeling/korte reactie. Doel, boekkoppeling, voorkennis en eigen faseplannen in data/klink-docent-routes.json. Geen niveauclaim op basis van één mat-les.
- Voorkennis: echte curriculumverwijzingen; ontbrekende woorden niet als bestaande leesstap gepresenteerd. B/C vragen een docentbevestiging vóór de start.
- Projectie: route en ondersteuning alleen in voorbereiding; opdrachten veranderen werkelijk. Op 1280×720 en 1024×768 zonder scrollen; mobiel behoudt leesbaarheid met verticale scrolling.
- Papier: negen A4-pagina's, één werkblad, kaartvel en observatieblad per route, alle visueel bekeken. Alleen docentobservaties dragen alfalabels. Originele foto 800×800, effectief circa 369 ppi in de werkbladen, geen Krea-bewerking; geen personen of handen in dit beeld.
- Lokale controle: zes gerichte logica-/hersteltests, 222 routecontroles in Chrome en WebKit, 159 bestaande lescontroles, 33 extra scherm-/herstelcontroles, acht randgevallen en bestaande menu-/logocontroles geslaagd. Productiebouw, typecontrole en gerichte lintcontrole geslaagd. Geen GitHub Actions uitgevoerd.
- Open: onafhankelijke didactische tegenreview, echte klasproef, fysiek bord en printer. Losse klankopnamen ontbreken; geen nieuwe zin-/berichtaudio gemaakt. Docent spreekt waar nodig zelf voor. Geen livepublicatie.

## Actuele correctie — direct openen en drie gezamenlijke stappen

De eerdere voorbereidingspoort en voorkennisbevestiging zijn expliciet vervallen. Zie DIRECT-LESOPENEN.md. Starten vereist uitsluitend Les openen; daarna samen Woord, Zin en Bericht, inclusief bouwen in alle drie. Docentinformatie en werkbladen zijn onafhankelijk van de bordles. Zes volledige gebruikersreizen op drie schermmaten/twee browsers, 222 routecontroles, 159 bestaande lescontroles, acht randgevallen, zes logica-/hersteltests, menu, types, lint en bouw geslaagd. Nieuwe les wist bordnotities. Bij herladen wordt alleen de actuele stap hersteld. Geen praktijkreview of livepublicatie.
