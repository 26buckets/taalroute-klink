import type { PackageDefinition, PackageExercise } from './package-content';
import { contentById, contentReadingConditions } from './connected-content.ts';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import writing from '../data/klink-functional-writing.json' with { type: 'json' };
import { resolveRegisteredAudio } from './audio-register.ts';

export const extendedActivities = [
  { id: 'sound-compare', label: 'Hetzelfde of anders', category: 'Klanken horen', icon: 'ear' },
  { id: 'text-question', label: 'Begrijp het verhaal', category: 'Zinnen en verhalen', icon: 'book' },
  { id: 'dialogue-question', label: 'Begrijp het gesprek', category: 'Zinnen en verhalen', icon: 'chat' },
  { id: 'text-evidence', label: 'Zoek het antwoord', category: 'Zinnen en verhalen', icon: 'search' },
  { id: 'sentence-build', label: 'Maak de zin', category: 'Zinnen maken', icon: 'puzzle' },
  { id: 'verb-choice', label: 'Kies het werkwoord', category: 'Zinnen maken', icon: 'puzzle' },
  { id: 'functional-message', label: 'Schrijf een bericht', category: 'Schrijven en spreken', icon: 'pen' },
  { id: 'functional-form', label: 'Vul een berichtkaart in', category: 'Schrijven en spreken', icon: 'pen' },
  { id: 'dialogue-role', label: 'Jij bent aan de beurt', category: 'Schrijven en spreken', icon: 'mic' },
] as const;
export type ExtendedActivity = typeof extendedActivities[number]['id'];
export const extendedInstructionNeeds = [
  { id: 'extra-klankvergelijk', text: 'Luister naar beide woorden. Hoor je hetzelfde woord of een ander woord?', activities: ['sound-compare'] },
  { id: 'extra-begrip', text: 'Lees of luister. Beantwoord de vraag. Je mag terugkijken.', activities: ['text-question', 'dialogue-question'] },
  { id: 'extra-bewijs', text: 'Lees de vraag. Tik op de zin waarin je het antwoord vindt.', activities: ['text-evidence'] },
  { id: 'extra-zinbouwen', text: 'Luister naar de zin. Zet de woorden in dezelfde volgorde.', activities: ['sentence-build'] },
  { id: 'extra-werkwoord', text: 'Kijk naar de zin. Welk werkwoord past op de lege plek?', activities: ['verb-choice'] },
  { id: 'extra-bericht', text: 'Lees de opdracht. Schrijf je bericht. Kijk daarna of alles erin staat.', activities: ['functional-message', 'functional-form'] },
  { id: 'extra-gespreksrol', text: 'Luister naar de ander. Geef zelf antwoord. Je mag jezelf opnemen.', activities: ['dialogue-role'] },
] as const;

const unique = <T,>(items: T[], key: (item: T) => string) => [...new Map(items.map(item => [key(item), item])).values()];
const wordsById = new Map(curriculum.words.map(word => [word.id, word]));
const writingByContent = new Map(writing.items.map(item => [item.contentId, item]));
const normalize = (text: string) => text.trim().replace(/\s+/g, ' ');
const registered = (id: string, text: string, role = 'instruction') => { const src = resolveRegisteredAudio(id, text, role); return src ? { audioId: id, src } : undefined; };
export function orderedChoices<T>(items: T[], seed: number): T[] {
  const result = [...items]; let state = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; const j = state % (i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function extendedExercises(pack: PackageDefinition, activity: ExtendedActivity, seed = 1): PackageExercise[] {
  const definition = extendedActivities.find(item => item.id === activity)!;
  const need = extendedInstructionNeeds.find(item => (item.activities as readonly string[]).includes(activity))!;
  const src = resolveRegisteredAudio(need.id, need.text, 'instruction');
  const base = { contractVersion: '1.0', componentId: 'KLINK-EXTENDED', mode: activity, title: definition.label,
    groupActivity: activity, instructionNeedId: need.id, instructionAudio: src ? { audioId: need.id, src } : undefined,
    sourceStatus: 'concept', combinationReview: 'open', assessment: 'answer' as const,
    independentReading: false, access: 'teacher-supported', phase: 'use' as const,
    feedback: 'Kijk of luister nog eens. Je kunt opnieuw kiezen.',
  };
  if (activity === 'sound-compare') {
    // Only transparent, single-syllable models; spelling alone must not invent a phoneme contrast.
    const allowed = new Set(['a','e','i','o','u','aa','ee','oo','ie','oe','uu','m','n','l','r','s','f','p','t','k']);
    const pool = pack.words.filter(word => word.audio && wordsById.get(word.id)?.reading.units.length === 3
      && wordsById.get(word.id)!.reading.units.every(unit => allowed.has(unit.coreUnit) && !unit.value));
    return pool.flatMap((word, index) => {
      const units = wordsById.get(word.id)!.reading.units.map(unit => unit.coreUnit);
      const other = pool.find(candidate => candidate.id !== word.id && wordsById.get(candidate.id)!.reading.units.filter((unit, at) => unit.coreUnit !== units[at]).length === 1);
      if (!other) return [];
      return orderedChoices([word, other], seed + index).map((second, turn) => ({ ...base,
        exerciseId: `${pack.id}:group:${activity}:${word.id}:${turn}`, objective: `KL-04:${word.id}:${second.id}`,
        activityTypeId: 'KL-04', assessment: 'answer' as const, access: 'supported-listening', requiresAudio: true,
        prompt: { audio: { src: word.audio, audioId: word.id } }, playAllBlocks: true,
        textBlocks: [word, second].map((item, i) => ({ id: `${i}`, audio: { src: item.audio, audioId: item.id } })),
        targetWordIds: [...new Set([word.id, second.id])],
        options: orderedChoices([{ id: 'same', label: 'Hetzelfde' }, { id: 'different', label: 'Anders' }], seed),
        answer: { correctOptionIds: [word.id === second.id ? 'same' : 'different'] },
        readingConditions: [word, second].map(item => wordsById.get(item.id)!.preparation),
        distractorReason: 'Een identiek woord tegenover een bestaand woord met één verschillende voorbereide klank. Geen losse klank-TTS.',
      }));
    });
  }
  const sources = unique(pack.exercises.filter(item => item.mode?.startsWith('connected-')), item => String(item.contextId));
  return sources.flatMap<PackageExercise>((source, index) => {
    const item = contentById.get(String(source.contextId));
    const step = pack.lessons.find(lesson => lesson.id === source.lessonId);
    if (!item || !step) return [];
    const common: PackageExercise = { ...base, exerciseId: `${pack.id}:group:${activity}:${item.id}`, contextId: item.id,
      sourceContentIds: [item.id], sourceExerciseId: source.exerciseId, lessonId: step.id, sourceLessonIds: [step.id],
      targetWordIds: (source.wordIds as string[]).filter(id => pack.words.some(word => word.id === id)),
      readingConditions: contentReadingConditions(item, step), sourceLevel: item.sourceLevel,
      sourceText: item.text, sourceBlocks: item.blocks, contentTitle: item.title,
      objective: `${activity}:${item.id}`, requiresAudio: false,
      questionAudioNeedId: `${item.id}:question`,
    };
    if (activity === 'text-question' || activity === 'dialogue-question' || activity === 'text-evidence') {
      if (item.kind !== (activity === 'dialogue-question' ? 'dialogue' : 'text') || !item.discussion) return [];
      const question = item.discussion;
      if (!normalize(item.text).includes(normalize(question.evidence))) return [];
      if (activity === 'text-evidence') {
        const sentences = item.text.match(/[^.!?]+[.!?]+(?:[”’"])?|[^.!?]+$/g)?.map(text => text.trim()).filter(Boolean) ?? [];
        // Keep only a precise single-sentence proof. Whole-story evidence cannot be a meaningful selection task.
        const at = sentences.findIndex(text => normalize(text) === normalize(question.evidence));
        if (sentences.length < 2 || at < 0) return [];
        return [{ ...common, question: question.question, questionAudio: registered(`${item.id}:question`, question.question), evidence: question.evidence, activityTypeId: 'TE-02',
          options: sentences.map((label, at) => ({ id: `${at}`, label })), answer: { correctOptionIds: [`${at}`] },
          distractorReason: 'Andere zinnen uit dezelfde bron; de bewijszin bevat het gevraagde antwoord.',
        }];
      }
      const labels = [question.answer, ...question.distractors];
      if (new Set(labels).size !== labels.length || labels.length < 2) return [];
      return [{ ...common, question: question.question, questionAudio: registered(`${item.id}:question`, question.question), evidence: question.evidence, activityTypeId: 'TE-02',
        options: orderedChoices(labels.map((label, at) => ({ id: `${at}`, label, audio: registered(`${item.id}:answer:${at}`, label, 'target') })), seed + index),
        answer: { correctOptionIds: ['0'] }, distractorReason: 'Antwoord en betekenisafleiders ongewijzigd uit de bestaande bronvraag.',
      }];
    }
    if (activity === 'functional-message' || activity === 'functional-form') {
      const task = writingByContent.get(item.id);
      if (!task) return [];
      return [{ ...common, assessment: 'participation', requiresExplicitCompletion: true, activityTypeId: activity === 'functional-form' ? 'PR-02' : 'SC-02',
        writingTask: task, questionAudioNeedId: `${task.id}:prompt`, questionAudio: registered(`${task.id}:prompt`, task.prompt),
        formFields: activity === 'functional-form' ? [{ id: 'from', label: 'Van', options: task.speakers }, { id: 'message', label: 'Bericht' }] : undefined,
        objective: `${activity}:${item.id}:zelf-of-docentcontrole`,
      }];
    }
    if (activity === 'dialogue-role') {
      if (item.kind !== 'dialogue' || item.blocks.length < 2 || !item.blocks.every(block => block.audio?.src)) return [];
      return item.blocks.filter((_, at) => at % 2 === 1).map((block, turn) => ({ ...common,
        exerciseId: `${common.exerciseId}:${turn}`, roleModel: block, cue: item.blocks[turn * 2],
        prompt: { audio: item.blocks[turn * 2].audio }, requiresAudio: true, access: 'supported-listening',
        assessment: 'participation', requiresExplicitCompletion: true, activityTypeId: 'SP-04',
        objective: `SP-04:${item.id}:${turn}:zelf-of-docentcontrole`,
      }));
    }
    if (item.kind !== 'sentence' || item.blocks.length !== 1) return [];
    const tokens = item.text.split(/\s+/);
    if (activity === 'sentence-build') {
      if (tokens.length < 3 || tokens.length > 9 || !item.blocks[0].audio?.src) return [];
      return [{ ...common, componentId: 'ALF-CMP-005', activityTypeId: 'ZI-02',
        prompt: { audio: item.blocks[0].audio }, requiresAudio: true, access: 'supported-listening',
        tiles: orderedChoices(tokens.map((token, at) => ({ id: `${at}`, token })), seed + index),
        answer: { targetTileIds: tokens.map((_, at) => `${at}`) }, helpWord: item.text,
        buildKind: 'sentence', feedback: 'Luister naar de volgorde. Zet dezelfde zin neer.',
        objective: `ZI-02:${item.id}:gehoorde-zinsvolgorde`,
      }];
    }
    if (activity === 'verb-choice') {
      // Narrow, unambiguous subject/verb agreement, not a claim of a complete grammar curriculum.
      const forms: Record<string, string[]> = { ben: ['bent', 'is'], heb: ['hebt', 'heeft'], lees: ['leest', 'lezen'], loop: ['loopt', 'lopen'], zit: ['zitten'], pak: ['pakt', 'pakken'], drink: ['drinkt', 'drinken'], werk: ['werkt', 'werken'], kom: ['komt', 'komen'], ga: ['gaat', 'gaan'], maak: ['maakt', 'maken'], eet: ['eet', 'eten'] };
      if (tokens[0] !== 'Ik' || !forms[tokens[1]] || tokens.length > 9 || tokens.includes('?')) return [];
      const alternatives = unique([tokens[1], ...forms[tokens[1]]], value => value);
      return [{ ...common, activityTypeId: 'ZI-03', question: tokens.map((token, at) => at === 1 ? '…' : token).join(' '),
        sourceText: undefined, sourceBlocks: [], sourceModel: item.text, modelAudio: item.blocks[0].audio,
        options: orderedChoices(alternatives.map(label => ({ id: label, label })), seed + index),
        answer: { correctOptionIds: [tokens[1]] }, rule: 'Bij ik gebruik je hier de ik-vorm van het werkwoord.',
        distractorReason: 'Dezelfde werkwoordbetekenis, maar een vorm die niet bij het onderwerp ik past.',
        objective: `ZI-03:${item.id}:onderwerp-werkwoord`,
      }];
    }
    return [];
  });
}
