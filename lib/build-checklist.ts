import type { PackageDefinition, PackageExercise, PackageLesson } from './package-content';
import { klinkContexts } from './klink-context.ts';

export const buildStatusLabels = {
  works: 'Werkt', partial: 'Gedeeltelijk', missing: 'Ontbreekt', different: 'Bewust anders',
} as const;
export type BuildStatus = keyof typeof buildStatusLabels;
export type BuildCheck = {
  id: string; title: string; status: BuildStatus; reason: string;
  packageId: string; lessonId: string; wordIds: string[];
  coveredWordIds: string[]; guidedWordIds: string[]; exerciseIds: string[];
};
const unique = (items: string[]) => [...new Set(items)];
const targetIds = (lesson: PackageLesson) => unique(lesson.newWords?.length ? lesson.newWords : lesson.returning ?? []);
const preparedIds = (lesson: PackageLesson) => unique([...(lesson.known ?? []), ...(lesson.newWords ?? []), ...(lesson.returning ?? [])]);
const exerciseWordIds = (exercise: PackageExercise): string[] => unique([
  ...(typeof exercise.wordId === 'string' ? [exercise.wordId] : []),
  ...(Array.isArray(exercise.sources) ? exercise.sources.flatMap(item => typeof item?.id === 'string' ? [item.id] : []) : []),
]);

// Build coverage is neither approval of the media nor evidence of learner mastery.
export function buildChecklist(pack: PackageDefinition, lesson: PackageLesson): BuildCheck[] {
  const records = pack.exercises.filter(item => item.lessonId === lesson.id);
  const guided = new Set(lesson.guidedExerciseIds);
  const words = targetIds(lesson);
  const prepared = preparedIds(lesson).map(id => pack.words.find(word => word.id === id)).filter(Boolean);
  const oneWord = new Set(prepared.map(word => word!.word)).size < 2;
  function check(id: string, title: string, modes: string[], reason: string, options: {
    media?: ('audio' | 'image')[]; partial?: boolean; different?: boolean;
  } = {}): BuildCheck {
    const items = records.filter(item => modes.includes(item.mode));
    const coveredWordIds = words.filter(id => items.some(item => exerciseWordIds(item).includes(id)));
    const guidedWordIds = words.filter(id => items.some(item => guided.has(item.exerciseId) && exerciseWordIds(item).includes(id)));
    const mediaMissing = words.filter(id => {
      const word = pack.words.find(item => item.id === id);
      return options.media?.some(kind => !word?.[kind] || (kind === 'audio' && word.audioStatus === 'rejected'));
    });
    const instructionsMissing = items.some(item => !item.instructionAudio?.src);
    const status: BuildStatus = !items.length ? options.different ? 'different' : 'missing'
      : options.partial || !words.length || guidedWordIds.length !== words.length || mediaMissing.length || instructionsMissing ? 'partial' : 'works';
    const coverage = items.length ? `${coveredWordIds.length}/${words.length} doelwoorden beschikbaar; ${guidedWordIds.length}/${words.length} in de begeleide route. ` : '';
    const mediaNote = mediaMissing.length ? `Nog benodigde woordmedia: ${mediaMissing.map(id => pack.words.find(word => word.id === id)?.word ?? id).join(' · ')}. ` : '';
    return { id, title, status, packageId: pack.id, lessonId: lesson.id, wordIds: words,
      coveredWordIds, guidedWordIds, exerciseIds: items.map(item => item.exerciseId),
      reason: coverage + mediaNote + (instructionsMissing ? 'Gesproken uitleg is niet overal gekoppeld. ' : '') + reason };
  }
  const pairReason = oneWord ? 'Bij één voorbereid woord geen kunstmatige tweede keuze. Eerst kennismaken; vergelijken volgt met een tweede woord.' : '';
  return [
    check('word-model', 'Woord horen, zien en betekenis voorbereiden', ['model'], 'Aanwezige opnamen en beelden moeten nog inhoudelijk worden beoordeeld.', { media: ['audio', 'image'] }),
    check('sound-letter', 'Klank en letter verbinden', ['missing-grapheme'], 'Een letter aanvullen binnen een hoorbaar woord is nog geen volledige klank-tekenroute. Geïsoleerde klankmodellen ontbreken; de losse t blijft geparkeerd.', { media: ['audio'], partial: true }),
    check('sound-synthesis', 'Losse klanken tot een woord samenvoegen', [], 'Nog nodig: gecontroleerde klankreeksen en een taak waarin de cursist de klanken samenvoegt. Een heel woord beluisteren of zichtbare letters nabouwen telt hiervoor niet.'),
    check('word-recognition', 'Een gehoord woord herkennen', ['heard-word'], pairReason || 'Keuze uit voorbereide woorden. Een modelwoord vergelijken telt hier niet als zelfstandig herkennen.', { media: ['audio'], different: oneWord }),
    check('word-copy', 'Een woord bouwen met voorbeeld', ['word-build'], 'Dit oefent de woordopbouw met modelsteun; het bewijst nog geen zelfstandig lezen.'),
    check('word-production', 'Een woord maken zonder zichtbaar antwoord', ['recall-word', 'word-dictation'], 'Lettertegels of dictee zonder zichtbaar model. Opgevraagde hulp blijft apart geregistreerd; typen is niet verplicht bij de instap.', { media: ['audio'] }),
    check('word-meaning', 'Geschreven woord en betekenis verbinden', ['word-image', 'word-image-match'], pairReason || 'Verschillende voorbereide betekenissen en beelden. Ontbrekende woordbeelden niet door willekeurige foto’s vervangen.', { media: ['image'], different: oneWord }),
    check('speaking', 'Nazeggen en terugluisteren', ['repeat-word'], 'Beschikbaar bij vrij oefenen. Een opname of tik op Klaar is geen uitspraakbeoordeling.', { media: ['audio'] }),
    check('sentence-listening', 'Een korte zin beluisteren en begrijpen', ['listen-sentence'], 'Luistermodellen zijn aanwezig waar gekoppeld; een afzonderlijke begripsvraag en gecontroleerde antwoordkeuzes ontbreken nog.', { partial: true }),
    check('sentence-reading', 'Een zin zelfstandig lezen en begrijpen', [], 'Nog bouwen: leesvoorwaarden voor álle woorden, een betekenisvraag en afzonderlijke registratie van luister- of modelsteun.'),
    check('sentence-building', 'Woorden tot een betekenisvolle zin verbinden', [], 'Nog bouwen: voorbereide woordkaarten, een natuurlijk zinsdoel en verdedigbare alternatieve woordvolgordes. Geen verplicht toetsenbord.'),
    check('text-understanding', 'Een korte samenhangende tekst begrijpen', ['listen-situation'], 'Een beluisterde situatie is hoogstens een begin. Zelfstandig lezen, vragen met bewijs in de tekst en foutherstel ontbreken nog.', { partial: true }),
    check('application', 'Taal gebruiken in dagelijks leven en werk', ['listen-situation'], 'Een situatie beluisteren is nog geen praktische keuze maken. Een handeling of reactie met passende feedback moet nog worden uitgewerkt.', { partial: true }),
    check('repetition', 'Terughalen en later opnieuw gebruiken', ['recall-word'], 'Terughalen binnen de les en vaste terugkeerwoorden bestaan. Persoonlijke herhaalplanning over sessies ontbreekt; hervatten is geen beheersingsmeting.', { media: ['audio'], partial: true }),
    check('interaction', 'Rustige bediening en passende variatie', [], 'Eén hoofdhandeling, tikken als alternatief voor slepen, geen verplichte timer of puntenwedstrijd. Niet iedere oefenvorm hoort bij ieder woord.', { different: true }),
  ];
}

export const bridgeStages = [
  { title: 'Woorden voorbereiden', action: 'Betekenis, uitspraak en leesvoorwaarden van de gekozen woorden controleren. Opgenomen in een lijst betekent niet dat de cursist ze beheerst.' },
  { title: 'Een korte zin horen en begrijpen', action: 'Eén natuurlijke zin met een bekende betekenis. Een concrete begripsvraag toevoegen, met voorbereide antwoordmogelijkheden en gerichte feedback.' },
  { title: 'Die zin zelf lezen', action: 'Alle woorden en letterverbindingen voorbereiden. Eerst met steun; daarna zonder voorafgespeelde zin. Steungebruik apart bewaren.' },
  { title: 'Zelf woorden tot een zin verbinden', action: 'Dezelfde woorden anders combineren. Tikken in plaats van verplicht slepen of typen; alleen betekenisvolle oplossingen goedkeuren.' },
  { title: 'Een korte tekst begrijpen', action: 'Enkele samenhangende zinnen met dezelfde woorden. Vragen over wie, wat en volgorde; bij fouten terug naar de relevante zin.' },
  { title: 'Gebruiken en opnieuw terughalen', action: 'Een herkenbare dagelijkse of werksituatie met een echte keuze of handeling. De woorden en zinnen later opnieuw aanbieden.' },
];

export function sentenceBridge(pack: PackageDefinition, lesson: PackageLesson) {
  const ids = targetIds(lesson);
  const selected = new Set(preparedIds(lesson));
  const spellings = new Set(pack.words.filter(word => selected.has(word.id)).map(word => word.word.toLocaleLowerCase('nl')));
  const records = pack.exercises.filter(item => item.lessonId === lesson.id && ['listen-sentence', 'listen-situation'].includes(item.mode));
  const models = klinkContexts.filter(context => records.some(exercise => exercise.contextId === context.id)).map(context => {
    const tokens = unique(context.text.toLocaleLowerCase('nl').match(/\p{L}+(?:['’-]\p{L}+)*/gu) ?? []);
    return { id: context.id, kind: context.kind, text: context.text, wordIds: context.wordIds.filter(id => ids.includes(id)),
      exerciseIds: records.filter(item => item.contextId === context.id).map(item => item.exerciseId),
      wordsOutsideStep: tokens.filter(word => !spellings.has(word)),
      independentReading: context.independentReading, humanReview: context.humanReview };
  });
  return { packageId: pack.id, lessonId: lesson.id, wordIds: ids, models, stages: bridgeStages,
    nextAction: models.length
      ? 'Werk bij het gekoppelde luistermodel eerst één begrijpelijke betekenisvraag uit. Bereid de overige woorden voor voordat dit zelfstandig lezen wordt.'
      : 'Kies bij deze woordbetekenissen eerst één natuurlijke korte zin. Leg alle extra woorden, de volledige zinsopname en een concrete betekenisvraag vast.',
    readingNote: 'De opgesomde extra woorden ontbreken als geschreven vorm in deze leesstap. Dit is geen oordeel over beheersing: ook de betekenis, woordvorm, klanken en zinsbouw van de overige woorden moeten passen. Een luistermodel is nog geen zelfstandig leesmateriaal.' };
}
