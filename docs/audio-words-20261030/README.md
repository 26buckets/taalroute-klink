# Hoor en kies en Geluid en woord — 30 oktober 2026

Lokaal ingebouwd op basis van a3826557ca3af7c4935c0fd2969d9f8bbb2a8096. Geen publicatie of push uitgevoerd. De actuele werkkopie voor deze uitbreiding is `work/klink-checked` in de chatmap van 30 oktober; de eerdere `work/klink-audio` is een tussentijdse werkkopie en geen overdrachtsbron.

## Inhoud

48 bestaande, complete praktische bronlijsten met elk twaalf woordplaatsen: Alfa C 16, A1 12, A2 8 en B1 12. Iedere lijst krijgt twaalf Hoor-en-kies-opdrachten en vier koppelborden van drie woorden voor Geluid en woord. Samen 96 reeksen en 768 opdrachten.

De selectie volgt de bestaande HMM-bronnen en behoudt bron-ID, betekenis, woordvorm, audio en niveau. A1-brugwoorden en de overige A2/B1-spellingbanken zijn niet opgenomen. De zestien eerdere voorstellen in deze chat blijven een voorstel; deze ingebouwde selectie gebruikt de reeds beschikbare, niveaugebonden bronlijsten. `lists.json` bevat de daadwerkelijk ingebouwde woorden.

Alfa C oefent woordbeeldherkenning met herhaalbare audio. A1 gebruikt dagelijkse basiscontexten, A2 praktische afspraken en voorzieningen, B1 preciezere maatschappelijke en werkcontexten. Bekende woorden komen bewust terug in andere contexten. De opdrachtvorm is klank-woordherkenning, geen bewijs van zelfstandig lezen, betekenisbeheersing of een behaald ERK-niveau.

De lijsten staan onder Woorden oefenen bij Zelf oefenen en het eigen niveau. Hoor en kies is ook via Luisteren bereikbaar. De bediening, schermstructuur, bestaande reeksen en opslag zijn ongewijzigd. De nieuwe bestanden laden pas na selectie. De bestaande collectie-ID's en inhouds-URL's zijn bytegetrouw behouden in de index.

## Audio en afleiders

373 bestaande bestanden hergebruikt, inclusief één passende, al toegestane instructie van Roland. Geen nieuwe audio of beelden. Alle bestanden zijn gedecodeerd, bytegelijk vergeleken met een verse kopie van de basiscommit en gecontroleerd op Taalroute-merkvelden. De historische menselijke luisterreview blijft open; technische controle is geen volledige menselijke uitspraakreview.

Hoor en kies gebruikt vier verschillende geschreven opties uit dezelfde bronlijst, met de bestaande voorkeur voor overeenkomst in spelling. Geluid en woord koppelt drie verschillende opnamen aan drie woorden. Bronwoord, doel, opties en alle antwoordkoppelingen zijn voor de hele selectie gecontroleerd. Er zijn geen dubbele woordvormen binnen een lijst of keuzebord en geen fotoafleiders toegevoegd.

## Controlebewijs

- `content-check.json`: volledige productie-index, bron- en mediaverwijzingen.
- `unit-check.txt`: hoofdstukken, groepsopdrachten, navigatie en voortgang.
- `browser-check.json`: alle 96 nieuwe reeksen geopend; beide vormen op alle vier niveaus in Chromium en WebKit, op desktop, tablet en mobiel; complete rondes, foutantwoord, luisteren, toetsenbord, herladen en afgeronde kaarten. Interactieaudio is gemockt; echte bestanden zijn daarnaast in beide browsers gedecodeerd.
- `menu-check.txt` en `menu/`: bestaande gedeelde menuopzet, alle niveaus, geschiedenis en oude links.
- `audio-check.json`: werkelijke bestandshashes, duur en ingebedde metadata.
- TypeScript, productiebuild, gerichte lintcontrole en diffcontrole slagen. De generator levert bij herhaling dezelfde inhoud op.

Geen fysieke apparaatproef, screenreaderluisterproef, cursistenpilot of nieuwe menselijke luisterronde geclaimd. De exacte koppeling aan een ingeplande boekles blijft docentgebonden; deze aanvulling maakt geen nieuw cursusprogramma.

## Herstellen en verder werken

Gebruik de canonieke repository `26buckets/taalroute-klink`, bovenstaande basiscommit en de overlay uit het overdrachtspakket. De overlay bevat gewijzigde bronnen, nieuwe inhoud, controles en de werkelijk hergebruikte audio. `scripts/build-audio-word-practice.mjs` bouwt de bestanden opnieuw uit de bestaande bronbanken; `scripts/test-audio-word-practice.mjs` controleert niveauplaatsing, antwoorden en behoud van de oude index.

Publicatie is apart: controleer dan opnieuw de actuele livebasis en volg PUBLICATIE.md en de bestaande vrijgavepoort. Geen beveiliging, historische audiopauze of inhoudsgrens gewijzigd. Geen GitHub Actions gestart.
