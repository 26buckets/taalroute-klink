# Publicatieopdracht time-outreparatie — 6 november 2026

Nico: “Oké, ik ben nieuwsgierig welke... wat is de volgende stap om ruimte te besparen? Zet deze alvast maar even online. Publiceer het maar.” Dit geeft de gecontroleerde time-outreparatie vrij, niet een nieuwe opslagmigratie of vormgeving.

De actuele basis is main d4c68ec06b2d521bb70e40f32cd8aa2139f74d8d, met livebron 3e1e49e914893039b234e20620d22b1a399abe9f en Worker 38d89a3e-d994-4a15-893b-846697fdfe84. De nieuwe goedgekeurde oefenindeling en automatische antwoordbediening zijn behouden; de eerdere herstelbranch is met die basis samengevoegd. Alle inhoud/media/opslag/UI-bronnen zijn exact gelijk aan deze livebasis. De 50 woordvragen blijven online en goedgekeurd.

Alleen worker.ts, de worker-entry in vite.config.ts en de vervallen middleware veranderen runtimegedrag. Bestaande handlers worden hergebruikt. De publicatiepoort krijgt een brongebonden opvolger met expliciete verwijderingscontrole en worker.ts in de scope, inclusief negatieve tests. Geen poort, review of historisch inhoudsakkoord wordt overgeslagen. Geen afhankelijkheids-, database-, workflow-, budget- of stagingwijziging.

Alle actuele lokale controles staan in verification.json en local/. De eerste native test gebruikte de oude verwachting zonder automatische voortgang. De test pauzeert voortaan de bestaande automatische stand voordat zij de expliciete Enter/Verder-route controleert. De afzonderlijke huidige oefenindelingstest controleert automatisch doorgaan en pauze. De productcode is hiervoor niet aangepast. Een recente testhelper had een React-Hook-achtige naam; uitsluitend die naam is gecorrigeerd. Eerste diagnostiek blijft in de herstelkopie.

De synthetische framework-stall is eerder gereproduceerd; de oorspronkelijke live-trigger blijft onbewezen. Na gewone publicatie volgen begrensde live-aanvragen en native browsercontroles. Geen fysieke telefoonproef of nieuwe menselijke luisterreview.

Ruimteadvies, niet uitgevoerd: de publicatie telt 18.393 bestanden, waarvan 13.843 audiobestanden (11.580 MP3, 2.236 WAV, 27 M4A). Apart opslaan in R2 kan deze plaatsen uit de apppublicatie halen met behoud van URL's via gerichte routing. Eerst kosten/gebruik en bereik-/cachegedrag toetsen. Minder bytes per audio verandert de bestandslimiet niet. Officiële bronnen: https://developers.cloudflare.com/r2/buckets/public-buckets/ en https://developers.cloudflare.com/r2/pricing/ .
