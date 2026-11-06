# Aanvullende klikrandencontrole — 5 november 2026

De actuele livebron en canonieke main zijn vóór deze controle bevestigd. Dit werk staat apart op fix/focus-audit-all-klink-20261105. Geen nieuwe publicatieopdracht; geen push, releasepoortwijziging of deployment.

De eerste gepubliceerde CSS-correctie werkt in de gedeelde gewone schermen. Bij programmatische focus na het openen of sluiten van vensters kan de browser echter :focus-visible behouden na pointerbediening. De concrete gevallen zijn de vijf Klink+docent-hulpmiddelen, Delen en de uitlegvensters van de cursist. Chromium toont dit onder andere na terugkeer vanuit toetsenbordgebruik; WebKit ook bij de aanvankelijke focus van native vensters.

De lokale correctie registreert alleen de laatste bediening (pointer of toetsenbord) op het document. Alleen de aangetoonde vensterknoppen/openerknoppen krijgen bij pointerbediening geen focusoutline. De bestaande focusbestemming, toetsenbordbediening, kleur-/vormstijlen en opslag blijven intact. Toetsenbordberichten uit het bestaande uitleg-iframe herstellen de toetsenbordstatus na dezelfde bestaande controle op origin en bronvenster.

Geraakte bronbestanden: app/globals.css, app/layout.tsx, components/product/pointer-focus.tsx en components/product/practice-line.tsx. Geen wijziging aan andere inhoud, audio, database, opslagcode, configuratie, exports, dependencies, media, oorspronkelijke vormgevingsvloer of Actions. De nieuwe component is eenmaal in de bestaande rootlayout aangesloten en ruimt zijn listeners en tijdelijke DOM-attribuut op bij unmount.

Controles omvatten de start-/inlogschermen, cursistenstart, woordenbibliotheek/filters, herhalen, pakketten, klankenkaart, docentlesoverzicht, lesbediening/onderdelen, werkbladen/voorbeeld, handleiding, instellingen en appmenu. Herhaalde knoppen met dezelfde tag, stijlklasse en selectiepositie worden per scherm als één stijlfamilie beproefd; dit is geen claim van iedere knop in iedere afzonderlijke oefening.

Functionele selectieranden, fouten, actieve audio, invoervelden en de onderstreping van beluisterbare woorden blijven behouden. De oude ongebruikte criteria-activity-focusregel is geen aangetoonde oorzaak in de huidige renderers en is niet gewijzigd. Statische uitleg-/overzichtspagina's zijn in de broninventaris meegenomen. De eerder verplichte DigiBord-stijlreferentie op het opgegeven lokale pad ontbreekt; er is geen typografie-, icoon-, knopontwerp- of compositiewijziging gedaan.

De uiteindelijke resultaten en beperkingen worden na de laatste browserronde in RESULTAAT.md vastgelegd. De oorspronkelijke mislukte proeven blijven als diagnostiek bewaard, met onderscheid tussen aangetoonde appfocusproblemen, een onjuiste testselector, Safari's standaard Tab-instelling en de bestaande afscherming van een actieve docentles bij routewisseling.
