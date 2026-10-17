// Internal editorial inventory only; never imported by the learner application.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { createMixedRound } from '../lib/mixed-practice.ts';
import { connectedContent } from '../lib/connected-content.ts';
import { groupActivities, groupExercises } from '../lib/group-practice.ts';

const definitions = [
  ['whole-group','Gezamenlijk woordenoverzicht als vertrekpunt','partial',['model'],'Woordoverzicht bestaat, maar een onderdeel opent bij Lessen. Niet alle oefenvormen gebruiken de volledige woordgroep.'],
  ['word-model','Foto, woord en hele woordopname','works',['model'],'In alle onderdelen gekoppeld. Aanwezigheid is geen nieuwe menselijke mediagoedkeuring.'],
  ['sound-model','Afzonderlijke klanken beluisteren','missing',[],'Losse, goedgekeurde klankmodellen ontbreken; t blijft geparkeerd. Geschreven segmenten zijn geen klankopnamen.'],
  ['sound-contrast','Klanken vergelijken, positie en synthese','missing',[],'Een letter aanvullen in een heel woord is niet hetzelfde leerdoel.'],
  ['same-word','Hetzelfde woord vinden','partial',['same-word'],'Gekoppeld waar de bestaande kleine leesstap minstens twee passende woorden heeft.'],
  ['heard-word','Horen en geschreven woord kiezen','partial',['heard-word'],'In kleine stappen niet overal beschikbaar; uitbreiding moet alle geschikte groepswoorden als doel gebruiken.'],
  ['heard-image','Horen en foto kiezen','partial',['heard-image'],'Alleen eenduidige betekenisbeelden. Niet elk abstract woord heeft een toetsbaar beeld.'],
  ['read-image','Lezen en foto kiezen','partial',['word-image'],'Zelfstandig lezen apart van hulp registreren; de lokale mix doet dat al.'],
  ['pairs','Meerdere woorden en beelden koppelen','partial',['word-image-match'],'Bestaande tikspeler; lokale mix koppelt groepswoorden. Niet gelijk aan een complete sleepwerkbladroutine.'],
  ['build-model','Woord bouwen door aantikken met model','works',['word-build'],'Bestaande speler in alle onderdelen; oefenen met model is geen zelfstandig lezen.'],
  ['build-recall','Woord aantikken zonder zichtbaar antwoord','works',['recall-word'],'Hele woordopname als stimulus; losse t niet vereist.'],
  ['build-drag','Dezelfde woordbouw via slepen én aantikken','partial',['word-build','recall-word'],'Aantikken bestaat. Drag-and-drop en expliciete bestemmingskeuze ontbreken.'],
  ['build-sheet','Woordbouw op een werkblad met meerdere woorden','missing',[],'Geen aangesloten meerwoordswerkblad; een reeks losse kaarten is niet hetzelfde.'],
  ['copy','Woord natypen','works',['copy-word'],'In alle onderdelen; toetsenbordvaardigheid niet verwarren met taalbeheersing.'],
  ['dictation','Hele woord horen en typen','works',['word-dictation'],'Geen losse klankopnamen nodig. Geen antwoord vooraf tonen.'],
  ['letter-gap','Ontbrekende schrijfwijze aanvullen','works',['missing-grapheme'],'Gekoppeld in alle onderdelen; gebruik de eigen voorbereide leeseenheden.'],
  ['word-bingo','Woordbingo','missing',[],'Oude bordcomponent is niet aangesloten en toont antwoordsteun; dat telt niet als werkende bingo.'],
  ['image-bingo','Beeldbingo','missing',[],'Zelfde ontbrekende aansluiting; alleen unieke, betekenisgeschikte foto’s gebruiken.'],
  ['memory','Memory rond dezelfde woordgroep','partial',['memory'],'In twaalf onderdelen gekoppeld op leesstapniveau; nog geen volledige groepsdekking.'],
  ['cards','Woordkaarten','works',['word-card'],'Bestaande kaarten in alle onderdelen; kaarten bekijken is geen toets.'],
  ['speak-word','Woord inspreken en terugluisteren','partial',['repeat-word'],'Opnamefunctie is geen uitspraakbeoordeling of complete spreekroute.'],
  ['speak-sentence','Een volledige zin inspreken en terugluisteren','missing',[],'Woordopnamen en dialoogmodellen bestaan; geen aangesloten zinnenspreekreeks.'],
  ['paper-word','Woord op papier schrijven','partial',['write-word'],'Opdracht/model bestaat; schrijfkwaliteit vraagt afzonderlijke beoordeling.'],
  ['letter-formation','Gerichte lettervorming','missing',[],'Geen complete aangesloten lettertrajectenreeks met passende feedback.'],
  ['sentence-model','Zinnen beluisteren en meelezen','partial',['connected-sentence','listen-sentence'],'Modellen aanwezig, maar niet gelijk aan actief een zin herkennen of begrijpen.'],
  ['sentence-meaning','Betekenisvragen bij gehoorde zinnen','partial',['sentence-question'],'Beperkte inhoud in vier onderdelen; geen volledige reeks per woordgroep.'],
  ['find-sentence','Zoek de zin als reeks','missing',[],'Bestaande zinnen/audio hergebruiken; doelzin en verdedigbare afleiders nog koppelen.'],
  ['build-sentence','Woorden tot een zin leggen','missing',[],'Een generieke volgordespeler is nog geen aangesloten zinsbouwreeks.'],
  ['sentence-dictation','Gehoorde zin typen of opschrijven','missing',[],'Zinsopnamen zijn aanwezig; taak, antwoordvarianten en beoordeling niet aangesloten.'],
  ['reading','Tekst lezen en informatie vinden','partial',['connected-text'],'Teksten en bronvragen aanwezig, maar de cursistspeler is vooral luisteren/meelezen.'],
  ['dialogue','Gesprek begrijpen en zelf een rol spreken','partial',['connected-dialogue'],'Beurtopnamen en tekst aanwezig; rolproductie/reactiekeuzes ontbreken.'],
  ['forms','Functioneel formulier of bericht invullen','missing',[],'Wel ontworpen in de bronvoorraad; geen complete huidige cursisttaak.'],
  ['sorting','Sorteren, domino en volgordespellen','missing',[],'Technische componenten/bronconfiguraties tellen niet als aangesloten actuele oefenreeks.'],
  ['repeat','Gerichte herhaling over oefenvormen en sessies','partial',['recall-word'],'Vaste herhaling en lokale mix bestaan; nog geen complete persoonlijke herhaalplanning.'],
  ['diagnostic','Instap en voortgang per vaardigheid','partial',[],'Routevoortgang en enkele antwoorden bestaan; vrije oefeningen sturen niet overal dezelfde meetgegevens door.'],
  ['pace','Verplichte tijdwedstrijd bij de instap','different',[],'Geen verplichte timer of snelheidsscore; latere automatisering kan apart.'],
  ['paced-reading','Optionele leesautomatisering met passende temposteun','missing',[],'Nog geen complete aangesloten tempoleesreeks; niet verwarren met de bewuste keuze tegen verplichte tijdsdruk.'],
  ['junior','Een aparte Junior-productlijn','different',[],'Geen aparte productlijn kopiëren; relevante leesfuncties binnen de eigen volwassen taalroute plaatsen.'],
];
const labels={works:'Werkt in Klink',partial:'Bestaat gedeeltelijk',missing:'Ontbreekt',different:'Bewust anders'};
const implemented = {
  'build-sentence': ['partial', ['sentence-build'], 'Gehoorde zinsvolgorde opgebouwd met bestaande woorden, audio en sleep-/tikspeler. Geen onafhankelijke grammaticaliteitstoets; instructie-audio en combinatievrijgave open.'],
  'sound-contrast': ['partial', ['sound-compare'], 'Bestaande woordparen met één voorbereide klank als verschil, met echte audio en identieke vergelijkingen. Losse klankpositie en synthese blijven open.'],
  'reading': ['partial', ['text-question','text-evidence'], '180 bronvragen en 156 exacte bewijszinnen aangesloten. Vraag-/antwoordaudio en vrijgave blijven open; geen automatische zelfstandige leesclaim.'],
  'dialogue': ['partial', ['dialogue-question','dialogue-role'], '120 bronvragen en rolbeurten bij bestaande gesprekken. Vrije reactie vraagt zelf-/docentcontrole, geen automatische uitspraakgoedkeuring.'],
  'forms': ['partial', ['functional-message','functional-form'], '120 bestaande berichten met voorbeeld, criteria en eenvoudige berichtkaart. Geen volledige formulierenlijn; inhoudelijke vrijgave blijft open.'],
  'whole-group': ['works', ['meet'], 'Het onderdeel opent bij alle woorden; hervatten van een les blijft behouden. De eigen oefenkeuzes werken op de hele woordgroep.'],
  'heard-word': ['works', ['hear-word','hear-match'], 'Groepsreeksen en geluid-woordkoppeling aangesloten; alle woorden met audio komen als doel aan bod. Nieuwe koppelinstructie wacht op opname.'],
  'heard-image': ['works', ['listen'], 'Groepsreeks aangesloten; contextbeelden niet als toetsbaar betekenisbeeld gebruiken.'],
  'read-image': ['works', ['read'], 'Groepsreeks aangesloten; hulpgebruik wordt apart geregistreerd.'],
  'pairs': ['works', ['match'], 'Meerdere woorden en foto’s via slepen of aantikken; geen nieuwe inhoudsgoedkeuring.'],
  'build-drag': ['works', ['build-model','build'], 'Dezelfde tegels via slepen, tikken of toetsenbord; doelvak kiezen en per letter herstellen.'],
  'build-sheet': ['works', ['worksheet','worksheet-heard'], 'Meerdere woorden per blad, met/zonder model. Vier rijen per scherm; alle geschikte groepswoorden komen aan bod. Hervatten per blad, niet per losse tegel.'],
  'word-bingo': ['partial', ['word-bingo'], 'Speler aangesloten: audio per beurt, stabiele kaart, geen antwoordlek, alle doelwoorden. Nieuwe instructieopname en combinatievrijgave open.'],
  'image-bingo': ['partial', ['image-bingo'], 'Fotobingo aangesloten voor eenduidige beelden. Nieuwe instructieopname en combinatievrijgave open.'],
  'memory': ['works', ['memory'], 'Dezelfde woordgroep verdeeld over kleine parenborden; elke geschikte betekenis komt terug.'],
  'speak-sentence': ['partial', ['sentence-speak'], 'Bestaande zinnen nazeggen/opnemen aangesloten. Nieuwe instructieopname en uitspraakbeoordeling open.'],
  'letter-formation': ['partial', ['write-letter'], 'Geschreven lettermodel op papier oefenen aangesloten; geen lettertraject of handschriftbeoordeling. Geen afgekeurde klankaudio gebruikt.'],
  'find-sentence': ['partial', ['find-sentence'], 'Reeks met bestaande zinnen die in één woord verschillen. Geen begripsmeting; instructie-audio en combinatievrijgave open.'],
  'sentence-dictation': ['partial', ['sentence-dictation'], 'Bestaande zinsaudio naar invoer en antwoordcontrole aangesloten; nieuwe instructieopname en combinatievrijgave open.'],
  'paced-reading': ['partial', ['read-series'], 'Optionele zes/negen seconden, standaard eigen tempo, pauze bij verborgen tab of afspelen. Geen snelheidsscore; instructieopname open.'],
};
const rows=definitions.map(([id,title,status,modes,note])=>{
  const built=implemented[id];
  const sectionIds=built?packs.filter(pack=>built[1].some(activity=>groupExercises(pack,activity).length)).map(pack=>pack.id):packs.filter(p=>p.exercises.some(e=>modes.includes(e.mode))).map(p=>p.id);
  return {id,title,status:built?.[0]??status,label:labels[built?.[0]??status],modes,note:built?.[2]??note,sectionIds,groupActivities:built?.[1]??[]};
});
assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
for(const r of rows){assert(labels[r.status]);if(r.status==='works')assert.equal(r.sectionIds.length,packs.length);}
const sections=packs.map(p=>({id:p.id,title:p.title,wordIds:p.words.map(w=>w.id),words:p.words.map(w=>w.word),routeIds:p.lessons.map(l=>l.id),modes:Object.fromEntries([...new Set(p.exercises.map(e=>e.mode))].sort().map(m=>[m,p.exercises.filter(e=>e.mode===m).length])),mixed:Object.fromEntries(['listen','read','match','build'].map(mode=>{const rounds=createMixedRound(p,mode,123);return [mode,{rounds:rounds.length,targetWordIds:[...new Set(rounds.flatMap(e=>e.targetWordIds??[]))]}]}))}));
const release=JSON.parse(readFileSync('data/klink-mixed-practice-release.json'));
for (const section of sections) {
  const pack=packs.find(pack=>pack.id===section.id);
  section.groupActivities=groupActivities.map(activity=>{const exercises=groupExercises(pack,activity.id);return {id:activity.id,label:activity.label,items:exercises.length,targetWordIds:[...new Set(exercises.flatMap(item=>item.targetWordIds??[]))]};});
}
assert.equal(release.publicationApproved,false,'Recheck live comparison after release status changes');
const checkedLive = {checkedOn:'2026-10-17',sourceCommit:'10affc05a167a7ebba4620ce0c368346f8fc0244',sections:15,allPracticeButton:false,evidence:'Read /release.json and opened first section in a fresh browser session'};
const evidencePath='outputs/diglin-comparison-20261017/diglin-menu-evidence.json';
const evidence=existsSync(evidencePath)?JSON.parse(readFileSync(evidencePath)):undefined;
const categories=evidence?.categories??[];
const abc=categories.find(c=>c.category==='ABC');
const byCapability=new Map(rows.map(r=>[r.id,r]));
const capabilityForEntry=(entry)=>{
  const a=entry.application,label=entry.label.toLocaleLowerCase('nl');
  if(a==='afbeeldingen')return label.includes('zin')?'find-sentence':'pairs';
  if(a==='uitspraak')return label.includes('zin')?'speak-sentence':'speak-word';
  return ({t1_de_woorden:'whole-group',sleep_de_letters_per_woord:'build-drag',t2_sleep_de_letters:'build-sheet',t3_sleep_de_woorden:'heard-word',t4_vorm_de_woorden:'build-drag',t6_luister_en_typ:'dictation',bingo_v2:'word-bingo',beeld_bingo:'image-bingo',luister_en_kies_het_woord:'heard-word',kies_plaatje:'heard-image',trefwoorden_v2:'sentence-model',tekstlezen_v2:'reading',zinnen_v2:'sentence-dictation',letters_schrijven_v2:'letter-formation',dictee_schrijven:'paper-word',tempolezen_tekst_v2:'paced-reading'})[a];
};
const lists=Array.from({length:16},(_,i)=>{
  const group=abc?.items.find(g=>new RegExp(`^Lijst ${i+1}\\b`).test(g.title));
  const normalizeLabel=e=>e.label.trim().replace(/^[-\s]+/,'').replace(/\s+/g,' ');
  const first=abc?.items.find(g=>/^Lijst 1\b/.test(g.title));
  const missingComparedToList1=group?(first?.entries??[]).filter(e=>!group.entries.some(f=>normalizeLabel(e)===normalizeLabel(f))).map(e=>e.label):[];
  return {number:i+1,headingObserved:true,exerciseMenuVerified:Boolean(group?.entries.length),choiceCount:group?.entries.length??null,missingComparedToList1,fullyPlayed:false,comparisons:(group?.entries??[]).map(entry=>{
    const capabilityId=capabilityForEntry(entry),capability=byCapability.get(capabilityId);
    assert(capability,`Review unclassified ABC function ${entry.label} (${entry.application})`);
    return {referenceLabel:entry.label,application:entry.application,capabilityId,status:capability.status,label:capability.label,reason:capability.note,sectionIds:capability.sectionIds,scope:'General interaction comparison, not copied source content or complete player equivalence'};
  })};
});
const allABC=lists.every(l=>l.exerciseMenuVerified);
const domainNames=['ABC','Junior','Schrijven','Lezen','Klanken','Luisteren','Spreken',"Thema's",'Woorden','Regels','Grammatica','Extra'];
const domains=domainNames.map(title=>{const c=categories.find(c=>c.category===title);return {title,navigationObserved:true,currentSubmenusVisited:Boolean(c),groups:c?.items.length??null,exerciseLinks:c?.items.reduce((n,g)=>n+g.entries.length,0)??null,otherLinks:c?.items.reduce((n,g)=>n+(g.otherLinks?.length??0),0)??null,unresolvedGroups:c?.items.filter(g=>!g.entries.length&&!g.otherLinks?.length).map(g=>g.title)??[],applicationTypes:[...new Set(c?.items.flatMap(g=>g.entries.map(e=>e.application))??[])].sort()}});
const menuComplete=allABC&&domains.every(d=>d.currentSubmenusVisited&&!d.unresolvedGroups.length);
const diglin={
  scope:'All sixteen ABC lists and the eleven adjoining domains',
  completion:menuComplete?'menu-inventory-complete-player-audit-open':'menu-inventory-partial',
  observedAt:evidence?.observedAt??null,
  evidenceLimit:'Logged-in visible menu inspection after reauthentication. Counts describe links/containers, not independent learning functions or tested exercises. Audio, correctness feedback, full sequences and assessments not exhaustively tested.',
  lists,domains,
  statusRule:'The four Klink implementation statuses classify our own capabilities. An unverified DigLin list gets null, not an invented missing or works status.',
};
const result={date:'2026-10-17',scope:'Internal editorial inventory; no app implementation or publication in this pass',klink:{live:checkedLive,local:{sections:sections.length,routes:sections.reduce((n,p)=>n+p.routeIds.length,0),wordMeanings:new Set(sections.flatMap(p=>p.wordIds)).size,spellings:new Set(sections.flatMap(p=>p.words)).size,connectedContent:Object.fromEntries(['sentence','text','dialogue'].map(kind=>[kind,connectedContent.filter(c=>c.kind===kind).length])),mixedPublicationApproved:release.publicationApproved},sections,capabilities:rows},diglin};
const dir='outputs/diglin-comparison-20261017';mkdirSync(dir,{recursive:true});
writeFileSync(`${dir}/comparison.json`,JSON.stringify(result,null,2)+'\n');
assert(existsSync(`${dir}/comparison.json`));
assert.equal(lists.length,16);assert.equal(domains.length,12);
console.log(`${rows.length} capability checks; ${sections.length} sections; ${result.klink.local.routes} routes. DigLin: ${diglin.completion}.`);
