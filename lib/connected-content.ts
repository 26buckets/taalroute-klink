import { connectedContent, contentLevelReviews, contentPlacements, dialogueImages } from './connected-content-data.ts';
import type bank from '../data/klink-connected-content.json';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import instructions from '../data/klink-instructions.json' with { type: 'json' };
import type { PackageExercise, PackageLesson } from './package-content';

export type ConnectedContent = typeof bank.items[number];
export { connectedContent, contentRouting, sentenceLevelReviews } from './connected-content-data.ts';
export const contentById = new Map(connectedContent.map(item => [item.id, item]));
const wordsById = new Map(curriculum.words.map(word => [word.id, word]));
const unique = (ids: string[]) => [...new Set(ids)];
export function contentPlacementForStep(stepId: string, contentId: string) {
  return contentPlacements.get(stepId)?.find(item => item.contentId === contentId);
}
type Step = Pick<PackageLesson, 'id' | 'known' | 'newWords' | 'returning'>;
export function contentForStep(step: Step) {
  return (contentPlacements.get(step.id) ?? []).map(row => contentById.get(row.contentId)!);
}

export function contentReadingConditions(item: ConnectedContent, step: Step) {
  const review = contentLevelReviews.get(item.id);
  const prepared = new Set([...(step.known ?? []), ...(step.newWords ?? []), ...(step.returning ?? [])]);
  const words = item.readingWordIds.map(id => wordsById.get(id)!);
  const meanings: Record<string, string | undefined> = item.reading.meaningOverrides ?? {};
  const preparedUnits = new Set([...prepared].flatMap(id => wordsById.get(id)?.reading.requirements ?? []));
  return {
    wordIds: words.map(word => word.id),
    // Knowing the spelling or another sense does not prepare this contextual meaning.
    otherWords: words.filter(word => !prepared.has(word.id) || meanings[word.id]).map(word => ({ id: word.id, word: word.word, meaning: meanings[word.id] ?? word.meaning, firstReading: word.firstReading })),
    outsideWordBank: item.reading.outsideWordBank,
    requiredUnits: unique(words.flatMap(word => word.reading.requirements)),
    unitsOutsideStep: unique(words.flatMap(word => word.reading.requirements)).filter(unit => !preparedUnits.has(unit)),
    wordConditions: unique([...words.flatMap(word => [...word.reading.conditions, ...('additionalConditions' in word.firstReading && word.firstReading.additionalConditions ? [word.firstReading.additionalConditions] : []), ...(meanings[word.id] ? [`Betekenis van ${word.word} in deze bron: ${meanings[word.id]}`] : [])]), ...(review?.text === item.text && review.preparation ? [review.preparation] : [])]),
    access: 'supported-listening' as const,
    independentReading: false,
    note: 'Bereid betekenis, verwijswoorden en zinsverband mondeling voor. Controleer ook namen en overige woordvormen buiten de woordenbank. Een woordverband of klankoverlap is geen bewijs dat de hele tekst zelfstandig leesbaar is.',
  };
}

export function connectedExercisesForStep(step: Step): PackageExercise[] {
  const instruction = instructions.items.find(item => item.id === 'meeluisteren')!;
  return contentForStep(step).map(item => {
    const placement = contentPlacementForStep(step.id, item.id)!;
    const targets = unique([...placement.firstWordIds, ...placement.returningWordIds]);
    return ({
    exerciseId: `${step.id}:${item.id}`, componentId: 'ALF-CMP-007', contractVersion: '1.0',
    mode: `connected-${item.kind}`, title: item.kind === 'sentence' ? 'Luister naar de zin.' : item.kind === 'text' ? 'Luister naar de tekst.' : 'Luister naar het gesprek.',
    contentTitle: item.title, lessonId: step.id, contextId: item.id, wordId: targets[0],
    wordIds: targets, phase: 'use', activityTypeId: 'TE-01',
    objective: 'Een voorbereid woord volgen in bestaande samenhangende taal, met luistersteun. Geen zelfstandig lees- of begripsresultaat.',
    sourceStatus: item.humanReview === 'approved' ? 'approved' : 'concept', assessment: 'participation', requiresAudio: true,
    instructionAudio: { src: instruction.src, audioId: instruction.id },
    prompt: { text: 'Luister en lees mee.', audio: item.blocks[0].audio, ...(item.kind === 'dialogue' && dialogueImages.get(item.id) ? { image: dialogueImages.get(item.id) } : {}) },
    textBlocks: item.blocks, playAllBlocks: true, access: 'supported-listening', independentReading: false, humanReview: item.humanReview,
    contentPlacement: placement, recurrenceOnlyAfterIntroduction: placement.returningWordIds.length > 0,
  }); });
}
