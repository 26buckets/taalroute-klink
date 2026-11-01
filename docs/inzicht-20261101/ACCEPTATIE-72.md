# KLINK INZICHT — 72 acceptatiecases

1 november 2026. Uitsluitend synthetische staging; teststatus is geen menselijke of juridische vrijgave. R2 > R1 > v1.0.

53 GETEST, 16 DEELS, 3 OPEN.

| Case | Eis | Status | Bewijs / open punt |
|---|---|---|---|
| KI001 | docent maakt klas; opnieuw inloggen -> identieke serverklasse. | GETEST | Online wachtwoord + authenticatorlogin, serverklasse en herladen/heropenen; twee browsers. Echte persoonsverificatie blijft vrijgavepoort. |
| KI002 | docent hernoemt/ archiveert -> historie blijft. | GETEST | Hernoemen, versieconflict, archiveren/heropenen met historie: test.mjs. |
| KI003 | docent maakt voorlopige cursist; koppeling vereist verificatie. | GETEST | Voorlopig profiel, registrar en accountgebonden uitnodiging: API en student-browser.mjs. |
| KI004 | twee cursisten met dezelfde naam -> aparte identiteit en dossier. | GETEST | Dubbele naam krijgt aparte IDs; geen automatische merge. |
| KI005 | cursist in twee klassen -> correct contextgebonden memberships. | GETEST | Registrar deelt dezelfde schoolcursist in twee klassen in; toegang expliciet per klas. |
| KI006 | docent observatie -> zichtbaar in juiste profiel, actor/tijd bekend. | GETEST | API + beide browsers, profiel, auteur/tijd en opslaan na netwerkherstel. |
| KI007 | observatiecorrectie -> audit en oorspronkelijke versie beschikbaar. | GETEST | Append-only revisies, reden/auteur, oude versie en audit bewaard. |
| KI008 | vrije notitie zonder rubric -> geen auto-mastered. | GETEST | Algemene observatie is TRAIN; geen statusverhoging. |
| KI009 | individuele geldige oefening -> juist event met itemversie. | DEELS | Schooloefening en contenthash opgeslagen; echte gevalideerde meetinstrumenten ontbreken. |
| KI010 | gezamenlijke digibordrespons -> geen individueel bewijs. | DEELS | Geen Inzicht-schrijver in Klink+Docent; regels weigeren niet-individuele/ongeldige identiteit. Geen groepsrespons-importpad gebouwd. |
| KI011 | geen bewijs -> UNKNOWN; geen score 0. | GETEST | UNKNOWN expliciet in unit/API/UI, geen score nul. |
| KI012 | een succesvolle meetdag -> DEVELOPING. | DEELS | Regeltest met synthetische goedgekeurde rubric; echte rubric nog niet gevalideerd. |
| KI013 | twee onafhankelijke dagen + transfer -> MASTERED onder geldige criteria. | DEELS | Onafhankelijke dagen/sessies/itemsets/transfer in regeltest; inhoudelijke norm nog niet goedgekeurd. |
| KI014 | twee pogingen op één dag -> niet automatisch MASTERED. | GETEST | Zelfde dag of hergebruikte feedback kan geen geldige transferpaar maken. |
| KI015 | herhaald onvoldoendes -> ATTENTION. | DEELS | Twee faaldagen getest; inhoudelijke aandachtcriteria nog te valideren. |
| KI016 | enkele fout na mastery -> RECHECK, audit en historie. | DEELS | Regel houdt verworven status + RECHECK; nog geen echt meetpad/rapport met gecertificeerde norm. |
| KI017 | ingetrokken event -> herbereken status. | GETEST | Ingetrokken evidence wordt uitgesloten; correctie/outbox herberekening getest. |
| KI018 | matrixcel -> exact onderliggend bewijs zichtbaar. | GETEST | Matrixcel opent het individuele bewijsdossier; de opgeslagen observatie en teruglink naar de matrix zijn in beide browsers gecontroleerd. API controleert cursist, klas en school; browser.mjs en performance-online.mjs. |
| KI019 | klas restrict Alfa A -> Alfa B/C server-side denied. | DEELS | Serverpolicy weigert niet-toegestane routes bij starten/opslaan; volledige Alfa B/C-catalogus niet aangesloten. |
| KI020 | individuele Alfa B override -> alleen betreffende cursist, binnen licentie. | DEELS | Individuele uitzondering geïsoleerd getest; volledige licentieproductintegratie en B-catalogus open. |
| KI021 | persoonlijke Klink-oefening -> schoolrestrict geen ongeoorloofde invloed. | DEELS | Bestaande persoonlijke/browserroutes ongewijzigd; geen nieuwe persoonlijke SQL/accountomgeving gebouwd. |
| KI022 | opdracht zonder vrijgegeven content -> 422/409, geen aanmaak. | GETEST | HOLD/niet-gepubliceerde content wordt niet uitgegeven, API weigert. |
| KI023 | HOLD-content -> nooit in oefenzoeker of aanbeveling. | GETEST | Catalogus en aanbevelingsmatching filteren publicatiestatus; test.mjs. |
| KI024 | assignment status 'finished' -> geen onbewezen mastery. | GETEST | Expliciete regeltest KI010/024/044/066/067: completion, TRAIN en hergebruikte feedback zijn geen beheersingsbewijs. Werkelijke schoolpoging blijft TRAIN; test.mjs en student-browser.mjs. |
| KI025 | groepadvies met 4/12 attention -> regel R-070 en uitleg. | DEELS | 3-en-30% met 60% dekking deterministisch getest; didactische grens nog te kalibreren. |
| KI026 | zelfde snapshot/ruleset/catalog -> exact zelfde preview. | GETEST | Identieke gesorteerde snapshot/catalogus geeft identiek regelresultaat. |
| KI027 | geen geschikte gepubliceerde les -> expliciet geen match, niet hallucineren. | GETEST | Geen match blijft null/zichtbare tekst; geen gegenereerde les. |
| KI028 | preview gewijzigd/oud -> 409 en herberekenen. | GETEST | Veranderde evidence/beleid maakt preview stale; goedkeuring geweigerd. |
| KI029 | afwijzen advies -> geen assignment. | GETEST | Reject en approve zonder expliciete opdrachten maken geen assignment. |
| KI030 | teacher school A -> geen school B-dossier. | GETEST | Cross-tenant read/write/export en samengestelde SQL-FKs getest. |
| KI031 | school-admin zonder onderwijsrecht -> alleen administratieve data. | GETEST | School-admin/support zien alleen eigen-school administratieve verwerkingsaantallen en tijdstippen via afgeschermde API/UI; onderwijsdata geweigerd. API/tenanttest en gedeeld-apparaatbrowserproef. Volledig schoolbeheer blijft apart uitbreidingswerk. |
| KI032 | gedeelde computer logout -> geen leerlingdata in cache/volgende sessie. | GETEST | Online uitloggen trekt sessie in; Back/Forward/reload toont login; volgende beheerder krijgt geen dossiers. Chromium en WebKit; geen schooldata in browseropslag. |
| KI033 | offline of netwerkstoring -> geen vals 'opgeslagen'. | GETEST | Browser netwerkverlies + retry in Chromium/WebKit; invoer blijft, geen vals succes. |
| KI034 | uitgetreden docent open tab -> volgende save 403. | GETEST | Actueel uitgetreden membership weigert volgende mutatie. |
| KI035 | 30x100 matrix -> onder 2 seconden in afgesproken stagingtestomgeving, gemeten. | DEELS | Online 30×100, 3000 TRAIN-events: API 254–362 ms; zes volledige browsernavigaties/renderingen 1560–4911 ms. Twee-secondengrens niet gehaald. Beide engines doorlopen vijf vaardigheidspagina's en bewijs. Geen gelijktijdigheids-/cold-startgarantie. |
| KI036 | bestaande Klink+Docent testregressie -> geen gewijzigde inhoud, routes of werkbladen. | GETEST | 27 bestaande Klink+Docent-regressietests opnieuw lokaal geslaagd; oorspronkelijke productbestanden en vormgevingsvloer zijn ongewijzigd. Zie evidence/mfa-klink-docent-regressions.log. |
| KI037 | geen externe AI-aanroepen; code/audit van egress en dependencies. | GETEST | Statische runtime/dependencyreview: geen nieuwe AI/ML SDK of externe fetch in servermodule. |
| KI038 | schoolwissel docent -> huidige leerlingselectie gereset. | GETEST | Schoolwissel reset geselecteerde klas/cursist in beide browserengines. |
| KI039 | schoolresultaat niet spontaan persoonlijk paspoort beschikbaar. | DEELS | Geen schooldata in bestaande persoonlijke browseropslag; werkelijk persoonlijk passport bestaat nog niet. |
| KI040 | rol wisselt midden sessie -> autorisatie telkens opnieuw server-side gecontroleerd. | GETEST | Actuele rol/membership opnieuw gelezen; servertoegang vervalt tijdens sessie. |
| KI041 | docent maakt zelf klas maar kan niet een willekeurige schoolleerling koppelen/zien zonder registrar/verified invite. | GETEST | Zelfgemaakte klas kan geen bestaande learner/account harvesten; registrar vereist. |
| KI042 | wachtende, verlopen of vervalste invitatie geeft nooit leerlinggegevens vrij. | GETEST | Wachtende, vervalste en verlopen uitnodiging openen geen dossier; exacte accountbinding en eenmaligheid in API-tests. Registratie/koppeling met echte fictieve login in twee online browsers. |
| KI043 | twee schoolklassen met verschillende routepolicies -> assignment exact eigen class; vrij oefenen vraagt geldige expliciete context. | GETEST | Twee klassen, verschillende policies, expliciete context en geïsoleerde override/uitschrijving getest. |
| KI044 | instrument met repeated same items+feedback kan niet ten onrechte MASTERED worden door twee werkdagen te spreiden. | GETEST | Herhaalde feedbackitems falen als onafhankelijke meting; regeltest. |
| KI045 | teacher note zonder rubric -> aandachtstekst maar geen mastery boost. | GETEST | Notitie zonder rubric zichtbaar; TRAIN, geen mastery boost. |
| KI046 | correction invalidates derived evidence, mastery refresh is idempotent en auditeerbaar. | GETEST | Correctie markeert oude revision-derived evidence ongeldig; idempotente verwerking. |
| KI047 | outbox retry en dubbele HTTP submit geven 1 event, 1 logisch bewijs en consistente matrix. | GETEST | Dubbele request veroorzaakt één event/outbox; gewijzigde body/context wordt geweigerd. Foutinjectie bewijst duurzame retry met vertraging, doorgaan voor andere klassen en succesvolle herverwerking. |
| KI048 | school A via export/achtergrondtaak/cache kan geen school B-resultaat lezen. | GETEST | Tenant- en klascontrole op API, CSV/onderwijsrapport, context/cache en automatische outbox-consumer. Twee-schooltest bevestigt gescheiden snapshot-hashes. Echte Cloudflare-timer verwerkt alleen correct gecontextualiseerde gebeurtenissen. |
| KI049 | ontwerp van volgende lesdatum kan weekend/geen rooster aan; geen fictieve ingeplande lesclaim. | GETEST | Geen rooster betekent UNKNOWN en zelf datum kiezen; geen fictieve geplande les. |
| KI050 | rechten vervallen tussen lesadvies-preview en goedkeuring => 409/403 en geen assignment. | GETEST | Rolwijziging tussen preview/approve geeft fout en geen opdrachten. |
| KI051 | alleen gedeeltelijk gemeten groep rapporteert meetdekking en verbergt pseudo-precisie. | GETEST | Onvolledige groep toont gemeten/actief en geen vals hele-klasadvies. |
| KI052 | beperkte leerroute met actieve open opdracht -> impactpreview en expliciete beslissing. | DEELS | Actuele impacthash, expliciete bevestiging, individuele reset en aparte bevestigde opdrachtintrekking werken. Impactoverzicht blijft beperkt; volledige causale intrekkingswizard open. |
| KI053 | automatische adviezen onthullen geen concept/HOLD-les en geven netjes geen match. | GETEST | HOLD niet zichtbaar in catalogus/advies; ontbrekende match expliciet. |
| KI054 | geen netwerk of half voltooide opslag -> expliciete pending/failure, niet vals 'bewaren gelukt'. | GETEST | Atomair opslaan, offlinefout, retry, saved/pending; tests en browserbewijs. |
| KI055 | audit/back-upverwijderingscontract en RTO/RPO runbook bestaan en getest vóór echte pilotdata. | OPEN | Schema 5: online D1 → SQLite, aparte remote D1 en PostgreSQL plus Time Travel; nieuwe wachtwoorden/MFA na herstel getest. Verwijdercontract, tombstones en ondertekende operationele RPO/RTO blijven open. |
| KI056 | WCAG 2.2 AA-acceptatie met keyboard/screenreader/focus en echte matrix-interactie. | DEELS | Axe zonder violations op geteste matrix/cursistschermen, keyboard/reflow; menselijke screenreader/WCAG-acceptatie open. |
| KI057 | privacyverantwoordelijke heeft grondslagen, DPIA, retentie en controller/processorrollen afgetekend. | OPEN | Geen juridische/privacyondertekening. Echte pilot geblokkeerd. |
| KI058 | geen generatieve AI, ML SDK of verborgen externe AI-egress in productiepad; dependencyreview. | GETEST | Geen AI-runtime/server-egress of nieuwe productdependency; statische inspectie. |
| KI059 | Klink+Docent manifest/PR en actuele bekende materialen door Inzicht-write onaangetast. | GETEST | Bestaande Klink+Docent/content/media/routes hash-ongewijzigd ten opzichte van PR-basis; regressies lokaal. |
| KI060 | content/itemversie verandert tussen evidence en report -> historie blijft aantoonbaar correct aan oorspronkelijke versie gekoppeld. | DEELS | Versie-ID/hash en herstelhistorie bewaard; volledige contentpublisher/correctie-rapportworkflow nog nodig. |
| KI061 | docent creëert voorlopige naam, observeert en heropent observatie zonder Klink-accountkoppeling; geen inzage in bestaande user-data. | GETEST | Voorlopige naam observeren en heropenen zonder account, beide browsers. |
| KI062 | twee provisional profielen met zelfde naam niet automatisch gemerged. | GETEST | Gelijke namen aparte identiteiten; API-test. |
| KI063 | gecontroleerde link provisional -> schoolmember behoudt observatieprovenance en geen privédata; rollback ontkoppelt zonder evidence leak. | GETEST | Koppelen/ontkoppelen behoudt bronhistorie; geen privéimport; schooltoegang vervalt. |
| KI064 | 3/4 van 12 cursisten met onvoldoende bewijs (25% coverage) resulteert NIET in hele-klasherhaling; geeft diagnose + kleine groep. | GETEST | 3 aandacht van 4 gemeten/12 actief levert diagnose + kleine groep, geen hele klas. |
| KI065 | groepsadvies toont noemer 4 gemeten/12 actief, niet alleen 3 aandacht/12. | GETEST | 4 gemeten/12 actief en aandacht/meetgroep zichtbaar in regelresultaat/UI. |
| KI066 | TRAIN-only oefenprestatie kan geen MASTERED-status opleveren. | GETEST | TRAIN kan nooit MASTERED opleveren; unit/API/leerlingroute. |
| KI067 | voltooide oefening met hergebruikte feedbackitems kan niet als onafhankelijke transfermeting tellen. | GETEST | Finished/repeated feedback telt niet als onafhankelijke transfermeting. |
| KI068 | volgende dag weekend en geen rooster -> label onbekend en datum kiesbaar zonder fictieve lesplanning. | GETEST | UNKNOWN roosterlabel en kiesbare datum; geen aanname dat morgen een schooldag is. |
| KI069 | docentnote bevat script/HTML of CSV-formule -> opgeslagen en geëxporteerd zonder XSS/formula-executie. | GETEST | Werkelijke online Chromium/WebKit-proef met script/HTML in observatie en spreadsheetformule in naam: tekst blijft inert na herladen, CSV neutraliseert formule, JSON bewaart originele tekst als download. evidence/security-browser.json. Geen onafhankelijke pentest geclaimd. |
| KI070 | observatie staat in database maar mastery recompute achterloopt -> UI toont saved/pending correct. | GETEST | Observatie staat duurzaam in DB; verwerking queue apart zichtbaar en idempotent. |
| KI071 | privacyretentiematrix met controller/grondslag/verwijdering incl. backups is getekend vóór echte pilot. | OPEN | Retentiematrix is concept met expliciet open controller/grondslag/termijnen/back-upverwijdering. |
| KI072 | code/docs changelog toont dat alle R1/R2-zwaardere eisen bij implementatie daadwerkelijk zijn meegenomen. | DEELS | Alle 72 eisen met bewijs/gaps en prioriteit vastgelegd; bovenstaande zwaardere eisen nog niet allemaal gerealiseerd. |
