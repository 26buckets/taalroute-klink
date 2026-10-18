import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import ruleData from '../data/klink-learning-rules.json' with { type: 'json' };
import { contentById } from './connected-content.ts';
import { orderedChoices } from './extended-practice.ts';
import { resolveRegisteredAudio } from './audio-register.ts';
import { instructionAudioEnabled } from './audio-policy.ts';
import type { PackageDefinition, PackageExercise, PackageWord } from './package-content';

export const learningActivities = [
  { id: 'sound-path', label: 'Klanken in woorden', category: 'Klanken horen', icon: 'ear' },
  { id: 'spelling-path', label: 'Zo schrijf je het', category: 'Woorden maken', icon: 'keyboard' },
  { id: 'grammar-path', label: 'Zo maak je een zin', category: 'Zinnen maken', icon: 'puzzle' },
  { id: 'practical-path', label: 'Van gesprek naar zelf doen', category: 'Schrijven en spreken', icon: 'chat' },
  { id: 'reading-path', label: 'Lezen en begrijpen', category: 'Zinnen en verhalen', icon: 'book' },
] as const;
export type LearningActivity = typeof learningActivities[number]['id'];
export const learningRules = ruleData.rules;
const words = new Map(curriculum.words.map(word => [word.id, word]));
const transparent = new Set(['a', 'e', 'i', 'o', 'u', 'aa', 'ee', 'oo', 'uu', 'ie', 'oe', 'eu', 'ui', 'm', 'n', 'l', 'r', 's', 'f', 'p', 't', 'k', 'b', 'h', 'j', 'v', 'w', 'z']);
type Existing = (activity: string) => PackageExercise[];
type Stage = 'example' | 'practice' | 'use' | 'recall';
const text = (value: unknown) => typeof value === 'string' ? value : '';
function ruleAudio(rule: typeof learningRules[number], part: 'instruction' | 'example') {
  const id = `learning:${rule.id}:${part}`;
  const src = instructionAudioEnabled ? resolveRegisteredAudio(id, part === 'example' ? rule.explanation : rule.instruction, 'instruction') : undefined;
  return src ? { audioId: id, src } : undefined;
}

function wrap(pack: PackageDefinition, activity: LearningActivity, id: string, title: string, source: PackageExercise, stage: Stage, index: number): PackageExercise {
  const exerciseId = `${pack.id}:${activity}:${id}:${stage}:${index}`;
  // Change positions between practice and recall, never during a retry.
  const seed = Array.from(exerciseId).reduce((value, letter) => (Math.imul(value, 31) + letter.charCodeAt(0)) | 0, 7);
  return { ...source, exerciseId, sourceExerciseId: source.sourceExerciseId ?? source.exerciseId,
    ...(stage === 'recall' && Array.isArray(source.options) ? { options: orderedChoices(source.options, seed) } : {}),
    learningPathId: id, learningPathTitle: title, learningStage: stage, learningActivity: activity,
    // A listening route or an answer after a model never establishes independent reading.
    sourceStatus: 'concept', combinationReview: 'open', independentReading: false, access: 'teacher-supported',
    objective: `${activity}:${id}:${text(source.wordId) || text(source.contextId) || index}`, instructionAudio: instructionAudioEnabled ? source.instructionAudio : undefined,
    requiresExplicitCompletion: source.mode === 'learning-example' ? false : source.requiresExplicitCompletion,
    assessment: source.assessment ?? 'answer', reviewEligible: stage === 'recall' && source.assessment !== 'participation',
  };
}

function example(rule: typeof learningRules[number], source: PackageExercise, display: string): PackageExercise {
  return { ...source, componentId: 'KLINK-LEARNING', mode: 'learning-example', title: 'Kijk en luister.',
    explanation: rule.explanation, displayWord: display, requiresAudio: false, assessment: 'participation',
    requiresExplicitCompletion: true, ruleId: rule.id, instructionNeedId: `learning:${rule.id}:example`, instructionAudio: ruleAudio(rule, 'example'), readingTask: false,
    ...('position' in rule ? { modelUnits: display.split(' · '), modelFocus: rule.position } : {}) };
}

function selection(rule: typeof learningRules[number], source: PackageExercise, options: string[], answer: string, seed: number, maskedWord?: string): PackageExercise {
  return { ...source, componentId: 'KLINK-LEARNING', mode: 'learning-choice', title: rule.instruction,
    text: undefined, exampleWord: undefined, displayWord: undefined, sourceText: undefined, sourceBlocks: undefined,
    prompt: { audio: source.prompt?.audio }, requiresAudio: true, assessment: 'answer', readingTask: false,
    maskedWord, ruleId: rule.id, instructionNeedId: `learning:${rule.id}:instruction`, instructionAudio: ruleAudio(rule, 'instruction'), explanation: rule.explanation, helpWord: text((source.text as { primary?: string })?.primary) || text(source.helpWord),
    options: orderedChoices(options.map(label => ({ id: label, label })), seed), answer: { correctOptionIds: [answer] },
    feedback: rule.id === 'grammar-we' ? 'Kijk naar wij of we. Vergelijk de zin met het voorbeeld.'
      : rule.id === 'sound-first' ? 'Luister nog eens naar het begin van het woord.'
      : rule.id === 'sound-middle' ? 'Luister nog eens naar het midden van het woord.'
      : rule.id === 'sound-last' ? 'Luister nog eens naar het einde van het woord.'
      : 'Luister nog eens. Vergelijk de lege plek met het voorbeeld.',
    distractorReason: 'De bedoelde klankpositie of spellingregel verschilt; geen willekeurige betekenisafleiders.',
  };
}

export function learningExercises(pack: PackageDefinition, activity: LearningActivity, existing: Existing): PackageExercise[] {
  const lookup = existing;
  const cache = new Map<string, PackageExercise[]>();
  existing = id => { if (!cache.has(id)) cache.set(id, lookup(id)); return cache.get(id)!; };
  const result: PackageExercise[] = [];
  function route(id: string, title: string, steps: { exercise: PackageExercise; stage: Stage }[]) {
    steps.forEach(({ exercise, stage }, index) => result.push(wrap(pack, activity, id, title, exercise, stage, index)));
  }
  const models = existing('meet');
  const modelFor = (word: PackageWord) => models.find(item => item.wordId === word.id);
  const soundWords = pack.words.filter(word => {
    const units = words.get(word.id)?.reading.units;
    return word.audio && units?.length === 3 && units.every(unit => !unit.value && transparent.has(unit.coreUnit)) && units.map(unit => unit.text).join('') === word.word;
  });
  if (activity === 'sound-path' || activity === 'spelling-path') {
    for (const rule of learningRules.filter(item => item.activity === activity)) {
      const candidates: { word: PackageWord; answer: string; options: string[]; mask?: string; display: string; extra?: string[] }[] = [];
      if ('position' in rule && typeof rule.position === 'number') {
        const position = rule.position;
        for (const word of soundWords) {
          const unit = words.get(word.id)!.reading.units[position].text;
          const other = soundWords.find(candidate => words.get(candidate.id)!.reading.units[position].text !== unit);
          if (other) candidates.push({ word, answer: unit, options: [unit, words.get(other.id)!.reading.units[position].text], display: words.get(word.id)!.reading.units.map(u => u.text).join(' · '), extra: [other.id] });
        }
      } else if ('units' in rule && rule.units) {
        for (const word of soundWords) {
          const units = words.get(word.id)!.reading.units;
          const at = units.findIndex(unit => rule.units!.includes(unit.text));
          if (at < 0) continue;
          const other = soundWords.find(candidate => candidate.id !== word.id && rule.units!.includes(words.get(candidate.id)!.reading.units[1].text) && words.get(candidate.id)!.reading.units[1].text !== units[at].text);
          if (other) candidates.push({ word, answer: units[at].text, options: [units[at].text, words.get(other.id)!.reading.units[1].text], mask: units.map((unit, index) => index === at ? '…' : unit.text).join(''), display: word.word, extra: [other.id] });
        }
      } else if ('pairs' in rule && rule.pairs) {
        for (const [singular, plural, syllables] of rule.pairs) {
          const word = pack.words.find(item => item.word === plural && item.audio);
          // The singular is an explicit prerequisite from the canonical word bank, not a new target.
          const first = curriculum.words.find(item => item.word === singular);
          if (!word || !first) continue;
          const doubled = rule.id === 'spelling-double';
          const at = doubled ? 2 : 1;
          const answer = doubled ? word.word.slice(at, at + 2) : word.word[at];
          candidates.push({ word, answer, options: [answer, doubled ? answer[0] : answer.repeat(2)], mask: word.word.slice(0, at) + '…' + word.word.slice(at + answer.length), display: `${singular} → ${plural} · ${syllables}`, extra: [first.id] });
        }
      }
      // Short routes, each with a model, several targets and delayed retrieval in reverse order.
      for (let offset = 0; offset < candidates.length; offset += 6) {
        const batch = candidates.slice(offset, offset + 6).filter(item => modelFor(item.word));
        if (!batch.length) continue;
        const id = `${rule.id}-${offset / 6 + 1}`;
        const title = `${rule.title} · ${batch[0].word.word}`;
        const trials = batch.map((item, index) => {
          const source = modelFor(item.word)!;
          return selection(rule, { ...source, readingConditions: [item.word.id, ...(item.extra ?? [])].map(id => ({ wordId: id, ...words.get(id)!.preparation })), targetWordIds: [item.word.id],
            prerequisiteWordIds: item.extra, sourceLessonIds: source.sourceLessonIds ?? (source.lessonId ? [source.lessonId] : []) }, item.options, item.answer, index + 17, item.mask);
        });
        const steps: { exercise: PackageExercise; stage: Stage }[] = [{ exercise: example(rule, { ...modelFor(batch[0].word)!, readingConditions: trials[0].readingConditions, prerequisiteWordIds: batch[0].extra }, batch[0].display), stage: 'example' }, ...trials.map(exercise => ({ exercise, stage: 'practice' as const }))];
        const builds = existing('build').filter(exercise => batch.some(item => item.word.id === exercise.wordId));
        steps.push(...builds.slice(0, 2).map(exercise => ({ exercise, stage: 'use' as const })));
        steps.push(...trials.slice().reverse().map(exercise => ({ exercise, stage: 'recall' as const })));
        route(id, title, steps);
      }
    }
  }
  if (activity === 'grammar-path') {
    const sources = existing('sentences');
    const forms: Record<string, string> = { kijken: 'kijkt', zoeken: 'zoekt', gaan: 'gaat', maken: 'maakt', staan: 'staat', lopen: 'loopt', springen: 'springt', dekken: 'dekt', wassen: 'wast', trekken: 'trekt', pakken: 'pakt', helpen: 'helpt', ruimen: 'ruimt', fietsen: 'fietst', lezen: 'leest', nemen: 'neemt', bezoeken: 'bezoekt', stappen: 'stapt', controleren: 'controleert' };
    const rule = learningRules.find(item => item.id === 'grammar-we')!;
    const selected = sources.filter(source => { const text = contentById.get(String(source.contextId))?.text ?? ''; const tokens = text.split(' '); return /^(Wij|We)$/.test(tokens[0]) && Boolean(forms[tokens[1]]) && tokens.length <= 10; });
    for (let offset = 0; offset < selected.length; offset += 6) {
      const batch = selected.slice(offset, offset + 6);
      if (!batch.length) continue;
      const trials = batch.map((source, index) => {
        const text = contentById.get(String(source.contextId))!.text, tokens = text.split(' ');
        return { ...selection(rule, source, [tokens[1], forms[tokens[1]]], tokens[1], index + 5), requiresAudio: false,
          prompt: undefined, textBlocks: undefined, question: tokens.map((token, at) => at === 1 ? '…' : token).join(' '), helpWord: text, modelAudio: source.prompt?.audio };
      });
      route(`${rule.id}-${offset / 6 + 1}`, `${rule.title} · ${pack.words[0]?.word ?? 'zinnen'} ${offset / 6 + 1}`, [
        { exercise: example(rule, batch[0], contentById.get(String(batch[0].contextId))!.text), stage: 'example' },
        ...trials.map(exercise => ({ exercise, stage: 'practice' as const })),
        ...existing('sentence-build').filter(exercise => batch.some(source => source.contextId === exercise.contextId)).slice(0, 2).map(exercise => ({ exercise, stage: 'use' as const })),
        ...trials.slice().reverse().map(exercise => ({ exercise, stage: 'recall' as const })),
      ]);
    }
    const questionRule = learningRules.find(item => item.id === 'grammar-question')!;
    const questions = existing('sentence-build').filter(source => /^(Zie|Wil|Heb|Ga|Kom|Pak|Lees|Maak|Drink|Eet) (jij|je)\b.*\?$/.test(contentById.get(String(source.contextId))?.text ?? ''));
    for (let offset = 0; offset < questions.length; offset += 6) {
      const batch = questions.slice(offset, offset + 6);
      route(`grammar-question-${offset / 6 + 1}`, `Een vraag maken · ${offset / 6 + 1}`, [
        { exercise: example(questionRule, batch[0], contentById.get(String(batch[0].contextId))!.text), stage: 'example' },
        ...batch.map(exercise => ({ exercise, stage: 'practice' as const })),
        ...batch.slice().reverse().map(exercise => ({ exercise, stage: 'recall' as const })),
      ]);
    }
  }
  if (activity === 'practical-path' || activity === 'reading-path') {
    const practical = activity === 'practical-path';
    const questions = existing(practical ? 'dialogue-question' : 'text-question');
    const sources = existing(practical ? 'dialogues' : 'texts');
    for (const source of sources) {
      const question = questions.find(item => item.contextId === source.contextId);
      if (!question) continue;
      const continuation = practical
        ? [...existing('dialogue-role').filter(item => item.contextId === source.contextId), ...existing('functional-message').filter(item => item.contextId === source.contextId)]
        : existing('text-evidence').filter(item => item.contextId === source.contextId);
      if (!continuation.length) continue;
      route(text(source.contextId), text(source.contentTitle) || text(source.title), [
        { exercise: source, stage: 'example' }, { exercise: question, stage: 'practice' },
        ...continuation.map(exercise => ({ exercise, stage: 'use' as const })),
        { exercise: question, stage: 'recall' },
      ]);
    }
  }
  return result;
}
