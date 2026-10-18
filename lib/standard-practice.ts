import { klinkContexts } from './klink-context.ts';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import type { PackageDefinition, PackageExercise } from './package-content';
import { contentById, contentReadingConditions } from './connected-content.ts';
import { orderedChoices } from './extended-practice.ts';
import type { BranchTask, SortTask, HotspotTask } from './standard-player-contract';

export const standardActivities = [
  { id: 'word-sort', label: 'Sorteer de woorden', category: 'Kiezen', icon: 'grid' },
  { id: 'context-order', label: 'Zet de stappen op volgorde', category: 'Zinnen en verhalen', icon: 'puzzle' },
  { id: 'situation-point', label: 'Wijs aan in de situatie', category: 'Zinnen en verhalen', icon: 'image' },
  { id: 'practice-branch', label: 'Wat doe je nu?', category: 'Zinnen en verhalen', icon: 'chat' },
] as const;
export type StandardActivity = typeof standardActivities[number]['id'];
export const standardMediaNeeds = [
  { id: 'klink-standard-sort-instruction', kind: 'instruction-audio', status: 'paused', activity: 'word-sort' },
  { id: 'klink-standard-mark-instruction', kind: 'instruction-audio', status: 'paused', activity: 'text-evidence' },
  { id: 'klink-standard-gap-instruction', kind: 'instruction-audio', status: 'paused', activity: 'verb-choice' },
  { id: 'klink-standard-order-instruction', kind: 'instruction-audio', status: 'paused', activity: 'context-order' },
  { id: 'klink-standard-table-situation', kind: 'existing-approved-scene', status: 'available-existing', activity: 'situation-point' },
  { id: 'klink-standard-point-instruction', kind: 'instruction-audio', status: 'paused', activity: 'situation-point' },
  { id: 'klink-standard-branch-instruction', kind: 'instruction-audio', status: 'paused', activity: 'practice-branch' },
  { id: 'klink-standard-bank-branch-speech', kind: 'branch-speech', status: 'paused', activity: 'practice-branch' },
];
const base = { contractVersion: '1.0', sourceStatus: 'concept', combinationReview: 'open', independentReading: false, reviewEligible: false, requiresAudio: false, access: 'teacher-supported', assessment: 'answer' as const, manualAdvance: true };
const wordsById = new Map(curriculum.words.map(word => [word.id, word]));
const starterIds = ['mat', 'tas', 'jas', 'man', 'map', 'pan'].map(word => `klink-woord-${word}`);
export function standardExercises(pack: PackageDefinition, activity: StandardActivity, seed = 1): PackageExercise[] {
  if (activity === 'situation-point') {
    return sceneTargets.flatMap<PackageExercise>(definition => {
      const scene = klinkContexts.find(item => item.id === definition.scene)!;
      const word = pack.words.find(item => item.word === definition.word);
      if (!word || scene.humanReview !== 'approved' || !scene.image) return [];
      const sources = pack.exercises.filter(item => item.wordId === word.id || (Array.isArray(item.wordIds) && item.wordIds.includes(word.id)));
      if (!sources.length) return [];
      const task: HotspotTask = { kind: 'hotspot', image: { src: scene.image, altText: 'Een plaatje met spullen. Kies een plek met een nummer.' }, imageReview: 'approved', regions: sceneRegions[scene.id].filter(region => scene.id !== 'situatie-map' || region.id !== (definition.region === 'pen' ? 'folder' : 'pen')), correctRegionIds: [definition.region], help: definition.help };
      return [{ ...base, exerciseId: `${pack.id}:group:situation-point:${scene.id}${definition.word === 'map' ? '' : ':' + word.id}`, componentId: 'KLINK-STANDARD', mode: activity, groupActivity: activity, title: `Wijs ${definition.article} ${definition.word} aan.`, activityTypeId: 'BB-07', phase: 'use',
        contextId: scene.id, collectionVariant: word.id, sourceContentIds: [scene.id, word.id], sourceExerciseId: sources[0].exerciseId, sourceLessonIds: [...new Set(sources.map(item => item.lessonId).filter(Boolean))], lessonId: sources[0].lessonId,
        targetWordIds: [word.id], readingConditions: { preparation: scene.preparation, independentReading: false }, objective: `BB-07:${scene.id}:${word.id}`, standardTask: task,
        instructionNeedId: 'klink-standard-point-instruction', feedback: task.help, imageReviewRecord: 'docs/KLINK-STANDAARDSPELERS-INTEGRATIE-20261018.md',
      }];
    });
  }
  if (activity === 'word-sort') {
    const extra = letterSortExercises(pack, seed);
    if (!starterIds.every(id => pack.words.some(word => word.id === id))) return extra;
    const words = starterIds.map(id => pack.words.find(word => word.id === id)!);
    const definitions = [
      { id: 'initial-m', title: 'Begint het woord met m?', basis: 'letter' as const, labels: ['m', 'Andere letter'], category: (word: string) => word.startsWith('m'), help: 'Kijk naar de eerste letter van het woord.' },
      { id: 'final-s', title: 'Eindigt het woord op s?', basis: 'spelling' as const, labels: ['s aan het eind', 'Andere letter'], category: (word: string) => word.endsWith('s'), help: 'Kijk naar de laatste letter van het woord.' },
      { id: 'person-object', title: 'Een mens of een ding?', basis: 'meaning' as const, labels: ['Mens', 'Ding'], category: (word: string) => word === 'man', help: 'Is het een mens? Of is het een ding? Vraag je docent om hulp.' },
    ];
    return [...definitions.map<PackageExercise>((definition, index) => {
      const task: SortTask = { kind: 'sort', basis: definition.basis, categories: definition.labels.map((label, at) => ({ id: String(at), label })), items: orderedChoices(words.map(word => ({ id: word.id, label: word.word, categoryId: definition.category(word.word) ? '0' : '1' })), seed + index), help: definition.help };
      const source = pack.exercises.find(exercise => exercise.wordId === words[0].id);
      return { ...base, exerciseId: `${pack.id}:group:word-sort:${definition.id}`, componentId: 'KLINK-STANDARD', mode: activity, groupActivity: activity, title: definition.title, phase: 'recognize', instructionNeedId: 'klink-standard-sort-instruction',
        targetWordIds: starterIds, sourceExerciseId: source?.exerciseId, sourceLessonIds: pack.lessons.filter(lesson => lesson.words.some(word => words.some(w => w.word === word))).map(lesson => lesson.id),
        readingConditions: words.map(word => curriculum.words.find(item => item.id === word.id)!.preparation), objective: `${definition.basis === 'meaning' ? 'BB-02' : 'WO-07'}:${definition.id}`, standardTask: task,
        feedback: definition.help, distractorReason: 'Dezelfde zes voorbereide woorden; de gekozen betekenis of letterpositie bepaalt de categorie. Geen klankonderscheid.',
      };
    }), ...extra];
  }
  const sourceIds = activity === 'context-order'
    ? [...new Set(pack.exercises.map(item => String(item.contextId)))].filter(id => ['text', 'dialogue'].includes(contentById.get(id)?.kind ?? ''))
    : ['klink-dialogue-c3ecb2965e20ece2', ...Object.keys(branchContinuations)];
  return sourceIds.flatMap<PackageExercise>(id => {
    const source = pack.exercises.find(exercise => exercise.contextId === id);
    const content = contentById.get(id), lesson = pack.lessons.find(lesson => lesson.id === source?.lessonId);
    if (!source || !content || !lesson) return [];
    const common: PackageExercise = { ...base, exerciseId: `${pack.id}:group:${activity}:${id}`, mode: activity, groupActivity: activity, componentId: 'KLINK-STANDARD', title: standardActivities.find(a => a.id === activity)!.label,
      phase: 'use', contextId: id, sourceContentIds: [id], sourceExerciseId: source.exerciseId, sourceLessonIds: [...new Set(pack.exercises.filter(item => item.contextId === id).map(item => item.lessonId!))], lessonId: lesson.id, sourceLevel: content.sourceLevel,
      targetWordIds: (source.wordIds as string[]).filter(id => pack.words.some(word => word.id === id)), readingConditions: contentReadingConditions(content, lesson), objective: `${activity}:${id}`, contentTitle: content.title,
    };
    if (activity === 'context-order') {
      const lines = content.kind === 'dialogue' ? content.blocks.map(b => ({ id: b.id, text: `${'speaker' in b ? b.speaker + ': ' : ''}${b.text}` })) : (content.text.match(/[^.!?]+[.!?]+/g) ?? []).map((text, at) => ({ id: `${id}:line-${at}`, text: text.trim() }));
      if (lines.length < 3 || lines.length > 6 || content.text.length > 650 || new Set(lines.map(line => line.text)).size !== lines.length) return [];
      return [{ ...common, componentId: 'ALF-CMP-013', activityTypeId: content.kind === 'dialogue' ? 'PR-04' : 'TE-03', instructionNeedId: 'klink-standard-order-instruction', title: 'Kijk bij Help naar de tekst. Zet de zinnen in dezelfde volgorde.',
        items: orderedChoices(lines.map(line => ({ itemId: line.id, text: line.text })), seed), targetOrderIds: lines.map(line => line.id), acceptedOrderIds: [], helpWord: lines.map(line => line.text).join('\n'),
        feedback: 'Kijk bij Help naar de tekst. Welke zin komt eerst? Met Eén terug haal je de laatste zin weg.',
        distractorReason: 'Alleen de oorspronkelijke bronvolgorde wordt gevraagd; andere gesprekssituaties zijn geen fout taalgebruik.',
      }];
    }
    if (id in branchContinuations) {
      const task = sourceBranch(id);
      if (!task) return [];
      return [{ ...common, activityTypeId: 'PR-05', assessment: 'participation', requiresExplicitCompletion: true, instructionNeedId: 'klink-standard-branch-instruction', standardTask: task, objective: `PR-05:${id}:gevolgen-bespreken`, additionalReadingCondition: 'Nieuwe keuzereacties en gevolgen met de docent voorbereiden.', feedback: 'Praat met je docent over je keuze.' }];
    }
    const task: BranchTask = { kind: 'branch', start: 'seat', help: 'Kies wat je wilt zeggen. Kijk wat er dan gebeurt. Met Terug kun je iets anders kiezen.', nodes: [
      { id: 'seat', prompt: 'Kofi vraagt: Mag ik naast je op de bank zitten? Jij bent Daan.', choices: [
        { id: 'space', label: 'Ja, er is plaats.', consequence: 'Kofi kan erbij. Hij vraagt: Zal ik de tas op de grond zetten?', next: 'bag' },
        { id: 'occupied', label: 'Hier zit straks iemand anders.', consequence: 'Kofi zoekt een andere plek. Hoe help je hem?', next: 'other-seat' },
      ] },
      { id: 'bag', prompt: 'Kofi wil de tas op de grond zetten. Wat zeg je?', choices: [
        { id: 'floor', label: 'Graag, dank je.', consequence: 'Kofi zet de tas op de grond. Nu kunnen jullie naast elkaar zitten.', next: null },
        { id: 'hold', label: 'Ik houd de tas zelf vast.', consequence: 'Jij houdt de tas vast. De plek naast je is vrij.', next: null },
      ] },
      { id: 'other-seat', prompt: 'Naast je komt iemand anders zitten. Wat zeg je tegen Kofi?', choices: [
        { id: 'look', label: 'Zullen we samen een andere plek zoeken?', consequence: 'Jullie kijken samen waar plaats is.', next: null },
        { id: 'check', label: 'Ik kijk even of de ander nog komt.', consequence: 'De ander komt niet. Kofi kan blijven. Hij vraagt: Mag de tas op de grond?', next: 'bag' },
      ] },
    ] };
    return [{ ...common, activityTypeId: 'PR-05', assessment: 'participation', requiresExplicitCompletion: true, instructionNeedId: 'klink-standard-branch-instruction', standardTask: task, objective: `PR-05:${id}:gevolgen-bespreken`, feedback: 'Praat met je docent over je keuze.' }];
  });
}

// Each board stays within one existing list and uses visible letters, never inferred sounds.
function letterSortExercises(pack: PackageDefinition, seed: number): PackageExercise[] {
  if (pack.id === 'groep-1') return [];
  const result: PackageExercise[] = [];
  for (const position of ['first', 'last'] as const) {
    const letter = (word: string) => position === 'first' ? word[0] : word.at(-1)!;
    for (const target of [...new Set(pack.words.map(word => letter(word.word)))].sort()) {
      const matches = pack.words.filter(word => letter(word.word) === target);
      const others = pack.words.filter(word => letter(word.word) !== target);
      if (!matches.length || others.length < 2) continue;
      for (let start = 0; start < matches.length; start += 3) {
        const words = [...matches.slice(start, start + 3), ...others.slice(0, 3)];
        const id = `${position}-${target}-${start}`;
        const task: SortTask = { kind: 'sort', basis: position === 'first' ? 'letter' : 'spelling', categories: [{ id: '0', label: `${target} ${position === 'first' ? 'aan het begin' : 'aan het eind'}` }, { id: '1', label: 'Andere letter' }], items: orderedChoices(words.map(word => ({ id: word.id, label: word.word, categoryId: letter(word.word) === target ? '0' : '1' })), seed + start), help: `Kijk naar de ${position === 'first' ? 'eerste' : 'laatste'} letter. Vraag je docent om hulp.` };
        const sources = pack.exercises.filter(item => words.some(word => word.id === item.wordId));
        result.push({ ...base, exerciseId: `${pack.id}:group:word-sort:${id}`, componentId: 'KLINK-STANDARD', mode: 'word-sort', groupActivity: 'word-sort', title: `${position === 'first' ? 'Begint' : 'Eindigt'} het woord ${position === 'first' ? 'met' : 'op'} ${target}?`, phase: 'recognize', instructionNeedId: 'klink-standard-sort-instruction', targetWordIds: words.map(word => word.id), sourceContentIds: words.map(word => word.id), sourceExerciseId: sources[0]?.exerciseId, sourceLessonIds: [...new Set(sources.map(item => item.lessonId).filter(Boolean))], readingConditions: words.map(word => wordsById.get(word.id)!.preparation), objective: `WO-07:${id}`, standardTask: task, feedback: task.help, distractorReason: 'Bestaande woorden uit dezelfde lijst met een andere letter op de gevraagde positie; geen klankonderscheid.' });
      }
    }
  }
  return result;
}

const sceneRegions: Record<string, HotspotTask['regions']> = {
  'situatie-map': [
    { id: 'book', label: 'Links op tafel', x: .22, y: .31, width: .38, height: .25 },
    { id: 'cup', label: 'Midden op tafel', x: .53, y: .20, width: .14, height: .13 },
    { id: 'folder', label: 'Rechts op tafel', x: .66, y: .28, width: .30, height: .20 },
    { id: 'pen', label: 'Rechts vooraan', x: .64, y: .43, width: .12, height: .11 },
  ],
  'situatie-pan': [
    { id: 'pan', label: 'Midden in de gootsteen', x: .22, y: .38, width: .45, height: .40 },
    { id: 'tap', label: 'Boven de gootsteen', x: .59, y: .01, width: .16, height: .22 },
    { id: 'cloth', label: 'Rechts op de rand', x: .86, y: .28, width: .10, height: .11 },
  ],
  'situatie-keuken': [
    { id: 'pan', label: 'Links op het werkblad', x: .08, y: .35, width: .39, height: .28 },
    { id: 'cabbage', label: 'Midden achteraan', x: .53, y: .36, width: .26, height: .25 },
    { id: 'beet', label: 'Midden vooraan', x: .38, y: .59, width: .16, height: .14 },
    { id: 'jug', label: 'Rechts achteraan', x: .82, y: .30, width: .13, height: .23 },
    { id: 'nut', label: 'Voor de kom', x: .64, y: .73, width: .10, height: .08 },
  ],
};
const sceneTargets = [
  { scene: 'situatie-map', word: 'map', article: 'de', region: 'folder', help: 'Je doet papier in een map. Kijk rechts op tafel.' },
  { scene: 'situatie-map', word: 'boek', article: 'het', region: 'book', help: 'Je kunt erin lezen. Kijk links op tafel.' },
  { scene: 'situatie-map', word: 'pen', article: 'de', region: 'pen', help: 'Je schrijft ermee. Kijk rechts vooraan op tafel.' },
  { scene: 'situatie-pan', word: 'pan', article: 'de', region: 'pan', help: 'Je kookt erin. Kijk in de gootsteen.' },
  { scene: 'situatie-keuken', word: 'pan', article: 'de', region: 'pan', help: 'Je kookt erin. Kijk links in de keuken.' },
  { scene: 'situatie-keuken', word: 'kool', article: 'de', region: 'cabbage', help: 'Kijk naar de grote groene groente.' },
  { scene: 'situatie-keuken', word: 'biet', article: 'de', region: 'beet', help: 'Kijk naar de rode groente voor de kool.' },
  { scene: 'situatie-keuken', word: 'noot', article: 'de', region: 'nut', help: 'Kijk voor de kom. De noot is open.' },
];

// Source replies stay verbatim; the explicitly authored alternatives lead to different actions.
const branchContinuations: Record<string, { alternative: string; consequence: string; nextPrompt: string; choices: [string, string]; outcomes: [string, string] }> = {
  'klink-dialogue-0aa0c4bd7cffed36': { alternative: 'Ik lees er zelf nog in.', consequence: 'Je houdt het boek nog even.', nextPrompt: 'Wat kun je afspreken?', choices: ['Ik geef het je als ik klaar ben.', 'We kunnen een ander boek zoeken.'], outcomes: ['De ander wacht tot je het boek uit hebt.', 'Jullie zoeken samen een ander leesboek.'] },
  'klink-dialogue-a858a3de1a5ec4e1': { alternative: 'Ik gebruik de emmer nu zelf.', consequence: 'Je kunt de emmer nu niet uitlenen.', nextPrompt: 'Hoe help je de ander?', choices: ['Over een uur ben ik klaar.', 'Vraag het even aan de buur.'], outcomes: ['De ander kan de emmer over een uur ophalen.', 'De ander vraagt de buur om een emmer.'] },
  'klink-dialogue-895ca6c532a29c98': { alternative: 'Nee, dank je. Ik heb geen trek.', consequence: 'Je krijgt geen fruit.', nextPrompt: 'Wil je iets voor later meenemen?', choices: ['Ja, graag een appel voor later.', 'Nee, ik neem niets mee.'], outcomes: ['Je bewaart de appel om later te eten.', 'Je neemt geen fruit mee.'] },

  'klink-dialogue-5f7e2296cb998211': { alternative: 'Ik heb het boek nu zelf nodig.', consequence: 'Je houdt het boek. Wat kan de ander doen?', nextPrompt: 'Hoe help je de ander verder?', choices: ['Je mag het na de les lenen.', 'We kunnen samen in het boek kijken.'], outcomes: ['Na de les geef je het boek aan de ander.', 'Jullie bekijken het boek samen.'] },
  'klink-dialogue-c2c076150b6d8c31': { alternative: 'Nee, dank je. Ik wil geen soep.', consequence: 'Je krijgt geen soep.', nextPrompt: 'Wat wil je wel?', choices: ['Alleen brood met kaas, graag.', 'Ik hoef nu niets, dank je.'], outcomes: ['Je kiest brood met kaas.', 'Je eet nu niets. Je praat wel mee.'] },
  'klink-dialogue-6dad30938477beff': { alternative: 'Liever water, graag.', consequence: 'Je kiest water in plaats van thee.', nextPrompt: 'Hoe wil je het water?', choices: ['Een klein glas, graag.', 'Een groot glas, graag.'], outcomes: ['Je krijgt een klein glas water.', 'Je krijgt een groot glas water.'] },
  'klink-dialogue-17aa25708b6699a6': { alternative: 'Deze week lukt niet.', consequence: 'Jullie moeten een ander moment zoeken.', nextPrompt: 'Hoe maken jullie een nieuwe afspraak?', choices: ['Volgende week kan ik wel.', 'Ik stuur je een bericht als ik tijd heb.'], outcomes: ['Jullie zoeken een dag in de volgende week.', 'Je stuurt later een bericht. Dan spreken jullie af.'] },
  'klink-dialogue-e09966d04858ee8b': { alternative: 'Nee, deze bus gaat ergens anders heen.', consequence: 'De reiziger stapt niet in deze bus.', nextPrompt: 'Hoe help je de reiziger?', choices: ['We kijken samen op het bord.', 'Vraag het aan de chauffeur.'], outcomes: ['Jullie zoeken samen welke bus naar het station gaat.', 'De reiziger vraagt het aan de chauffeur.'] },
  'klink-dialogue-dce83c82577bc5e4': { alternative: 'Ik kan er niet bij.', consequence: 'De fles blijft op zijn plek.', nextPrompt: 'Hoe krijg je de fles?', choices: ['Kun jij hem wat dichterbij zetten?', 'Wil je iemand anders vragen?'], outcomes: ['De ander zet de fles bij je. Nu kun je erbij.', 'Je vraagt iemand anders om de fles te geven.'] },
  'klink-dialogue-4fa5d94951424942': { alternative: 'Mijn handen zijn ook vol.', consequence: 'Het hek blijft nog even open.', nextPrompt: 'Hoe lossen jullie dat op?', choices: ['Ik zet eerst mijn spullen neer.', 'Ik vraag iemand om te helpen.'], outcomes: ['Je handen zijn nu vrij. Je doet het hek dicht.', 'Je vraagt hulp. Iemand doet het hek dicht.'] },
  'klink-dialogue-5095b1d81e8466ee': { alternative: 'Nee, ik heb de sleutel niet gezien.', consequence: 'De sleutel is nog niet gevonden.', nextPrompt: 'Hoe zoeken jullie verder?', choices: ['We kijken samen op tafel.', 'Kijk eens in je jaszak.'], outcomes: ['Jullie beginnen samen op tafel te zoeken.', 'De ander kijkt eerst in de jaszak.'] },
  'klink-dialogue-ed50ab67521a402c': { alternative: 'Ik hoef nu niets, dank je.', consequence: 'Je krijgt niets te drinken.', nextPrompt: 'Wil je erbij blijven?', choices: ['Ja, ik blijf even zitten.', 'Nee, ik ga verder.'], outcomes: ['Je drinkt niets. Je praat wel mee.', 'Je neemt afscheid en gaat verder.'] },
  'klink-dialogue-8516816541f86701': { alternative: 'Vanavond kan ik niet. Mag het morgen?', consequence: 'Het pakje blijft tot morgen bij de ander.', nextPrompt: 'Hoe spreek je een tijd af?', choices: ['Ik bel morgen voordat ik kom.', 'Kunnen we nu een tijd afspreken?'], outcomes: ['Je belt morgen eerst om te vragen of het uitkomt.', 'Jullie zoeken nu samen een tijd voor morgen.'] },
  'klink-dialogue-76e67175b4fd1f7a': { alternative: 'Nee, ik heb geen zak meer.', consequence: 'Het brood kan niet in een zak van de ander.', nextPrompt: 'Wat kunnen jullie doen?', choices: ['Heb je zelf een tas bij je?', 'Zullen we het in papier doen?'], outcomes: ['De ander kijkt of er een tas is.', 'Jullie doen het brood in papier.'] },
  'klink-dialogue-57994bfa22a5eb5b': { alternative: 'Vanavond kan ik niet mee.', consequence: 'Je gaat vanavond niet mee zingen.', nextPrompt: 'Wat spreek je verder af?', choices: ['Vraag me de volgende keer weer.', 'Ik laat het weten als ik mee wil.'], outcomes: ['De ander zal je de volgende keer opnieuw vragen.', 'Je zegt het als je mee wilt.'] },
};
function sourceBranch(id: string): BranchTask | undefined {
  const source = contentById.get(id), variant = branchContinuations[id];
  if (!source || source.kind !== 'dialogue' || source.blocks.length !== 4 || !variant) return;
  const [a,b,c,d] = source.blocks;
  if (!('speaker' in a) || !('speaker' in b) || !('speaker' in c) || !('speaker' in d) || a.speaker !== c.speaker || b.speaker !== d.speaker) return;
  return { kind: 'branch', start: 'start', help: 'Kies wat je wilt zeggen. Kijk wat er dan gebeurt. Met Terug kun je iets anders kiezen.', nodes: [
    { id: 'start', prompt: `${a.speaker}: ${a.text} Jij bent ${b.speaker}.`, choices: [
      { id: 'source', label: b.text, consequence: `${a.speaker}: ${c.text}`, next: 'continue' },
      { id: 'alternative', label: variant.alternative, consequence: variant.consequence, next: 'alternative' },
    ] },
    { id: 'continue', prompt: `${a.speaker}: ${c.text}`, choices: [
      { id: 'reply', label: d.text, consequence: 'Jullie zijn klaar met praten.', next: null },
      { id: 'repeat', label: 'Wil je dat nog eens zeggen?', consequence: `${a.speaker} herhaalt: ${c.text}`, next: 'repeat' },
    ] },
    { id: 'repeat', prompt: 'Je hebt het nog een keer gehoord. Wat zeg je?', choices: [
      { id: 'reply', label: d.text, consequence: 'Nu geef je antwoord.', next: null },
      { id: 'help', label: 'Ik begrijp het nog niet. Kun je het anders uitleggen?', consequence: 'Stop even. Vraag je docent om hulp.', next: null },
    ] },
    { id: 'alternative', prompt: variant.nextPrompt, choices: variant.choices.map((label,index) => ({ id: `option-${index}`, label, consequence: variant.outcomes[index], next: null })) },
  ] };
}
