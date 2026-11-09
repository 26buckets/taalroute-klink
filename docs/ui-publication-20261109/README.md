# Publicatie UI-verfijning — 9 november 2026

Nico heeft met “Publiceer het.” de gecontroleerde volledige kandidaat 31635a5492b22a10d7ea853971ca13db7a422aba vrijgegeven, inclusief de voorgaande verbetering 00397f89. De werkelijk live staande bron is 75cda7ec2ec683aa74d393b70f1289400e5a21c9; de canonieke bewijsbasis is 0e72bf0ead44306e77b85dd06ae4856e663ad755. De achttien runtimebestanden zijn exact gelijk aan de beoordeelde kandidaat.

Alle 22.418 bestanden zijn lokaal via HTTP bytegelijk aan de productiebuild gecontroleerd, met 25 ongewijzigde audio-HTTP-contracten en 40 correcte afwijzingen van onbekende/uitgesloten bestanden. Alle 17.856 bestaande audiobestanden en bundels behouden hun bytes en gecontroleerde metadata. Inhoudsvingerafdrukken en alle oorspronkelijke inhoud/media zijn gelijk. Vier overstappen van de oude naar de nieuwe bron behouden werkelijk getekend handschrift, historie en lokale opslag.

De gerichte browsercontrole is op de canonieke build herhaald. De uitgebreide eerdere controle is gekoppeld aan dezelfde runtime: 68 toegankelijkheidsschermen, 1200 paneelgevallen, 200 luister-/modelgevallen, opgeslagen woorden, docentbediening, oude routes en native audio. Geen bewezen 9,5: praktijkonderzoek, fysieke toestellen en schermlezeronderzoek blijven open.

De normale publicatiebeveiliging krijgt een brongebonden opvolger; de historische goedkeuringen blijven intact. Volledige publicatie-eenheidstests worden lokaal uitgevoerd en afzonderlijk vastgelegd vóór publicatie. Geen nieuwe diensten, afhankelijkheden, tarieven of GitHub-workflows. Publicatie uitsluitend vanaf schone main met npm run deploy.
