# Gratis audio-oplossing live — 8 november 2026

De normale publicatie is geslaagd vanaf de actuele livebasis. Bron: 99908642b4ec39b31fdeb68ce7c591271259e77e. De hoofdapp en de aparte statische audioroute zijn beide 100% actief. Inhoud, bestanden, audio-adressen, voortgangscode, toetsenbordbediening en vormgeving zijn behouden.

De hoofdapp gebruikt nu 4.562 van 20.000 bestandsplaatsen: 15.438 vrij. De audio gebruikt afzonderlijk 13.831 plaatsen: 6.169 vrij. Alle 18.393 aangeboden bestanden zijn online volledig teruggelezen en bytegelijk gecontroleerd. De lokale bestandswaarschuwing telt voortaan per onderdeel.

## Behoudcontrole

- Alle 302 lessen en inhoudskenmerken behouden; geen wijzigingen aan appcode, inhoud, media, opslag of vormgevingsreferenties ten opzichte van de actuele basis.
- 543 oude oefenlink-/API-controles over 113 bundels, 25 audio-HTTP-controles en 39 uitgesloten/onbekende adressen geslaagd.
- 13.759 losse opnamen en 6.293 segmenten in 72 bundels op bestaande merkmetadata gecontroleerd; door bytegelijke livecontrole zijn die metadata behouden. Native WAV gebruikt zijn bestaande RIFF-velden; de opnamen zijn niet aangepast of gehercodeerd.
- Chromium en WebKit: acht echte-audioproeven, zes native audio-decoderingen, 22 mobiele/keyboardopstellingen, zes opslagproeven, twee oude-naar-nieuwe-codeproeven met werkelijk opgeslagen tekst en vier echte handschrift-/IndexedDB-herlaadproeven geslaagd.
- 40 schermparen: 38 meteen exact. Twee luisterschermen werden op een verschillend afspeelmoment vastgelegd. De gerichte vergelijking in dezelfde audiostaat is exact; de laatste mobiele diagnose vergelijkt oude basis A/B en live, allebei 0 pixels verschil, met dezelfde geometrie, tekst en berekende opmaak. Een tussentijdse herhaling had 41 zeer kleine randpixels. Geen referentie aangepast.

## Eenmalig herladen

Een tabblad dat nog de vorige build in het geheugen heeft, kan bij het openen van een oefening één keer herladen nodig hebben. De proef zonder herladen liep daarop vast. Getypte antwoorden zijn gecontroleerd bij de overstap van de oude code naar echte nieuwe livebytes op dezelfde origin. Handschrift is rechtstreeks op live getekend, opgeslagen, herladen en opnieuw opgeslagen: alle punten, eerste antwoord en historie bleven exact behouden. Dit is geen garantie bij wissen van browsergegevens of gebruik van een ander apparaat.

## Kosten en terugval

Er is geen R2, betaalde dienst, extra audio-proxy, migratie, abonnement of budgetverhoging geactiveerd. Cloudflare vermeldt gratis/onbeperkte statische aanvragen en geen extra opslagkosten voor Static Assets. De nieuwe audio bevat uitsluitend statische bestanden; het bestaande app-/databasegebruik is niet uitgebreid. GitHub heeft geen workflows of Actions-uitvoeringen voor deze publicatie. Zware controles zijn lokaal gedaan.

Dit bewijst de gratis inrichting van deze audio-oplossing, niet een volledige accountfactuur van €0. De websitezone staat op Free; de accountabonnementen/facturen en volledige betaalblokkade zijn met de huidige toegang niet uitleesbaar (403, ook na vernieuwde aanmelding). Er is niets aan die instellingen gewijzigd. Voor onafhankelijke bevestiging van het gehele account zijn leesbare abonnements-, factuur/verbruiks- en budgetgegevens nodig.

De eerste omschakeling is veilig teruggenomen: negen eerste aanvragen kwamen nog via de oude route; 13.822 bestanden waren exact. De hoofdapp bleef intact en de nieuwe audio-worker werd verwijderd. Daarna is een begrensde stabiliteitscontrole toegevoegd en lokaal getest; de uiteindelijke volledige publicatiecontrole slaagde. De bestaande Cloudflare-aanmelding is eenmalig vernieuwd. Geen productie-uitval geforceerd.

Geen nieuwe snelheidsmeting, fysieke telefoon/stylus of menselijke luisterronde. De bestaande Alfa C-klikoverlap is niet gewijzigd. Alle ruwe resultaten, scripts, screenshots en bron-/herstelgegevens zitten in de gecontroleerde Drive-herstelkopie; het ontvangstbewijs staat naast dit verslag.
