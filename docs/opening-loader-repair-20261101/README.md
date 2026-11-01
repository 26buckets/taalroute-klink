# Kleine openingsloader met direct zichtbare beweging

Nico meldde dat op de Klink-website alleen het eerste animatiebeeld zichtbaar was, terwijl de app wel opende. Hij vroeg ook de loader kleiner te maken. De oorspronkelijke balletjesroute blijft de basis.

Onderzoek: de bestaande live SVG beweegt wel bij kunstmatig vertraagd laden in Chromium en WebKit. Bij normale snelle starts is de eerste loader slechts circa 336–380 ms aanwezig. De bestaande animatie heeft circa 400 ms stilstaande aanloop, waardoor juist dat eerste beeld zichtbaar kan zijn. Dit is geen vastgestelde fout in een Lottie-download; de live-app gebruikt een SVG-afbeelding. Langzaam laden en werkelijk vastlopen zijn niet hetzelfde probleem.

Herstel: uitsluitend de tijdstippen van de oorspronkelijke SVG zijn aangepast: geen stilstaande aanloop, een compacte afzet en dezelfde route/nastuiters in 1,8 seconden. Alle oorspronkelijke beeldlagen, lettervormen, kleuren en transformposities blijven identiek. Een nieuwe asset-URL voorkomt dat een oude versie uit de browsercache de reparatie verbergt. De oude SVG en het reduced-motion-beeld blijven ongewijzigd.

De afbeeldingsruimte wordt 158 px breed in plaats van 300 px; het zichtbare logo is ongeveer 140 px breed. Geen extra laadtekst, footer, knoppen, nepvoortgang of minimale wachttijd toegevoegd. Wanneer de app eerder klaar is, verdwijnt de loader direct; de hele animatie zien is dus niet gegarandeerd en wordt niet kunstmatig afgedwongen.

Gerichte controles bewijzen zichtbare beweging tussen twee vroege beelden, precies de kleine maat, eenmalig afspelen, stabiel eindbeeld, minder beweging, verwijdering zodra de app klaar is, bestaande routes en opgeslagen gegevens. Het bestaande schermbeeld wordt apart vergeleken op desktop/mobiel en licht/donker.

Publicatiebasis: daadwerkelijk aangeboden release.json en canonieke origin/main beide f7fb187b7901b824234d83478313dcafff7d69a4. Alle uitgebreide controles lokaal. Geen workflows toegevoegd of ingeschakeld. Geen fysieke telefoon getest.
