# Drie leerroutes bij mat — inhoud vóór interface

**Latere correctie:** de verplichte voorbereiding, voorkennisbevestiging en voorafgaande routekeuze hieronder zijn vervallen. Zie [DIRECT-LESOPENEN.md](DIRECT-LESOPENEN.md). De inhoud wordt nu gezamenlijk doorlopen in drie zichtbare bordstappen; stap 3 bouwt het bericht uit zeven woordkaartjes.


Nico heeft op 28 oktober 2026 expliciet opdracht gegeven de naam als **Klink+Docent** samen te voegen en Alfa A, B en C inhoudelijk te onderscheiden. Dit vervangt voor deze les de eerdere gelijkstelling van de drie steunvarianten aan het volledige aanbod. De acht fasen en projectieveilige privévoorbereiding blijven behouden. Dit is geen vrijgave voor livepublicatie.

De uitgewerkte docentinhoud staat in `data/klink-docent-routes.json`; Alfa A blijft verbonden aan de bestaande acht fasen in `lib/teacher-classroom.ts` en KPD 02. Iedere route heeft een doel, voorbeeld, gecontroleerde bronverwijzingen, voorkennis, materiaal, boekdoelkoppeling en vervolg. B en C hebben ieder acht eigen faseplannen met docenthandeling, verwachte reactie, hulp, feedback, observatie, actieve tijd en verwijzing naar het bestaande eigen lesbezoekkader. De docent verbindt het losse onderdeel aan een werkelijk ingeroosterde bijeenkomst; pauze en thuis oefenen worden niet in actieve minuten verstopt.

## Inhoudelijke besluiten

| Route | Doel en zichtbaar verschil | Technische/inhoudelijke grens |
|---|---|---|
| Alfa A | Betekenis van mat, m-a-t, bouwen, zelfstandige woordleesbeurt en mondeling gebruik | Bestaande leesstap 01; nazeggen/nabouwen niet als zelfstandig lezen beoordelen |
| Alfa B | De mat ligt bij de deur. Woordherkenning, zinsdelen, zes woordkaartjes, lezen zonder foto, plaatsbegrip en papierverwerking | Bekende woorden en zinsvorm vooraf controleren; geen automatische vervolgroute na mat |
| Alfa C | De mat is nat. Leg hem buiten. Situatie en opdracht onderscheiden, hem verbinden met mat, handelen en een korte begrijpelijke terugmelding schrijven | Boodschap/taakuitvoering en schrijven afzonderlijk bespreken; geen automatische schrijfscore |

Voordoen, Samen doen en Zelfstandig zijn een tweede, onafhankelijke keuze. Geen van deze instellingen verandert het gekozen leerdoel of maakt van één route een ander alfaniveau. Tijdens de les wisselt de neutrale knop Andere hulp alleen de ondersteuning. Routekeuze en labels zijn uitsluitend privé beschikbaar.

## Brontoets en voorkennis

Het [Raamwerk Alfabetisering NT2](https://cito.nl/media/t4lphd2r/cito_ve_raamwerk_alfabetisering.pdf) is daadwerkelijk gedownload en gelezen. Relevante gedrukte pagina's: 2–3 voor de niveaubeschrijving, 5–8 voor technisch lezen en 22–24 voor functioneel schrijven. Het onderscheid betreft onder meer woordverwerking, zelfstandigheid, leesvloeiendheid en functioneel handelen. Ook Alfa A kan voorbereide korte zinnen lezen; een zin op zichzelf is dus geen niveaubewijs. B/C zijn hier doelgerichte lesroutes, geen gevalideerde toets of volledige niveauafdekking. De nieuwe taken zijn oorspronkelijke lesuitwerkingen, geen overgenomen Cito-opgaven.

De canonieke Klink-bron bevat mat (leesstap 01), de (leesstap 36), bij (optioneel na stap 29), deur (optioneel na stap 23) en is (optioneel na stap 08). Voor ligt, nat, leg, hem en buiten is geen afzonderlijk woordlemma gevonden. Er worden geen fictieve IDs of reeds-beheerste status gemaakt. Deze woorden staan als nieuwe contextwoorden in de les; de docent moet betekenis en woordherkenning vooraf voorbereiden/controleren. De bronbeschikbaarheid van de overige woorden bewijst evenmin individuele beheersing.

B/C starten pas nadat de docent de zichtbare voorkennis heeft bevestigd. Bij ontbreken: woorden apart voorbereiden of een passende andere route kiezen; geen onbekende woorden als afleider. De zin en het bericht hebben geen gekoppelde opname. De docent kan ze mondeling aanbieden; bestaande mat-audio en losse klanken worden nooit als zin-/berichtaudio vermomd.

## Beeld, papier en vervolg

De bestaande foto toont een mat bij de deur. Voor het bericht wordt de natte mat als denkbeeldige situatie mondeling ingeleid; de foto bewijst niet dat de mat nat is. Er worden geen nieuwe afbeeldingen gegenereerd. De cursistenbladen houden een neutrale titel en krijgen per route een werkelijk andere taak. Docentobservaties onderscheiden betekenis, leeshandeling, hulp, toepassing en schrijven. Geen leerlingnamen of centrale dossiers; een op het bord getypte reactie blijft alleen in het geheugen en wordt niet in browseropslag geschreven.

De echte bestaande Klink-oefeningen worden uitsluitend aangeboden als herhaling van het woord mat. Er wordt niet beweerd dat zij de nieuwe zins- of berichtdoelen afdekken. De B/C-lesplannen bevatten een eigen herhaalopdracht en een voorstel voor een volgende bijeenkomst.

Inhoudelijke zelfreview: leerdoelen, voorbeeldantwoorden, begrijpelijkheid, modelafhankelijkheid, privacy en bronstatus nagegaan. Onafhankelijke tegenreview, menselijke uitspraak-/mediareview en echte klasproef blijven open. De docentbevestiging van voorkennis is een voorbereidingshandeling, geen automatische beoordeling van de cursist.

## Implementatie en lokale verificatie

`teacher-classroom.tsx` gebruikt dezelfde veilige voorbereiding/lesgrens voor alle routes. `teacher-route-stage.tsx` verzorgt de B/C-opdrachten en de bijbehorende werkbladen/kaartjes. Ondersteuning wisselen behoudt de route; hulpmiddelen behouden het gelegde werk. Een getypte terugmelding blijft alleen in het werkgeheugen: herladen wist die reactie. De route en kaartvolgorde kunnen veilig uit sessieopslag worden hersteld. Beschadigde of onbevestigde B/C-status opent geen les.

Zes logica-/hersteltests, 222 routecontroles (Chrome en WebKit), 159 bestaande lescontroles, 33 aanvullende scherm-/herstelcontroles, acht randgevallen en menu-/logocontroles zijn lokaal geslaagd. Productiebouw, typecontrole en lintcontrole slagen. Negen PDF's zijn A4, ieder één pagina, met werkelijk verschillende opdrachten en visueel gecontroleerde afdrukken. De matfoto is in de uiteindelijke werkbladen effectief circa 369 ppi; bron en beeld ongewijzigd, geen Krea. Zie ACCEPTATIE.md voor de volledige actuele beoordeling en open praktijkcontroles.
