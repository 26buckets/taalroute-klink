import type { LessonPhase, PackageDefinition, PackageExercise, PackageLesson } from './package-content';

export const phaseLabels: Record<LessonPhase, string> = {
  meet: 'Kennismaken', recognize: 'Herkennen', make: 'Zelf maken', use: 'Gebruiken', recall: 'Herhalen',
};
export type PlanStatus = 'connected' | 'available' | 'missing' | 'unnecessary';
export const planStatusLabels: Record<PlanStatus, string> = {
  connected: 'Werkt al', available: 'Bestaat maar is niet aangesloten', missing: 'Ontbreekt', unnecessary: 'Bewust niet nodig',
};
export type PlanRow = { id: string; title: string; phase: LessonPhase; status: PlanStatus; count: number; guidedCount: number; reason: string; exerciseIds: string[] };

// This is a capability/content inventory, never a media approval or a learner score.
export function lessonPlan(pack: PackageDefinition, lesson: PackageLesson): PlanRow[] {
  const records = pack.exercises.filter(item => item.lessonId === lesson.id);
  const guided = new Set(lesson.guidedExerciseIds);
  const ids = [...new Set([...(lesson.known ?? []), ...(lesson.newWords ?? []), ...(lesson.returning ?? [])])];
  const words = ids.map(id => pack.words.find(word => word.id === id)!);
  const distinctWords = new Set(words.map(word => word.word)).size;
  const missingAudio = words.filter(word => !word.audio).map(word => word.word);
  const missingImages = words.filter(word => !word.image).map(word => word.word);
  const row = (id: string, title: string, phase: LessonPhase, modes: string[], absent: string, excluded?: string): PlanRow => {
    const items = records.filter(exercise => modes.includes(exercise.mode));
    const guidedCount = items.filter(item => guided.has(item.exerciseId)).length;
    return { id, title, phase, count: items.length, guidedCount, exerciseIds: items.map(item => item.exerciseId),
      status: items.length ? guidedCount ? 'connected' : 'available' : excluded ? 'unnecessary' : 'missing',
      reason: items.length ? guidedCount ? `${guidedCount} in de lesroute; ${items.length} beschikbaar bij deze leesstap.` : 'Wel in Vrij oefenen bij deze woorden. Niet verplicht in de begeleide route.' : excluded ?? absent };
  };
  const pairExcluded = distinctWords < 2 ? 'Eén voorbereide woordvorm: geen kunstmatige tweede keuze of memory.' : undefined;
  const result: PlanRow[] = [
    row('KL-01', 'Kijken en luisteren', 'meet', ['model'], 'Woordpresentatie ontbreekt.'),
    row('WO-02', 'Hetzelfde woord herkennen', 'recognize', ['same-word'], 'Een voorbereid vergelijkingswoord ontbreekt.', pairExcluded),
    row('KL-03', 'Gehoord woord herkennen', 'recognize', ['heard-word'], 'Woordaudio of een passende keuze ontbreekt.', pairExcluded),
    row('BB-01', 'Luisteren en een beeld kiezen', 'recognize', ['heard-image'], 'Twee verschillende voorbereide beelden en woordaudio nodig.', pairExcluded),
    row('WO-03', 'Het woord bouwen', 'make', ['word-build'], 'Gecontroleerde letter- of woorddelen nodig.'),
    row('WO-05', 'Ontbrekende letter of lettercombinatie', 'make', ['missing-grapheme'], 'Woordaudio, een doelpositie en een voorbereide, onderscheidbare afleider nodig.'),
    row('WO-06', 'Dictee zonder zichtbaar antwoord', 'make', ['word-dictation'], 'De woordopname ontbreekt.'),
    row('SP-01', 'Nazeggen en terugluisteren', 'make', ['repeat-word'], 'Een woordopname ontbreekt. Opnemen is geen uitspraakbeoordeling.'),
    row('SC-01', 'Schrijven of typen met een model', 'make', ['write-word', 'copy-word'], 'Een passend schrijfmodel ontbreekt.'),
    row('WO-07-ZI-04', 'Een letter of woord aanwijzen', 'recognize', ['mark-grapheme', 'mark-word'], 'Doelposities en een afgebakend zoekveld ontbreken. Voor zoeken in zinnen moeten ook de overige woorden voorbereid zijn.'),
    row('BB-02', 'Woord en betekenis verbinden', 'use', ['word-image'], 'Twee passende verschillende beelden nodig.', pairExcluded),
    row('BB-03', 'Woorden en beelden koppelen', 'use', ['word-image-match'], 'Twee voorbereide woorden met verschillende beelden nodig.', pairExcluded),
    row('WO-03-recall', 'Later in de les terughalen', 'recall', ['recall-word'], 'Woordaudio ontbreekt; samen lezen is geen zelfstandig terughalen.'),
    row('MX-02', 'Herhalen in een latere sessie', 'recall', [], 'De terugkeerwoorden staan vast en de plek wordt bewaard. Een planning op basis van beheersing ontbreekt nog; Bewaarde woorden is een eigen selectie, geen adaptieve herhaalplanning.'),
    row('BB-04', 'Memory', 'recall', ['memory'], 'Twee voorbereide beeld–woordparen nodig.', pairExcluded),
    row('BB-05', 'Woordkaarten', 'meet', ['word-card'], 'Een passend betekenisbeeld ontbreekt.'),
    row('ZI-03', 'Zinnen beluisteren met tekststeun', 'use', ['listen-sentence'], 'Een passende zin met opname ontbreekt bij deze woorden. Aanwezige zinnen zijn luistermodellen, geen toets zelfstandig lezen.'),
    row('ZI-01-begrip', 'Een luisterzin begrijpen', 'use', ['sentence-question'], 'Een vraag met passende voorbereide keuzes ontbreekt. Horen en begrijpen is geen zelfstandig lezen.'),
    row('ZI-situation', 'Een situatie beluisteren', 'use', ['listen-situation'], 'Een passende korte situatie met opname en beeld ontbreekt bij deze woorden. Mondeling voorbereiden; niet behandelen als zelfstandig lezen.'),
    row('BB-07', 'Een voorwerp in een situatie aanwijzen', 'use', ['scene-choice'], 'Een gecontroleerd situatiebeeld met gemarkeerde voorwerpen en bijbehorende vraag ontbreekt.'),
    row('BB-06', 'Een handeling in volgorde', 'use', ['image-sequence'], 'Een samenhangende eigen beeldreeks ontbreekt; losse woordfoto’s zijn geen handeling.'),
    row('PR-05', 'Een praktische keuze', 'use', ['situation-branch'], 'Eigen gesprek/situatie, reacties en uitkomsten ontbreken; geen verplicht onderdeel van elke woordstap.'),
    row('WO-09-10', 'Woordzoeker, kruiswoord en tijdscore', 'recall', [], '', 'Geen prioriteit: extra bediening of tijdsdruk is voor dit leerdoel niet nodig.'),
  ];
  if (missingAudio.length) result.push({ id: 'word-audio', title: 'Ontbrekende woordopnamen', phase: 'meet', status: 'missing', count: 0, guidedCount: 0, exerciseIds: [], reason: missingAudio.join(' · ') });
  if (missingImages.length) result.push({ id: 'word-images', title: 'Ontbrekende woordbeelden', phase: 'meet', status: 'missing', count: 0, guidedCount: 0, exerciseIds: [], reason: `${missingImages.join(' · ')}. Voor niet-afbeeldbare betekenissen eerst een passende context kiezen.` });
  const explained = records.filter(item => item.instructionAudio?.src);
  const explainedGuided = explained.filter(item => guided.has(item.exerciseId)).length;
  result.push({ id: 'instruction-audio', title: 'Gesproken instructie', phase: 'meet', status: explained.length ? explainedGuided ? 'connected' : 'available' : 'missing', count: explained.length, guidedCount: explainedGuided, exerciseIds: explained.map(item => item.exerciseId), reason: explained.length ? 'Aparte steunstem. Uitleg klinkt eenmaal per handeling in deze browsersessie en is via de opdracht opnieuw te beluisteren. Luisterbeoordeling staat nog open.' : 'Afzonderlijke steunstem en passende instructie ontbreken; losse /t/ blijft geparkeerd.' });
  return result;
}

export function exerciseHelp(exercise: PackageExercise): string {
  if (exercise.mode === 'sentence-question') return 'Luister opnieuw als je twijfelt. Kies één antwoord.';
  if (exercise.mode === 'missing-grapheme') return 'Luister. Kies wat ontbreekt.';
  if (exercise.componentId === 'ALF-CMP-004') return 'Kies een woord. Kies daarna de foto.';
  if (exercise.componentId === 'ALF-CMP-005') return 'Tik op de letters. Met Eén terug verander je een letter.';
  if (exercise.componentId === 'ALF-CMP-006') return 'Typ het woord. Tik daarna op Controleer.';
  if (exercise.componentId === 'ALF-CMP-002') return 'Tik op jouw antwoord.';
  return 'Neem rustig de tijd.';
}
