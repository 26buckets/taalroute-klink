# Klink — uitgeversvermelding naar de footer

Nico vraagt de Taalroute-vermelding onderaan te zetten, de losse link ‘Voor begeleiders’ te verwijderen en het hoofdvlak hoger en centraal te plaatsen. Hij geeft expliciet opdracht de gecontroleerde versie te publiceren.

De gecontroleerde livebasis is ae860b9c36271539a97d3205b9663e31dda187d7, Worker f6e569d7-9bfc-4689-b9bf-ad483d8fb4bf. De lokale bron stamt daarvan af. Alleen app/landing.css en components/product/entry-design.tsx veranderen in de runtime. De header, officiële D-vectoren, bestaande foto, tekst, leerroutes, gegevens, bibliotheken en media blijven bytegelijk.

De bovenste interne strook verdwijnt. De uitgeversvermelding verhuist naar het bestaande footergebied bij het webadres. Het hoofdvlak behoudt zijn breedte, inhoud en compositie en begint nu 22 px onder de vaste header op desktop en 12 px op mobiel. De footer blijft bij korte pagina’s onderaan; op kleine schermen volgt hij de inhoud. Het bestaande anker voor de begeleiderssectie blijft geldig. De docent- en cursistingangen en uitklapbare begeleidingsuitleg blijven werken.

De bestaande browsertest controleert de nieuwe plaatsing op vijf breedtes, beeldladen, geen horizontale overflow, foutieve en geldige klascode en beide werkplekken. De toegankelijkheidstest bevat 37 scans zonder meldingen. De handleiding is op tien combinaties van route en breedte geometrisch gelijk aan de vorige liveversie. Desktop- en mobiele screenshots zijn visueel gecontroleerd.

De opvolgende vrijgave bindt uitsluitend vijf bron-/testbestanden aan hashes, met het vorige akkoord bytegelijk verankerd aan de livecommit. Nieuwe negatieve tests bewaken ontbrekende toestemming, ruimere scope, verkeerde basis en ontbrekende hashes. Historische inhoudsakkoorden en de audiopauze blijven ongewijzigd.

Volledige testresultaten, publicatiebewijs en herstelback-up worden in dit dossier vastgelegd. Geen nieuwe afhankelijkheden, cloudworkflows, inhoud of beelden. Geen nieuwe menselijke cursistproef.
