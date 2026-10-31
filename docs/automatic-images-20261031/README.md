# Automatisch compacte KLINK-beelden

Nieuwe rasterbeelden in `public` worden vóór de gewone publicatie automatisch voorbereid (`predeploy`). De bestaande gedeelde beeldkoppeling krijgt een compacte WebP-versie wanneer dat nodig is. Foto's maximaal 640 pixels, hero-foto's 960 en handschrift 1280; geen uitsnede, geen vergroting, originele bestanden blijven behouden. Kleine bestanden worden niet groter gemaakt. Kwaliteit 70, zo nodig 60/55, nooit onbeperkt verder verlaagd. Maximaal 96 KiB (98.304 bytes) per appbeeld.

`npm run images:prepare` mag ook direct na de beeldimport worden uitgevoerd. Het resultaat is gewone broninhoud: neem koppelingen, registratie en compacte bestanden mee in dezelfde controle en commit als de nieuwe beelden. De bestaande publicatiepoort blijft een schone, gecontroleerde bron vereisen. De automatische voorbereiding verleent geen inhoudelijke goedkeuring en omzeilt geen publicatiecontrole.

Iedere build voert daarnaast een onafhankelijke alleen-lezencontrole uit. Een niet-voorbereid zwaar beeld, gewijzigde bron met oude koppeling, beschadigd bestand of een te zwaar resultaat stopt de build. Reeds voorbereide bestanden worden op bron-/resultaathash gecontroleerd en niet telkens hercodeerd. De beeldnamen zijn inhoudshashes; de bestaande lange cacheduur blijft veilig.

SVG-logo's en vectoren blijven vectoren. Een vector boven de grens of een animatie krijgt een concrete blokkade voor gerichte controle, in plaats van automatische rasterisatie of verlies van beweging. Publicatie en nieuwe beeldbestanden blijven langs de bestaande canonieke publicatiepoort gaan. Geen extra GitHub Actions.

Deze wijziging verandert geen schermen, inhoud, routes, audio, antwoorden, voortgang of bestaande bronbeelden. Het menuvoorstel is uitsluitend advies. De huidige woordenbibliotheek bevat 338 woorden uit vijftien oudere lessen en 4.789 aanvullende woorden; dit is niet automatisch een volledige koppeling van alle nieuwere oefenbanken.

Lokale controles: `node scripts/test-prepare-images.mjs`, `npm run images:check`, types, gerichte lint, build en de bestaande publicatieketen. Nieuwe testbeelden staan uitsluitend tijdelijk buiten het project en worden verwijderd; er worden geen nieuwe lesbeelden gemaakt.
