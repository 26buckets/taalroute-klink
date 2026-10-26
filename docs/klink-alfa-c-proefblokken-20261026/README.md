# Alfa C lokale proef — 26 oktober 2026

Geen publicatie. Basis: 7661c5b, afstammeling van goedgekeurde livebron 79f0583d32fc9c6315a6680ec76442ffaafcbce1.

Start: npm run dev -- --host 127.0.0.1 --port 18856
Open: http://127.0.0.1:18856/proef-alfa-c/

Nieuwe route is alleen development. Hoofdmenu online krijgt geen extra ingang. Productievoortgang blijft ongewijzigd; proefopslag staat uitsluitend onder klink.preview.alfa-c.v1 op de lokale origin. Wissen van die ene sleutel begint de proef opnieuw.

Inhoud en grenzen: review.json en outputs/alfa-c-proefblokken-20261026/Klink-Alfa-C-proefblokken-en-hergebruik.html. steps.json bevat alle bronkoppelingen. media.json bevat hashes en audiotijden; enabled=false betekent bewust uitgeschakelde instructiebron.

Lokaal controleren: node --test scripts/test-alfa-c-preview.mjs; node scripts/test-alfa-c-preview-browser.mjs; node scripts/test-alfa-c-preview-audio.mjs; npx tsc --noEmit; gerichte oxlint.

Geen nieuwe stemmen, afbeeldingen, afhankelijkheden of GitHub Actions. Geen niveaulabels van broninhoud gewijzigd. Audit is gericht op hergebruik voor deze drie pilots, geen definitieve vrijgave van de volledige lesvoorraad.

De bestaande publicatiecontrole voor de vorige ontbrekende-letterrelease weigert deze extra proefbestanden terecht. Die vrijgave is niet uitgebreid of omzeild. Zie release-scope-check.log. De zelfstandige inhoudstests zijn afzonderlijk geslaagd. Nieuwe proefinhoud nog niet publiceren.
