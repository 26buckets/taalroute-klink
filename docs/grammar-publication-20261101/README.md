# Klink — grammatica, instructies en woordaudio

Status: gepubliceerd op https://klink.taalroute.nl via de gewone publicatieroute. De lokale én online controles zijn geslaagd. Bron: `6b25e83b0bb3b051291df76adac96e48adf0ab8b`; Worker: `e3f5002b-8b45-477e-84de-985fa5560538`. De app is voor Nico geopend op de zelfstandige A1-grammatica.

## Reikwijdte

- Zelfstandig oefenen is de hoofdroute; docentsteun blijft optioneel.
- De reeds uitgewerkte grammaticaoefeningen, leskoppelingen en rustig opgemaakte, kortere instructies zijn samengevoegd met de actuele livebasis.
- De nieuwste B1-bronnen, mobiele bediening, het officiële logo, overige vaste vormgeving en bestaande voortgang blijven behouden.
- Exact 1.377 bestaande aanvullende woordaudio-koppelingen hebben een brongebonden publicatievrijgave. Nieuwe lokale opnamen worden daardoor niet automatisch online vrijgegeven.
- Geen nieuwe productiebatches, import of audiogeneratie.

## Gecontroleerd

Op de samengevoegde bron: 60 Alfa/B1- en 36 A1/A2-browsercontroles; 12 instructieschermen en vier pixelgelijke startpaginavergelijkingen; 192 mobiele keuzeschermen; vier native audio-/toetsenbordstromen. De nieuwste B1-inhoud is behouden in 80 rondeproeven met 960 vragen en 2.880 feedbackkeuzes. Chromium en WebKit, desktop/mobiel en licht/donker zijn gebruikt waar van toepassing.

Alle 1.360 nieuwe of gewijzigde audiobestanden hebben de juiste ingebedde Taalroute-merkvelden. Ook de overige zeventien bestanden van de 1.377 vrijgegeven woordkoppelingen zijn daadwerkelijk gecontroleerd. Daarnaast slagen de bestaande media- en 1.979 gekoppelde-audiocontroles. Technisch afspelen en metadata bewijzen geen menselijke uitspraakreview.

## Historisch herstel

Twee oude testverwachtingen zijn gerepareerd zonder inhoud, antwoorden of voortgang te wijzigen:

1. De lescontroletest eist nu de oorspronkelijke vijftien pakketten / 302 lessen plus exact het toegevoegde B1-lesvoorstel.
2. De schrijfreleasetest gebruikt haar eigen historische bronbestand en eist dat iedere negatieve proef de bedoelde bron daadwerkelijk wijzigt.

Historische lokale vrijgaven blijven ongewijzigd. Een nieuwe brongebonden vrijgave en de gewone publicatiepoort controleren de huidige opdracht. Uitgebreide controles draaien lokaal; geen GitHub Actions-workflows toegevoegd of ingeschakeld.

## Eerlijk open

Binnen de eerder onderzochte zelfstandige A1/A2-oefeningen zijn nog negentien woordvormen zonder losse opname: springt, kammen, kamt, strekt, vouwt, kleurt, breekt, roert, ruikt, verft, leert, speelt, verbetert, repareert, leunen, leunt, poetst, knoopt en smeert. Deze gaten zijn niet als opgelost geregistreerd. Ook ‘oefencursus’ in de begeleide instructie heeft nog geen losse opname; negentien is dus geen volledige methodebrede telling. De nieuwe achttien Alfa/B1-oefeningen hebben hun eerder gecontroleerde woordkoppelingen.

Het B1-lesblok blijft een lesvoorstel waar geen rooster is vastgesteld. Dit is geen claim dat de volledige leerlijn Alfa A–B1 inhoudelijk af is. Geen nieuwe onafhankelijke NT2-review, volledige menselijke luisterronde, fysieke telefoon- of schermlezertest uitgevoerd. De door Nico goedgekeurde uitspraak van ‘we’ blijft behouden.

## Afgerond archief en online bewijs

Alle 110 historische testbestanden zijn afgerond: 108 ongewijzigd en twee met het hierboven beschreven testherstel. De volledige historische publicatiebewijstest bevat vijftig verschillende gevallen, verdeeld over acht disjuncte uitvoeringen; alle vijftig zijn werkelijk uitgevoerd en geslaagd. Afgebroken aanloopruns gelden niet als geslaagd. De definitieve lijst staat in evidence/source-docs/archive-results.json. Oude tijdvelden van herstelde/onderbroken runs zijn geen totale doorlooptijd; de herstellogs en partitiemetingen zijn leidend.

Na publicatie opnieuw geslaagd: 96 grammatica-browsercontroles, zestien menucontroles en twee echte woordaudioflows in Chromium en WebKit op de publieke domeinnaam. Zowel een zichtbare aanvullende woordopname als de goedgekeurde opname ‘we’ is daadwerkelijk afgespeeld. Alle 1.544 betrokken openbare bestanden zijn volledig teruggelezen en bytegelijk aan de gecontroleerde bron. De broncommit was vóór en na die teruglezing gelijk. Opmaak, antwoordcontrole, voortgang, leskoppelingen en optionele docentsteun zijn behouden. Ook de tussentijds gepubliceerde Inzichten-menulink is meegenomen en gecontroleerd.

De normale publicatiepoort, productieopbouw, code- en typecontrole zijn geslaagd. Alle zware controles draaiden lokaal; er zijn geen GitHub Actions-workflows toegevoegd of gestart. Een experimentele lokale productiepreview kwam niet tot een geldige test en telt niet mee; de gewone productieopbouw en de daadwerkelijke online controles hierboven zijn wel afgerond.

## Herstelkopieën

De bronherstelkopie omvat 1.702 gecontroleerde bestanden/manifestregels, het incrementele Git-herstelbestand vanaf de vastgelegde basis en de vrijgegeven opnamen. De volledige Drive-download is op bestandshash, ZIP-integriteit en alle manifestregels gecontroleerd.

Bron: https://drive.google.com/file/d/1_cnbDF-Gmef-reKhiIHlYG1W8BWqtgyi/view

Het definitieve bewijsarchief en de terugleesbevestiging worden bij dit verslag in dezelfde bestaande Klink-projectmap bewaard. Er is geen tweede runtimepublicatie nodig voor deze administratieve vastlegging.

Definitief bewijsarchief: https://drive.google.com/file/d/1uJ9_lRMfdOk_eXTCJA-mWj01DjSL3Vkz/view

Volledig teruggelezen: 451 manifestregels; ZIP-integriteit en SHA-256 `99a7f850fea5d7e89a51d55ded29c7f2a5f01f70d7386660d1351851ee0e729c` bevestigd. De finale terugleesbevestiging staat naast het lokale verslag in `final-backup.json`.
