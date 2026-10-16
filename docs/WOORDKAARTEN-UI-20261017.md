# Klink — rustigere woordkaarten

Datum: 17 oktober 2026. Ontwikkelbasis: 2ba3a5ea53fd5c20f964d03d2a6f02d9a26f1eaf, branch codex/klink-wordcards-ui-20261017. Aparte checkout: /Users/nicoknoester/.codex/klink-ui-20261017.

## Resultaat

Alleen de opmaak van de algemene woordenlijst is aangepast. Foto's groeien binnen de bestaande kaart van 72 naar maximaal 104 pixels en blijven volledig zichtbaar zonder bijsnijden of vervormen. De luisterknop omvat nog steeds foto en woord. Bewaar heeft een rustig Lucide-icoon en tekst, een transparante achtergrond en een behouden tikvlak van 64 × 56 pixels. Bewaard blijft herkenbaar aan tekst, vinkicoon, ingedrukte toegankelijkheidsstatus en een zachte groene achtergrond. Beginletterblokken zijn minder nadrukkelijk; ze zijn geen vervanging voor ontbrekende betekenisbeelden.

Het bestaande raster gebruikt drie kolommen op brede schermen, twee tussen 701 en 1200 pixels en één tot 700 pixels. De eerdere omslagpunten lieten onder andere aardappel onnodig afbreken. Navigatie, secties, oefenspeler, inhoud, routes, afbeeldingen, audio en opslaggedrag zijn behouden.

De oorspronkelijke gedeelde checkout is niet gewijzigd. Geen push, GitHub Actions of livepublicatie. De ontwikkelpreview draait op http://127.0.0.1:18818/#learner/home; kies Woorden. De oorspronkelijke werk-app blijft op poort 18816.

## Controles

- Gerichte lokale Chrome-controle van alle 338 kaarten op 15 schermbreedten tussen 320 en 1366 pixels, inclusief beide kanten van de responsieve omslagpunten: geen horizontale pagina-overloop, overlappende bediening of afgesneden tekst; foto's behouden hun verhouding. Aardappel blijft op één regel.
- Werkelijk audio-afspelen via Enter, zichtbare toetsenbordfocus, Bewaar/Bewaard, verwijderen, bewaren na herladen en terugvinden bij Herhalen geslaagd.
- De bestaande volledige test-existing-player-browser.mjs-reeks is lokaal geslaagd: alle lessenreeksen, begeleide les, negen gekoppelde oefenfamilies, woorden bewaren/herhalen, tabs en desktop/tablet/390/320-pixelbediening.
- Productiebuild en git diff --check geslaagd. Geen nieuwe functionele logica of productieafhankelijkheden.
- Bewijs en herhaalbare gerichte controle: outputs/wordcards-ui-20261017. Schermbeelden zijn compact; geen oorspronkelijke media in de chat geladen.

De controles zijn technisch en visueel, geen cursistproef, volledige screenreadercontrole of nieuwe uitspraak-/mediavrijgave. De DigiBord-stijlreferentie is in de teruggevonden Drive-back-up gelezen en bekeken; de actuele oorspronkelijke stijlmap ontbreekt op de opgegeven locatie. De bestaande Lucide-iconen, tekstgewichten, kleuren en appopzet zijn aangehouden.

## Herstel en integratie

De Drive-herstelset bevat de volledige gevolgde bron inclusief public-media, deze notitie, de patch, broncommit en testbewijs. De ongewijzigde originele media en eerdere productiegegevens blijven in de bestaande projectback-ups bewaard. Neem bij integratie alleen de gerichte CSS-wijziging en deze notitie mee; overschrijf geen actuele inhoud uit de andere ontwikkelchat. Publicatie blijft een afzonderlijke gecontroleerde handeling.
