# Docentwerkplek met groepen en persoonlijke oefencodes

28 oktober 2026. Lokale bouw, niet gepubliceerd. Deze afspraak vervangt de eerdere dagelijkse docentstart met inhoudslijn en bouwchecklists.

## Dagelijks gebruik

1. Open Docentomgeving via het Klink-menu.
2. Cursisten en groepen: maak een groep, voeg cursisten toe. Geef iedere cursist de eenmalig getoonde eigen oefencode. Namen zijn wijzigbaar.
3. Opdrachten klaarzetten: kies de hele groep of afzonderlijke cursisten, een onderdeel en een leesstap. De bestaande leesstap wordt aan ieder gekozen persoon gekoppeld. Herhaald klaarzetten maakt geen duplicaten.
4. De cursist kiest Mijn opdrachten op de startpagina of in het menu en vult de persoonlijke code in. Alleen eigen opdrachten zijn zichtbaar, ook op een ander apparaat dat dezelfde server gebruikt.
5. De cursist doorloopt de bestaande speler. Na de laatste oefening wordt Afgerond opgeslagen. Dit is voltooiing, geen beheersingsscore of niveauverklaring.
6. Vergeten code: Nieuwe code trekt de oude code en alle bestaande cursistsessies in. Opdrachten blijven behouden.

Klink+docent blijft zonder aanmelding rechtstreeks openen via #teacher/plus. Werkbladen staan apart onder #teacher/materials. De algemene handleiding blijft op https://studio.taalroute.nl/#/apps/klink/handleiding. De historische inhoudsreferentie is behouden onder #teacher/reference; geen ingang in de dagelijkse docentnavigatie.

## Afbakening

Toewijzing is aangesloten op de bestaande canonieke leesstappen uit de vijftien oorspronkelijke onderdelen. Geen nieuwe opdrachten of media gemaakt. Nog geen losse toewijzing van alle aanvullende oefenvormen, voortgangsbeoordeling per vaardigheid, groepsverplaatsing, verwijderen of organisatiebreed beheer. Voltooide opdrachten blijven herhaalbaar; een tweede afzonderlijke poging met een nieuwe deadline bestaat nog niet. Maximaal honderd cursisten per klaarzetactie.

De groepen, cursisten en opdrachten zijn echte databasegegevens; geen voorbeeldlijst in het product. Browsercontroles gebruiken uitsluitend tijdelijke fictieve testpersonen en verwijderen deze na afloop. De lokale docent Nico begint met een lege werkplek. De bestaande gedeelde oefenvoortgang in localStorage wordt niet als persoonlijke prestatie geïmporteerd of overschreven. De nieuwe speler slaat geen antwoorden, geluidsopnamen of vrije cursistenteksten in de teaching-tabellen op.

## Toegang en opslag

Bestaande D1-binding; zes aparte teaching-tabellen. Drizzle-schema en migratie 0001_teaching zijn samen vastgelegd. Bestaande attempts/mastery/review_items en hun ingetrokken API blijven ongewijzigd.

Leerlingcodes: zestien willekeurige cijfers, weergegeven in vier blokjes. Docentcodes: 128 willekeurige bits. Codes zijn serverzijdig SHA-256-gehasht; alleen een nieuwe cursistcode wordt bij aanmaken/herstellen eenmaal teruggegeven. Het zijn willekeurige toegangssleutels, geen door mensen gekozen wachtwoorden. Sessietokens: 256 willekeurige bits, alleen hash opgeslagen, acht uur geldig. Afzonderlijke HttpOnly/SameSite=Strict-cookies per rol, Secure op HTTPS. Buiten localhost wordt HTTP geweigerd. POST vereist dezelfde Origin; maximaal 16.000 bytes requestbody. Aanmelden begrensd per rol/IP per tien minuten (20 docent / 100 cursist); cursisten kunnen met meerdere personen achter hetzelfde schoolnetwerk werken.

Iedere serverhandeling controleert de eigenaar van groep en cursist. Een cursist krijgt uitsluitend eigen toewijzingen en kan uitsluitend de eigen opdracht afronden. Databaseschrijfacties voor meerdere toewijzingen/codeherstel gebruiken D1-batchtransacties. Codeherstel kan een gelijktijdige oude aanmelding niet alsnog geldig maken. API-antwoorden zijn no-store; onbekende databasefouten tonen geen technische details. Codes en sessies horen niet in URL's, localStorage, Git, screenshots of het herstelpakket.

## Lokaal opbouwen

Gebruik de bestaande dependency-installatie; geen nieuwe pakketten.

```sh
npm run build
npx wrangler d1 execute DB --local --persist-to "$PWD/.wrangler/state" --config dist/server/wrangler.json --file drizzle/0001_teaching.sql
node scripts/provision-teaching.mjs Naam /absoluut/prive/codebestand.json
```

Migratie eenmaal uitvoeren op een lokale database zonder teaching-tabellen. Het expliciete persist-to-pad is nodig: een config onder dist/server gebruikt anders een andere lokale database dan de ontwikkelserver. Het codebestand is privé met modus 0600; een bestaand bestand wordt niet overschreven. Deze helper voert uitsluitend lokaal uit. Er is geen publieke docentregistratie of automatische productieprovisioning. Voor online gebruik zijn een afzonderlijke vrijgave, actuele livebasiscontrole, database-inrichting en beheerde docenttoegang nog nodig.

## Controles

- Twee SQL-/servicetests: hele toewijzingsketen, twee gescheiden docenten, cursistisolatie, dubbele toewijzing, ongeldige invoer, eigenaarcontrole, ongeldig niveau/les-ID, sessieverval, codeherstel, uitloggen, verzoekgrootte, Origin en inlogbegrenzing.
- Browserketen tegen de echte lokale D1-API: groep/twee cursisten aanmaken, herladen, individueel en hele groep toewijzen, persoonlijke toegang, echte mat-les bouwen en afronden, docentstatus, codeherstel, oude sessie/code geweigerd, vernieuwde code, Chrome/WebKit en mobiel, toegang vanaf landing/menu en behoud zes stappen.
- Zes volledige bestaande digibordreizen in Chrome/WebKit op drie schermmaten. Acht bestaande bordrandgevallen.
- Beide bestaande menutests: inhoudsreferentie op eigen route, cursistnavigatie, hervatten, toetsenbordfocus en bewaarde voortgang.
- Typecheck, gerichte lintcontrole en productiebouw. Reeds bekende repo-brede lintmeldingen buiten deze wijziging blijven vastgelegd in STAP-3-TEKST.md.

Geen fysieke digibord-/telefoonproef, schermlezerproef, klasproef, externe beveiligingsaudit of productiebelastingstest. Geen nieuwe audio, beelden of drukbestanden. De ontbrekende lokale DigiBord-stijlreferentie is niet vervangen door een nieuw vormgevingssysteem; bestaande Klink-lettertypen, Lucide-iconen en knoppen zijn hergebruikt.

Geen GitHub Actions toegevoegd; zware controles lokaal. Geen remote database gewijzigd, geen merge en geen publicatie. Herstelpakket bevat bron/migratie/tests/bewijzen, geen persoonlijke codes, sessies of lokale gebruikersdatabase.
