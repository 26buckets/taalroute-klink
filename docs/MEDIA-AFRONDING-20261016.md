# Klink — media en publicatiecontrole

## Afgerond

- De historische livebron is aantoonbaar c221eb104fe64a17de9e51a59ddc5667ea805518, bij Worker efddd274-4f66-4d5b-9bfb-c21e87acc89d. De oorspronkelijke publicatieadministratie én verse publieke client-/Worker-bestanden zijn gecontroleerd. Zie klink-publication-provenance.json.
- Tien bestaande SVG-beelden exact hersteld: vier kleuren, vijf aantallen en cirkel. Bytevergelijking en browsercontrole geslaagd; verhoudingen blijven behouden. Dit is geen menselijke didactische vrijgave.
- Zeven nieuwe woordkandidaten: fit, koekje, pak (verpakking), sap, spuit, tomaat en zeef. De bestaande Remko-stem, instellingen en tempo zijn gebruikt. Productieplan met exacte stem-ID vooraf opgeslagen. Alleen woordmodellen, geen instructiestem of losse t.
- Alle zeven nieuwe opnamen technisch gecontroleerd; Taalroute staat in de ondersteunde ingebedde merkvelden. Toevoegen van metadata heeft de geluidsdata niet veranderd. Originelen en controles blijven apart bewaard. Ze zijn niet aan de openbare app gekoppeld.
- De bestaande 331 gekoppelde woordopnamen en alle 161 gekoppelde beelden zijn op bestandspaden gecontroleerd; de gekoppelde audio heeft de vereiste Taalroute-metadata.
- Dezelfde app, navigatie, leesvolgorde, woordenbank en oefenspelers blijven behouden. 4.354 oefeninstanties, 302 routes, 338 betekenissen; geen nieuwe didactische lijsten.

## Lokale controles

- 14 curriculum-/spelercontracttests en 4 nieuwe negatieve/positieve publicatiebewijstests geslaagd.
- API-afsluiting, volledige begeleide route, negen actieve families, bewaren/herhalen, fouten herstellen, feedback en audio-/microfoon-/timeropruiming geslaagd.
- Desktop, tablet en smalle schermen meegenomen in de bestaande browsertests.
- Alle tien herstelde beelden laden in de bestaande woordkaarten met object-fit contain.
- Zeven beoordelingsopnamen laden in de browser. Dit bewijst niet dat de uitspraak goed is; er is geen menselijke luisterbeoordeling uitgevoerd.
- TypeScript, gerichte lintcontrole en productiebuild geslaagd. Bestaande bundelgrootte-/dynamische-importwaarschuwingen blijven; geen buildfout.
- Geen GitHub Actions-workflows aangetroffen op de gecontroleerde main- en werkbranch. Geen cloudtests gestart; main en Cloudflare zijn niet veranderd.

## Nog niet afgerond — daarom niet gepubliceerd

177 betekenissen missen nog een passend gekoppeld beeld. 21 teruggevonden symbolen zijn bewust niet gekoppeld omdat ze context, notatiekennis of aanvullende beoordeling vragen. Een letter of gedrukt woord is niet als vervangend betekenisbeeld goedgekeurd. Voor abstracte woorden moet de passende beeldfunctie inhoudelijk worden gekozen, niet alleen een bestand worden ingevuld.

De zeven nieuwe woordopnamen wachten op uitspraakbeoordeling. Tot goedkeuring blijven in de app zeven audioverbindingen ontbreken. Ook de bestaande woordaudio en beelden hebben nog een open inhoudelijke vrijgavestatus. De instructie-audio is niet compleet; woordaudio is geen vervanging voor een gesproken opdracht. De losse t blijft geparkeerd. De cursistproef blijft niet-verplicht, overeenkomstig Nico's eerdere besluit.

De publicatiecontrole blokkeert dit resultaat terecht. Een fout in de bewijskoppeling of een ontbrekend bewijsbestand wordt ook geblokkeerd. Geen vrijgavevlaggen ingevuld om publicatie af te dwingen.

## Herstel en beoordeling

Het beoordelingspakket bevat luistercontrole.html, zeven aflever-WAV's, aparte oorspronkelijke WAV's, productie- en technische metadata, de tien symboolkoppelingen en scherm-/testbewijs. Open luistercontrole.html na uitpakken; dit is geen vervangende Klink-app.

De oorspronkelijke publicatieadministratie is het archief Controle-en-herstelgegevens-definitief-20261014.tar.gz (Drive-bestand 1RqxJRQ5MV-KyT1uinjgpZGs1L0Rxa7gJ). Het Klink-commit staat in outputs/Taalroute-audio-merkherstel-20261014.json; de Worker-versie in work/final-deployments.json en work/deploy-klink.log. Het nieuwe bewijsbestand bewaart de hashes; de eerdere beperkte modulevergelijking is niet stilzwijgend opgewaardeerd naar een bit-identieke runtimeherbouw.

Pas na afronding en goedkeuring van de media: opnieuw de werkelijk actieve Cloudflare-versie vergelijken, de gecontroleerde wijzigingsreeks samenvoegen in de canonieke main, lokaal volledig controleren, workflows opnieuw inspecteren en de normale publicatieroute gebruiken. Na publicatie de aangeboden media teruglezen en metadata controleren. Dat is in deze ronde niet uitgevoerd.
