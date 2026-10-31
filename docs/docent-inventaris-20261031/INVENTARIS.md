# Klink+docent — inventaris en menunaam, 31 oktober 2026

## Gevonden inhoud
Acht unieke lessen: mat, tas, map, man, pan, jas, pen, pet.
KPD 06 beschrijft mat/tas/map; KPD 07 de vijf volgende lessen. De zeven lesdossiers naast mat bevatten ieder drie rondes van acht fasen (Woord, Zin, Tekst). Dit zijn inhoudelijke lesdossiers, geen zeven al aangesloten lesmotoren.
KPD 08 werkt dezelfde acht lessen uit tot 24 dubbelzijdige werkbladen, 48 cursistpagina's en 240 opdrachten met antwoorden. Vandaag is de actuele hoofd-JSON v0.4.3 opnieuw uit Drive gelezen: 240 unieke opdracht-ID's, precies 30 per les. Versies en werkbladuitgaven niet als nieuwe lessen tellen. De eigen projectregistratie vermeldt nog inhoudelijke beoordeling, onafhankelijke review en integratie als open.

De actuele code koppelt alleen mat aan Klink+docent. De bestaande app bevat daarnaast veel cursistenlessen en begeleide Alfa C-opdrachten; die zijn niet geteld als deze acht klassikale lespakketten.

## Bronnen
- Projectmap: https://drive.google.com/drive/folders/1BonW2_yUQW8TAu_mWB1RVfM8iaxq9C7O
- KPD 06: https://docs.google.com/document/d/1dNUs3iUiPKbC5LeOW59jSF_cFFJA_kfgjuNE8qdpnFY/edit
- KPD 07: https://docs.google.com/document/d/1A-2HInstpb05C1F8UR3yAdDYA_I0e7IJys2W3pRljJ4/edit
- Actuele KPD 08-index: https://docs.google.com/document/d/1GP1BY3qKYELwBwZtqFL32g_LN-EO0qEabc9ZIUV0pw0/edit
- Getelde hoofdgegevens: https://drive.google.com/file/d/120Hde8UqeHXILAX_UsWi6L_OMhljeV-V/view
- Bestaande chats geraadpleegd: Start Klink-productiestroom; Verken Klink-appstructuur. Geen berichten verzonden of nieuwe productietaken gestart.

## Appwijziging
De bestaande menuoptie naar /#teacher/plus heet nu consequent Klink+docent, met een echte plus en kleine d. De docentnavigatie en kop gebruiken dezelfde naam. Het compacte officiële woordmerk was al goed en is ongewijzigd. Geen extra menuoptie naast de bestaande link; geen inhoud of lesvrijgave toegevoegd.

Deze wijziging staat op een afzonderlijke branch vanaf de actuele main. Geen publicatie of push uitgevoerd; een andere chat werkt aan de huidige publicatie. De oude checkout van 29 oktober is bewust niet als basis gebruikt.

## Controle
Vier volledige menu-naar-bordcontroles: Chromium/WebKit, 1366/390 px, rechtstreeks Les openen, herladen en alle drie rondes aanwezig. Geen browserfouten. Mobiele menuweergave visueel gecontroleerd. TypeScript en diffcontrole geslaagd. Gerichte lint meldt twee reeds bestaande priority-verouderingsmeldingen in de header; dezelfde meldingen in de ongewijzigde bron bevestigd. Geen nieuwe lintmelding door deze tekstwijziging. Compacte React-review: geen veranderde hooks, toestand, bereikbaarheid of inhoud; bestaande naam en navigatie hergebruikt.

Geen nieuwe didactische review, drukcontrole, fysieke telefoontest of integratie van de overige zeven lessen uitgevoerd. Dit dossier inventariseert de bestaande productie en corrigeert alleen de naam in de app.
