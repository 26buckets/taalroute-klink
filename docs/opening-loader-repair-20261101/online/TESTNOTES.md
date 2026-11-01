# Live afspeelcontrole

De eerste volledige run slaagde in 16 Chromium-combinaties en de eerste WebKit-combinatie. WebKit wachtte bij het maken van screenshots op documentlettertypes die de SVG niet gebruikt; twee pogingen liepen vast en een poging na voorladen was te laat voor de vroege bewegingsmeting. Deze pogingen blijven bewaard.

Dezelfde 16 WebKit-combinaties slagen met `PW_TEST_SCREENSHOT_NO_FONTS_READY=1`, na het volledig decoderen van de SVG. Alleen de screenshotvoorwaarde verandert. De app en bronbestanden zijn ongewijzigd. Deze interne testschakelaar staat in de geïnstalleerde Playwright 1.64.1-bron, coreBundle.js bij de screenshotvoorbereiding.

Herhalen vanaf de repositoryroot: `PW_TEST_SCREENSHOT_NO_FONTS_READY=1 KLINK_TEST_URL=https://klink.taalroute.nl KLINK_LOADER_OUTPUT=work/loader-check node docs/opening-loader-repair-20261101/online/webkit-image-capture/reproduce.mjs`.

De 24 normale schermen zijn apart mét wachten op lettertypes vergeleken. Normale koude starts zijn ook apart in Chromium en WebKit gecontroleerd. Geen fysieke telefoons getest.
