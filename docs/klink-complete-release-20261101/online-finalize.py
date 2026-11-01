from pathlib import Path
import hashlib, json, subprocess, shutil, zipfile

folder=Path(__file__).resolve().parent
repo=folder.parents[1]
out=Path('/Users/nicoknoester/Documents/Codex/2026-10-31/een-van-de-opties-was-het/outputs/klink-compleet-20261101')
load=lambda f:json.loads((folder/f).read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
initial='33463705d0290f07b4502d98c1722aee783f9cbe'
current='d829bf9b4dea365c8197b977f5e38ddca9062adf'
browser=load('online-browser/checks.json');files=load('online-files.json');smoke=load('online-current-smoke/checks.json')
assert len(browser['checks'])==948 and sum(c['questions']for c in browser['checks'])==2912 and not browser['errors']
assert len(smoke['checks'])==20 and not smoke['errors']
assert files['release']['sourceCommit']==current and files['offeredAudioFiles']==1075 and files['withdrawnInstructionFiles']==1
rows=load('import-manifest.json')['rows']
assert all(not isinstance(e.get('wordUseId'),str) for r in rows for e in json.loads((repo/('public'+r['url'])).read_text())['exercises'])
assert all(not r['id'].startswith(('word-combinations-','suitable-reply-'))for r in rows)
for source,name in [('online-browser-native-end','browser-final'),('online-files-current','offered-files-current'),('latest-smoke-final','latest-successor-smoke')]:
    shutil.copyfile('/tmp/klink-complete-'+source+'.log',folder/'online-checks'/(name+'.log'))
summary={'application':'Klink','initialPublicationSource':initial,'currentVerifiedLiveSource':current,'currentVerifiedWorkerVersion':'d592bd5d-a54f-47be-a807-8ceb8f52a0d2','branch':'main','sourceClean':True,
 'scope':{'rounds':158,'exercises':1740,'sentenceQuestions':200,'b1FlashTexts':120,'b1Questions':240,'speakingModels':500,'a1Texts':100,'a2Texts':100,'readingQuestions':800,'choiceExplanations':3720,'newAudio':807,'female':405,'male':402},
 'checks':{'localRounds':948,'onlineRounds':948,'onlineFullRounds':316,'onlineQuestionTrials':2912,'onlineNativeAudioTrials':sum(c['nativeModelPlaybacks']for c in browser['checks']),'latestSuccessorSmoke':20,'oldProgressCases':24,'recordingCases':13,'appearanceComparisons':8,'offeredCollectionsByteIdentical':158,'offeredAudioFilesByteIdentical':1075,'retainedInstructionKeptOffline':1,'audioFilesAuditedIncludingInactiveInstruction':1076,'sourceBackupParts':4,'sourceBackupFilesFullReadback':4198,'historicalTests':{'total':201,'passed':197,'obsoleteOrMisconfigured':4}},
 'normalPublicationGate':'passed','originalSixTextsAnd24QuestionsPreserved':True,'existingProgressPreserved':True,'existingCharacterVoicesPreserved':True,'noNewAppDependencies':True,'githubActionsTriggeredByThisTask':False,'budgetRaised':False,'humanListeningReview':False,'learnerPilot':False,'physicalPhoneTest':False,
 'approvedSuccessorsPreserved':['Alfa C no-scroll','word-use'],
 'successorPreservation':'All own collection JSON, audio and progress aliases are unchanged. Shared-player additions only apply to wordUseId or word-use pack prefixes, absent from all 1740 own exercises and all 158 pack IDs. Current-source smoke and complete offered-file readback pass.',
 'audioMethod':'Whole blind ASR, PCM and embedded-tag audit. Native browser state tests use documented seeks in earlier passed rounds and natural accelerated completion in resumed checks; normal complete samples are retained. App playback settings are unchanged.'}
(folder/'online-publication.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
(folder/'online-word-use-preservation.json').write_text(json.dumps({'source':current,'all1740ExercisesOutsideWordUseBranches':True,'all158PacksOutsideWordUsePackPrefixes':True,'ownRuntimeJSONAndMediaUnchanged':True,'currentSmokeChecks':20,'currentOfferedFileChecks':1234},indent=2)+'\n')
section=f'''## 1 november 2026 — complete zinnen-, lees- en spreekoefenbanken
Deze uitbreiding is via de normale publicatieroute gepubliceerd uit schone canonieke main, bron `{initial}`, Worker `e1551ec7-ed16-4567-94d8-1247adac2477`. De gecontroleerde actuele livebron `{current}` bevat daarnaast de afzonderlijk goedgekeurde Alfa C- en woordgebruikverbeteringen; Worker `d592bd5d-a54f-47be-a807-8ceb8f52a0d2`. Beide opvolgers zijn behouden. Geen terugpublicatie van een oudere app.

Binnen de bestaande opzet staan 158 rondes met 1.740 oefeningen online: 200 A1/A2-zinnenvragen, 120 B1-flitsleesteksten met 240 vragen, 500 Zeg de zin-modellen op Alfa B/Alfa C/A1/A2/B1 en 100 A1- plus 100 A2-teksten met 800 vragen. Alle 3.720 antwoordtoelichtingen en 200 canonieke tekst-doelkoppelingen zijn meegenomen. De zes oorspronkelijke teksten, 24 vragen, bestaande zinnen-IDs, ronde-indeling en opgeslagen voortgang blijven behouden. De tweede B1-vragen zijn brongebonden aangescherpt met behoud van tekstlichamen en antwoordletters. Spreken gebruikt de bestaande model-/opname-/terugluisterwerkwijze en beoordeelt deelname, zonder automatische uitspraakscore.

807 nieuwe actieve opnamen gebruiken 405 vrouwen- en 402 mannenstemmen. Bestaande personagestemmen blijven behouden. Alle 1.076 gekoppelde/voor herstel behouden audiobestanden zijn volledig gedecodeerd en op ingebedde Taalroute-merkgegevens en inhoud gecontroleerd. De 1.075 werkelijk aangeboden opnamen zijn volledig bytegelijk teruggelezen, evenals alle 158 rondebestanden. Eén bestaande instructie blijft conform Nico’s afspraak van 17 oktober afgeschermd. Provideroriginelen en afgewezen takes zijn afzonderlijke herstelgegevens, geen cursistdownloads.

Lokaal en online slagen 948 rondecontroles, 2.912 vraagproeven en 2.814 native afspeelcontroles. Online slagen 24 herstelgevallen met oude gedeeltelijke/afgeronde voortgang en dertien opname-/microfooncontroles. Acht vergelijkingen behouden de geometrie en stijlen van de eigen spelers. De nieuwste bron is aanvullend met twintig gerichte browsergevallen gecontroleerd. De woordgebruikuitbreiding raakt uitsluitend haar eigen kenmerken en pakketprefixen; deze ontbreken in alle 1.740 eigen oefeningen en 158 pakketten. De complete JSON-, audio- en voortgangsgegevens blijven gelijk. De vijf oorspronkelijke releasekenmerken blijven gelijk. Versnelde zoekproeven die online hingen zijn als diagnostiek bewaard; normale opnamen en de volledige eindcontrole met natuurlijk afspelen slagen. De app houdt zijn bestaande afspeeltempo’s.

De gewone volledige publicatiepoort, typen, bouw, gerichte lint en bron-/menu-/spelertests slagen. De brede historische selectie heeft 197 van 201 proeven groen; drie verouderde exacte momentopnamen en één onbedoeld meegepakte browserproef met een oude lokale testpoort zijn apart verklaard. Geen onafhankelijke menselijke luisterronde, cursistenpilot of fysieke telefoonproef geclaimd. Geen nieuwe appafhankelijkheden, GitHub Actions of betaald budget toegevoegd; alle zware controles lokaal uitgevoerd.

Brongebonden opdracht: `docs/klink-owner-release-complete-20261101.json`. Dossier: `docs/klink-complete-release-20261101/`, inclusief `online-publication.json`, de correctie op de aanvankelijke Worker-lijstselectie, oorspronkelijke bronnen, exacte stem-ID’s en metadata-/transcriptiecontroles. Vier Drive-bronarchieven met 4.198 bestanden zijn volledig teruggelezen; index `1_xVzzmM_yRUii6SHzg89zNnZb1wUnYAU`. Het definitieve publicatie-/herstelarchief bevat ook de goedgekeurde opvolgers en wordt in `final-backup.json` vastgelegd. Alles staat in de bestaande Drive-projectmap `1MA6t7naBAJP-fqlhDIvSBuaw8G4okvZR`.

'''
publication=repo/'PUBLICATIE-ACTUEEL.md';publication.write_text(section+publication.read_text())
report=f'''KLINK — PUBLICATIEOVERZICHT, 1 NOVEMBER 2026

Online: https://klink.taalroute.nl

Beschikbaar binnen de bestaande opzet:
- 200 A1/A2-zinnenvragen;
- 120 B1-flitsleesteksten met 240 vragen;
- 500 Zeg de zin-opdrachten op Alfa B, Alfa C, A1, A2 en B1;
- 100 A1- en 100 A2-teksten met 800 vragen.

Samen: 158 rondes en 1.740 oefeningen, met 3.720 antwoordtoelichtingen.
807 nieuwe voorlees- en voorbeeldopnamen zijn gekoppeld: 405 vrouwen- en 402 mannenstemmen. Bestaande personagestemmen blijven behouden. Gesproken instructies blijven volgens de eerdere afspraak uitgeschakeld.

Bestaande inhoud, de zes oorspronkelijke teksten en 24 vragen, uiterlijk en opgeslagen voortgang zijn behouden. Ook de intussen apart goedgekeurde Alfa C- en woordgebruikverbeteringen blijven online.

Controles: lokaal en online 948 rondeproeven, 2.912 vraagproeven en 2.814 native afspeelcontroles. Oude voortgang slaagt in 24 herstelgevallen; opnemen/terugluisteren in dertien controles. Alle 158 rondebestanden en 1.075 aangeboden opnamen zijn volledig bytegelijk teruggelezen, inclusief Taalroute-merkgegevens. De actuele opvolger slaagt aanvullend in twintig gerichte browserproeven.

Herstelmap: https://drive.google.com/drive/folders/1MA6t7naBAJP-fqlhDIvSBuaw8G4okvZR
Bronarchiefindex: https://drive.google.com/file/d/1_xVzzmM_yRUii6SHzg89zNnZb1wUnYAU/view
Voor herstel horen de vier brondelen en het definitieve publicatie-/herstelarchief samen. Bewaar de ZIP’s met hun eigen manifesten. Het laatste archief bevat ook de actuele goedgekeurde opvolgers. Provideroriginelen en afgewezen takes zijn interne herstelgegevens, geen cursistdownloads.

Open: een onafhankelijke menselijke luisterronde, cursistenpilot en proef op een fysieke telefoon. Automatische controles vervangen deze niet. Vier oudere testmeldingen staan apart in het dossier; de tests van deze uitbreiding en de gewone publicatiepoort slagen.

Eerste publicatie van dit pakket: {initial}.
Actuele gecontroleerde online bron: {current}.
'''
(out/'Klink-publicatieoverzicht.txt').write_text(report);(folder/'online-overzicht.txt').write_text(report)
owner=json.loads((repo/'docs/klink-owner-release-complete-20261101.json').read_text())
names={str(f.relative_to(repo))for f in folder.rglob('*')if f.is_file() and str(f.relative_to(repo))not in owner['evidenceFiles'] and f.name!='final-backup.json' and '__pycache__'not in f.parts}
names.update(subprocess.check_output(['git','diff','--name-only',initial,'HEAD'],cwd=repo,text=True).splitlines())
names.update(['PUBLICATIE-ACTUEEL.md','docs/klink-owner-release-complete-20261101.json'])
hashes={n:sha(repo/n)for n in sorted(names)if (repo/n).is_file()}
manifest={'initialPublication':initial,'verifiedLive':current,'restoreOrder':'Canonical baseline fcee5727, then all four source ZIPs, then this final archive including approved successors. Preserve the per-ZIP manifests inside their ZIPs.','sourceBackup':load('backup.json'),'files':hashes}
target=out/'Klink-compleet-definitief-publicatie-en-herstel.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=3)as z:
    for n in hashes:z.write(repo/n,n)
    z.writestr('FINAL-RESTORE-MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(target)as z:
    assert z.testzip()is None
    for n,h in hashes.items():assert hashlib.sha256(z.read(n)).hexdigest()==h
receipt={'localFile':str(target),'sha256':sha(target),'bytes':target.stat().st_size,'members':len(hashes)+1,'zipIntegrity':True,'files':hashes}
assert receipt['bytes']<104857600
(out/'definitief-archief-lokaal.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in receipt.items()if k!='files'}))
