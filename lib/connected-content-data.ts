import bank from '../data/klink-connected-content.json' with { type: 'json' };
import routing from '../data/klink-content-routing.json' with { type: 'json' };
import sentenceLevels from '../data/klink-sentence-levels.json' with { type: 'json' };
import longContentLevels from '../data/klink-long-content-levels.json' with { type: 'json' };
import { repairedDialogue, dialogueScene } from './dialogue-repair.ts';

const canonicalItems = new Map(routing.items.map(item => [item.id, item]));
export const sentenceLevelReviews = new Map(sentenceLevels.items.map(item => [item.contentId, item]));
const reviewedLongContent = longContentLevels.items.filter(review => {
  const source = bank.items.find(item => item.id === review.contentId);
  return source?.text === review.text && JSON.stringify(source.discussion ?? null) === JSON.stringify(review.discussion);
});
export const contentLevelReviews = new Map([...sentenceLevels.items, ...reviewedLongContent].map(item => [item.contentId, item]));
export const connectedContent = bank.items.map(item => {
  const review = contentLevelReviews.get(item.id);
  return { ...repairedDialogue(item), wordIds: canonicalItems.get(item.id)!.wordIds,
    // Changed language or comprehension questions require a fresh level review.
    sourceLevel: review?.text === item.text ? review.level : item.sourceLevel };
});
export const contentRouting = routing;
export const contentPlacements = new Map(routing.steps.map(step => [step.id, step.contents]));
export const dialogueImages = new Map(bank.items.filter(item => dialogueScene(item.id)).map(item => [item.id, dialogueScene(item.id)!]));
