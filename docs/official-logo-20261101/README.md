# Officieel Klink-logo — 1 november 2026

Nico heeft het petrolgroene logo met groene stip en vloeiende laatste k officieel vastgesteld en vervanging in Klink en Studio expliciet voor publicatie goedgekeurd. De exacte opdracht, herkomst en controlesommen staan in approval.json. Dit vervangt uitsluitend de logokeuze D van 24 oktober 2026.

## Canonieke bron

master/klink-master.svg bevat het volledige woordmerk met natuurlijke slogan als echte vectorpaden. De headerbestanden bevatten hetzelfde woordmerk zonder slogan. Kleuren: letters #0F3B44, stip #3C8962; donker: witte letters met dezelfde groene stip. Het zijn gecontroleerde vectorreconstructies van de door Nico bevestigde PNG, geen teruggevonden oorspronkelijke vectorbron. Alle toekomstige toepassingen gebruiken deze paden; niet opnieuw traceren of een ander lettertype gebruiken.

## Afgebakende toepassing

De bestaande kaderafmetingen, logoposities, interfaces, andere kleuren, foto's, uitsneden, routes, functies, inhoud, audio en lokale gegevens blijven behouden. Klink gebruikt daarnaast het bijbehorende K-favicon en de bijgewerkte deelafbeelding. De oude deelafbeelding blijft intact onder haar oude pad; uitsluitend Klinks verwijzingen gebruiken het nieuwe pad. Studio behoudt de oorspronkelijke foto byte voor byte en dezelfde twaalf appkaarten.

## Controle en herstel

local/checks.json vergelijkt vóór/na in Chromium en WebKit, desktop en mobiel, licht en donker. Posities, maten, tekst, typografie en kleuren worden exact vergeleken; de screenshotvergelijking buiten de werkelijke logovlakken accepteert maximaal 8/255 per kleurkanaal voor rasterafronding. Alleen het logo mag zichtbaar verschillen. Dit is geen bewering dat iedere pixel identiek is of dat elk fysiek apparaat getest is.

image-qa.json beschrijft de beperkte beeldwijziging. previous/public bevat de oude logobestanden als herstelbron. De bestaande historische vormgevingsvloer blijft bewaard; de nieuwe goedkeuring staat afzonderlijk geregistreerd. De bestaande publicatiepoort blijft actief en controleert ook de eerdere inhouds- en audiovrijgaven.

Na publicatie staan de werkelijk gepubliceerde broncommit en livecontroles in publication.json en live/. GitHub Actions krijgt geen zware controles; alle uitgebreide tests worden lokaal uitgevoerd.

De historische beeldcontrole van 31 oktober controleert haar oorspronkelijke uitgave tot de vastgestelde opvolgcommit b368996ce81590ddfa0afee1d5d488e415c9f58c. Latere logo-aanpassingen worden door de nieuwe vrijgavepoort met een exacte bestandslijst en SHA-256-controles bewaakt. De oude beelden en alle overige actuele bestanden blijven beschermd.

De eerste volledige publicatiecontrole doorliep de inhoudscontroles en stopte volgens de gewone beveiliging omdat de wijziging nog niet gecommit was. Na vastlegging wordt dezelfde normale publicatieroute opnieuw uitgevoerd.

Uitgevoerde eindcontroles: 15 gerichte vrijgave-/beveiligingstests en de volledige normale publicatiepoort zijn geslaagd. De brede historische negatieve reeks is niet volledig herhaald; zie check-scope.json. De echte Worker is na publicatie gecontroleerd met bron- en inhoudshashes, alle gewijzigde assets, oorspronkelijke media/audio-steekproeven, navigatie en opgeslagen voortgang.

Bij live-schermvergelijkingen zijn hoogstens tien rasterrandpixels buiten de logo’s toegestaan boven de kleurkanaaltolerantie van 8/255. Werkelijke aantallen/coördinaten staan per proef in live/checks.json; opmaakmaten, tekst en stijlen worden exact vergeleken. Geen claim dat alle schermpixels identiek zijn of dat fysieke toestellen getest zijn.
