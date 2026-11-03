# Alfa C Hoor en schrijf — lokale brongebonden hulpcorrectie

Ontwikkelwerkplek, detached vanaf canonieke main 660aff9ff55c238039dc7d9cf0adb2faae7c2d6b. Niet hieruit publiceren.

Alleen KSW-AC-HS-001 t/m 010 krijgen de oorspronkelijke luisterhint. De bestaande Help-knop herhaalt eerst de echte opname en toont pas na geslaagd afspelen de luisterhint. Zonder eigen poging kan de cursist niet verder naar de spellinghint. Vóór die spellinghint wordt de oorspronkelijke eigen inkt als eerste/laatste poging bewaard; de hint bevat het doelwoord en wordt daarom als modelgebruik geregistreerd. Daarna kan het model worden getoond en weer verborgen. Rechtstreeks Vergelijk na eigen inkt blijft de bestaande optionele zelfcontrole.

Exacte vraag-ID's, IndexedDB-sleutels, oorspronkelijke antwoorden, audio, banken, overige 90 handschrifttaken en andere WordHint-aanroepen blijven behouden. Geen OCR, spellingbeoordeling of beheersingsclaim. Geen nieuw visueel ontwerp of CSS. De tien hints zijn brongebonden data in de bestaande component; geen extra publieke bronbestanden of nieuwe opnamen.

De eerste herhaalstap gebruikt de bestaande luistercontrolering zodat algemene woordaudio van het knopwoord Help de doelopname niet onderbreekt. Deze interactie is met echt afspelen getest. Opslagfouten mogen geen spellinghint of model tonen; een mislukte schrijfopslag houdt de cursist bij de luisterhint en maakt opnieuw proberen mogelijk.

Bronvergelijking en volledige bron staan in de geneste herstelkopie; zelfstandige lokale controles staan in verification.json. Niet-uitgevoerde menselijke NT2-/luisterreview en fysieke telefoontest worden niet geclaimd. Live blijft ongewijzigd.

Vóór publicatie: huidige main/live opnieuw controleren, bewaarde ongepubliceerde dictees afzonderlijk behouden, alleen deze gecontroleerde wijziging naar canonieke main overbrengen, normale brongebonden opvolgpoort en volledige keten voorbereiden, publicatievenster afstemmen, aangeboden eindbouw opnieuw tellen en normale npm run deploy met live- en Drive-eindcontrole. De twee andere ontwikkelwerkplekken en overige kandidaten blijven afzonderlijk. Geen limiet-, budget- of configuratiewijziging.
