> Historisch v3 HOLD-bronverslag. Voor de actuele implementatie en verificatie: [VISUELE-RAPPORTAGES.md](VISUELE-RAPPORTAGES.md). De oude status hieronder is geen actuele stagingstatus.

# Klink Inzicht observatie | Vervolgimplementatie v2

Datum: 1 november 2026. **Codepakket voor de bestaande PR #8, niet online geïnstalleerd.**

## Wat is aangepast ten opzichte van observatiepatch v1?

De oorspronkelijke inhoud blijft exact hetzelfde. ✓ betekent *Zonder directe hulp*, △ *Met hulp of model*, — *Niet waargenomen*; `null` betekent *niet ingevuld*. Het ontwerp Woord/Zin/Tekst, de acht leskernen en zes criteria per combinatie blijven ongewijzigd. Er is geen koppeling naar automatische beheersing of een meetresultaat.

De brongetrouwe React-observatiemodule is sterker gemaakt voor langdurig opslaan en het wisselen van context:

1. Een modus-, bronitem-, cursist- of historie-wissel wacht op de werkelijke API-save. Als de save mislukt of een nieuwe bewerking binnenkomt, blijft de huidige observatie zichtbaar; een wijziging wordt niet stilzwijgend weggegooid.
2. Een nieuwe observatie wacht ook op opslaan van de bestaande observatie. De vorige revisie blijft intact, en een nieuwe observatie krijgt een eigen UUID.
3. Een PDF wordt uitsluitend gegenereerd wanneer de snapshot identiek is aan de door de server bevestigde actuele bewerking. Bewerkingen tijdens bewaren blokkeren de export in plaats van een onbetrouwbare PDF te maken.
4. Een niet-afgeronde save veroorzaakt een standaard browserwaarschuwing bij herladen of tabsluiting. Dit vangt niet elke interne SPA-routerwissel af; die blijft een aparte end-to-end test.
5. Een verloren serverantwoord na een geslaagde D1-commit kan met dezelfde idempotency key worden herhaald, mits de invoer identiek is. Bij nieuwe bewerkingen na zo'n fout kan een 409 ontstaan: dan moet de docent vergelijken; nooit blind overschrijven.
6. De status 'Opgeslagen in Klink Inzicht' komt pas na serverbevestiging. `localStorage` wordt niet gebruikt als centrale opslag. Bij een fout blijft de melding 'Niet opgeslagen' zichtbaar.
7. Het aantal actieve writes wordt bijgehouden, zodat één voltooid verzoek de UI niet ten onrechte vrijgeeft terwijl een tweede verzoek nog loopt.

## Wat is wel echt getest?

- **11 van 11** API/database-tests via Node 22 + een echt SQLite-in-memory transactiemodel. Onder andere alle 24 combinaties, alle vier representaties (null/0/1/2), revisies, ongeldige input, authenticatie, school-/cursistisolatie, alleen auteur mag wijzigen, idempotentie en gelijktijdige correcties met 409-conflict.
- **5 van 5** statische broncontract-/UI-preflightcontroles, inclusief hash van de echte originele HTML indien die beschikbaar wordt gesteld.
- De TypeScript-parser leest alle vier aangepaste TS/TSX-bronbestanden zonder syntaxisfouten. Dit is géén volledige typecheck.
- Patch opnieuw samengesteld vanaf exact de op GitHub geverifieerde PR8-HEAD `8c07687153d908a67ee0f66e711d95ac67eaa6b8` en met `git apply --check` op een schone PR8-basis geverifieerd.

## Blokkerende echte integratiestappen

1. Zorg voor GitHub push-rechten in repository `26buckets/taalroute-klink` of laat de bestaande WorkChat deze patch op PR8 toepassen. Huidige GitHub-connector meldt `pull: true, push: false`.
2. Controleer opnieuw de actuele PR8-HEAD en eventuele ander werk in dezelfde bestanden. Stop bij verschillen en voer een handmatige review/merge uit.
3. Draai `git apply --check klink-inzicht-observatie-v2.patch`, daarna `git apply klink-inzicht-observatie-v2.patch` op branch `codex/klink-inzicht-20261101` of een reviewbranch daarbovenop.
4. Installeer de vastgezette `jspdf@4.2.1` en commit de correcte lockfile. Hergebruik indien mogelijk de door de app al aanwezige goedgekeurde PDF-renderer; neem **geen ingebedde fonts of volledige demo-HTML** over naar productie.
5. Draai migratie `db/migrations/inzicht/0006_original_observations.sql` uitsluitend op de afzonderlijke synthetische EU-staging D1 `klink-inzicht-pr8-staging`. Maak vóór wijziging een geldig staging-back-up-/herstelpunt. Voer deze migratie nooit op productie uit zonder expliciete vrijgave.
6. Draai de oorspronkelijke Klink/PR8-testsets, `npm run build` en stagingbuild; test de drie modi, handmatige en automatische save, netwerkuitval, herladen, nieuwe observaties, revisies en alle drie de symbolen in een echt PDF-bestand.
7. Test in Chromium/WebKit (mobiel/desktop, licht/donker), screenreader en toetsenbord, plus twee docenten/twee cursisten/twee scholen. Controleer herstel/export en back-ups.
8. Laat onafhankelijke NT2-, security-, AVG/DPIA- en toegankelijkheidsreviews plaatsvinden vóór echte cursistgegevens. Geen merge of livepublicatie zonder afzonderlijke toestemming.

## Handmatige controle in staging, uit te voeren door Work/developer

- Log in als fictieve docent. Open klas A en cursist 1, kies Woord > mat. Vul criteria in met ✓, △, — en laat ten minste één vakje leeg. Na 'Opgeslagen in Klink Inzicht': pagina herladen en opnieuw inloggen. Dezelfde vier datastaten moeten terugkomen.
- Open bij dezelfde cursist Zin > tas en Tekst > pen. Controleer precies de originele zes criterianamen, zin en tekst. Maak een extra observatie voor hetzelfde bronitem en controleer dat er twee aparte historievermeldingen zijn.
- Pas een eerder opgeslagen observatie aan. Controleer dat revisie 1 en 2 bestaan en dat een andere docent geen observatie kan corrigeren waarvan deze niet de auteur is.
- Schakel de verbinding uit vlak vóór een save. Wisselen van cursist of bron mag de niet-opgeslagen invoer niet weggooien. Na herstel moet een retry met identieke idempotency key mogelijk zijn.
- Verander een beoordeling vlak vóór PDF-export. De PDF mag alleen worden gedownload nadat de laatst bevestigde toestand aan de UI voldoet. Controleer symbolen en datametadata, accenten, paginering en gescheiden schoolcontext.
- Log in als cursist of onbevoegde docent. GET/POST en PDF van andere scholen moeten worden geweigerd. Verifieer dat de bestaande persoonlijke Klink-omgeving en Klink+Docent dezelfde werking behouden.

## Open beperkingen

Er is geen productiecode aangepast, geen GitHub-commit gepusht, geen SQL-migratie in de online D1-staging uitgevoerd en geen live PDF/browser-test gedaan. De container heeft geen toegang tot de volledige hoofdrepository of Cloudflare-account. De enige feitelijke output is een controleerbaar **v2 codepatchpakket met lokale tests**. De UI is nog niet formeel op WCAG 2.2 AA beoordeeld. De registratie van observaties is geen automatisch geldig skills-evidence.

## Rebase op PR8 met MFA (nieuwste door connector geverifieerde bron)

De PR8-branch bleek tussentijds te zijn uitgebreid tot commit `c47b3d99ca67948d312a6e9dcd837c09c4348eeb`. De nieuwe MFA-login, authenticator, herstelcodes en outbox-retries blijven volledig intact. De oorspronkelijke observatie-UI- en servicewijzigingen zijn via drieweg-merge in de nieuwe bron opgenomen, waarbij uitsluitend het importblok in service.ts handmatig is samengevoegd: MFA-imports blijven behouden, en de bronobservatie-import is toegevoegd. Het observatiemigratiebestand heet daarom **0006_original_observations.sql** en schrijft schemaversie 6; MFA gebruikt 0004 en retries 0005. Dit v3-pakket vervangt de oudere v1/v2-patches. Een volledige test moet na het toevoegen van externe dependencies en de actuele stagingbindings nog volgen.
