import { importedActivities } from './imported-practice.ts';
import { contentById, contentReadingConditions } from './connected-content.ts';
import { sourceContentLevel, wordContentLevel, exerciseSetLevel, type ContentLevel } from './content-levels.ts';
import type { GroupActivity } from './group-practice';
import type { PackageDefinition, PackageExercise, PackageLesson } from './package-content';

export const routeSettingsKey = 'klink.taalroute.preferences.v1';
export type RouteSettings = { literacy: 'all' | 'alfa-a' | 'alfa-b' | 'alfa-c'; language: 'all' | 'a1' | 'a2' | 'b1'; pictures: 'always' | 'request' | 'after' };
export const defaultRouteSettings: RouteSettings = { literacy: 'all', language: 'all', pictures: 'always' };
export function chapterRouteAxis(chapter?: string): 'literacy' | 'language' {
  return chapter && ['sentences', 'texts', 'listening', 'speaking', 'grammar', 'practical'].includes(chapter) ? 'language' : 'literacy';
}
export function parseRouteSettings(raw: string | null): RouteSettings {
  try {
    const value = JSON.parse(raw ?? '{}');
    return {
      literacy: ['all', 'alfa-a', 'alfa-b', 'alfa-c'].includes(value?.literacy) ? value.literacy : 'all',
      language: ['all', 'a1', 'a2', 'b1'].includes(value?.language) ? value.language : 'all',
      pictures: ['always', 'request', 'after'].includes(value?.pictures) ? value.pictures : 'always',
    };
  } catch { return { ...defaultRouteSettings }; }
}

export const practiceStages: { id: string; label: string; description: string; activities: GroupActivity[] }[] = [
  { id: 'meet', label: 'Kennismaken', description: 'Bekijk het voorbeeld.', activities: ['meet', 'cards'] },
  { id: 'recognize', label: 'Herkennen', description: 'Kies wat erbij hoort.', activities: ['word-sort', 'same-word', 'listen', 'hear-word', 'read', 'match', 'hear-match', 'synonyms', 'sound-compare', 'sound-path'] },
  { id: 'model', label: 'Maken met voorbeeld', description: 'Kijk en maak na.', activities: ['build-model', 'worksheet', 'copy', 'write', 'write-letter', 'speak'] },
  { id: 'make', label: 'Zelf maken', description: 'Probeer het zonder volledig voorbeeld.', activities: ['build', 'worksheet-heard', 'missing', 'dictation', 'paper-dictation', 'spelling-path'] },
  { id: 'use', label: 'Gebruiken', description: 'Oefen met zinnen en situaties. Vraag hulp als je die nodig hebt.', activities: [...importedActivities.map(item => item.id), 'word-combinations', 'suitable-reply', 'context-order', 'situation-point', 'practice-branch', 'sentences', 'word-sentence', 'find-sentence', 'sentence-dictation', 'sentence-speak', 'understand', 'texts', 'dialogues', 'text-question', 'text-evidence', 'dialogue-question', 'dialogue-role', 'functional-message', 'functional-form', 'sentence-build', 'verb-choice', 'grammar-path', 'practical-path', 'reading-path'] },
  { id: 'recall', label: 'Gemengd herhalen', description: 'Oefen bekende woorden door elkaar.', activities: ['read-series', 'word-bingo', 'image-bingo', 'memory', 'learning-review'] },
];

export function lessonWordIds(pack: PackageDefinition, lesson?: PackageLesson) {
  return lesson ? [...new Set([...(lesson.known ?? []), ...(lesson.newWords ?? []), ...(lesson.returning ?? []), ...pack.words.filter(word => lesson.words.includes(word.word)).map(word => word.id)])] : pack.words.map(word => word.id);
}
export function lessonContentLevel(pack: PackageDefinition, lesson: PackageLesson): ContentLevel {
  return wordContentLevel(lessonWordIds(pack, lesson));
}
export function scopeWordExercises(exercises: PackageExercise[], ids?: string[]) {
  if (!ids) return exercises;
  const prepared = new Set(ids);
  const compatible = (item: PackageExercise) => {
    if (item.contextId) return false;
    const targets = [
      ...(Array.isArray(item.targetWordIds) ? item.targetWordIds as string[] : []),
      ...(typeof item.wordId === 'string' ? [item.wordId] : []),
      ...(Array.isArray(item.prerequisiteWordIds) ? item.prerequisiteWordIds as string[] : []),
      ...(Array.isArray(item.cells) ? (item.cells as { cellId?: string }[]).flatMap(row => row.cellId ? [row.cellId] : []) : []),
      ...(Array.isArray(item.readingConditions) ? (item.readingConditions as { wordId?: string }[]).flatMap(row => row.wordId ? [row.wordId] : []) : []),
    ];
    return targets.length > 0 && targets.every(id => prepared.has(id));
  };
  const rejectedPaths = new Set(exercises.filter(item => !compatible(item)).map(item => item.learningPathId).filter(Boolean));
  const rejectedBoards = new Set(exercises.filter(item => !compatible(item)).map(item => item.boardId).filter(Boolean));
  return exercises.filter(item => compatible(item) && (!item.learningPathId || !rejectedPaths.has(item.learningPathId)) && (!item.boardId || !rejectedBoards.has(item.boardId)));
}

export type ContentReadiness = 'independent' | 'guided' | 'later';
export const readinessLabels = { independent: 'Nu zelf', guided: 'Met de docent', later: 'Voor later' };
export function selectUsageExercises(exercises: PackageExercise[], pack: PackageDefinition, lesson: PackageLesson | undefined, settings: RouteSettings, readiness: ContentReadiness) {
  const groups = new Map<string, PackageExercise[]>();
  for (const item of exercises) {
    const key = typeof item.learningPathId === 'string' ? `path:${item.learningPathId}` : item.groupActivity === 'word-sentence' ? 'word-sentence' : item.exerciseId;
    const group = groups.get(key) ?? []; group.push(item); groups.set(key, group);
  }
  const allowed = new Set([...groups.values()].filter(group => {
    if (group.every(item => item.componentId === 'KLINK-CONTENT')) {
      const linked = !lesson || group.every(item => Array.isArray(item.sourceLessonIds) && item.sourceLessonIds.includes(lesson.id) || Array.isArray(item.targetWordIds) && item.targetWordIds.length > 0 && item.targetWordIds.every(id => lessonWordIds(pack, lesson).includes(String(id))) || Array.isArray(item.sourceContentIds) && item.sourceContentIds.some(id => pack.exercises.some(source => source.contextId === id && source.lessonId === lesson.id)));
      const selected = group.every(item => settings[item.contentAxis as 'literacy'|'language'] === 'all' || settings[item.contentAxis as 'literacy'|'language'] === item.contentLevel);
      return linked && (selected ? readiness === (group.every(item => item.access === 'self-practice') ? 'independent' : 'guided') : readiness === 'later');
    }
    const contexts = group.filter(item => typeof item.contextId === 'string');
    if (!contexts.length) return readiness === 'later' && !lesson;
    const linked = (item: PackageExercise) => !lesson || item.lessonId === lesson.id || (Array.isArray(item.sourceLessonIds) && item.sourceLessonIds.includes(lesson.id));
    // A complete grammar path may revisit several lessons; retain all of its steps.
    if (lesson && !(group.every(item => item.learningActivity === 'grammar-path' && item.access === 'self-practice') ? contexts.some(linked) : contexts.every(linked))) return false;
    if (group.every(item => item.access === 'self-practice') && (settings.language === 'all' || exerciseSetLevel(group) === settings.language)) return readiness === 'independent';
    const placements = contexts.map(item => contextReadiness(item.contextId as string, pack, lesson, settings).status);
    const status = placements.includes('later') ? 'later' : placements.includes('guided') ? 'guided' : 'independent';
    return status === readiness;
  }).flatMap(group => group.map(item => item.exerciseId)));
  return exercises.filter(item => allowed.has(item.exerciseId));
}
export function contextReadiness(id: string, pack: PackageDefinition, lesson: PackageLesson | undefined, settings: RouteSettings): { status: ContentReadiness; reason: string; level: ContentLevel } {
  const source = contentById.get(id);
  if (!source) return { status: 'later', reason: 'Bron en leesvoorwaarden moeten nog worden vastgesteld.', level: 'support' };
  const level = sourceContentLevel(source.sourceLevel);
  if (level !== 'support') {
    if (settings.language === 'all') return { status: 'later', level, reason: 'Kies met de docent eerst het passende taalniveau bij Taal bovenaan. Het bronlabel is geen leesvrijgave.' };
    if (level !== settings.language) return { status: 'later', level, reason: 'Ander taalniveau dan de gekozen route. De docent kan dit bewust voor herhaling of later kiezen.' };
    if (source.kind === 'sentence') {
      const conditions = contentReadingConditions(source, lesson ?? { id: pack.id, known: pack.words.map(word => word.id) });
      if (conditions.otherWords.length || conditions.outsideWordBank.length || conditions.unitsOutsideStep.length) return { status: 'later', level, reason: 'Het taalniveau past, maar woorden of leesvoorwaarden zijn nog niet voorbereid. Selecteer en bereid deze zin eerst samen voor.' };
    }
    return { status: 'guided', level, reason: 'Het taalbronlabel past bij de gekozen route. Betekenis en lezen blijven begeleid; dit is geen zelfstandige leesvrijgave.' };
  }
  const conditions = contentReadingConditions(source, lesson ?? { id: pack.id, known: pack.words.map(word => word.id) });
  if (conditions.otherWords.length || conditions.outsideWordBank.length || conditions.unitsOutsideStep.length) return { status: 'later', level, reason: 'Deze bron bevat nog niet voorbereide woorden of leesvoorwaarden. Eerst samen selecteren en voorbereiden.' };
  return { status: 'guided', level, reason: 'De woordvormen zijn voorbereid. Zinsverband en betekenis vragen nog begeleiding.' };
}

export const pictureGrowth = [
  { id: 'object', label: 'Een woord in beeld', description: 'Herken het voorwerp bij het woord.' },
  { id: 'contrast', label: 'Beelden vergelijken', description: 'Kies en koppel voorbereide woorden en afbeeldingen.' },
  { id: 'situation', label: 'Een situatie bekijken', description: 'Bekijk met de docent wat er gebeurt.' },
  { id: 'question', label: 'Een beeldvraag beantwoorden', description: 'Laat de cursist een antwoord in het beeld aanwijzen of benoemen. Dit is iets anders dan een verhaal in meerdere beelden volgen.' },
  { id: 'practical', label: 'Informatie gebruiken', description: 'Praktijkopdrachten bestaan; passende documentbeelden moeten apart worden gekoppeld.' },
] as const;
