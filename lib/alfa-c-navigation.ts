import { pilotBlocks } from './alfa-c-practice.ts';
import { functionalBlocks } from './alfa-c-functioneel.ts';
import { dailyBlocks } from './alfa-c-dagelijks.ts';
import type { GroupActivity } from './group-practice';

// Existing complete sequences stay intact; this only describes their menu location.
export const alfaCChapters = [
  { id: 'alfa-c-words', legacy: 'words', title: 'Woorden en zinnen', icon: 'book' as const, blocks: pilotBlocks, kind: 'pilot' },
  { id: 'alfa-c-paper', legacy: 'paper', title: 'Lezen en schrijven', icon: 'pen' as const, blocks: functionalBlocks, kind: 'functional' },
  { id: 'alfa-c-messages', legacy: 'messages', title: 'Berichten lezen', icon: 'chat' as const, blocks: dailyBlocks, kind: 'daily' },
].map(chapter => ({ ...chapter, activities: [] as GroupActivity[] }));

export function legacyAlfaCHash(hash: string) {
  const [path, query] = hash.split('?');
  const id = path.split('/')[2];
  const help = new URLSearchParams(query).get('help') === 'guided' ? 'guided' : 'practice';
  const chapter = alfaCChapters.find(chapter => chapter.legacy === id || chapter.blocks.some(block => block.id === id));
  const block = chapter?.blocks.find(block => block.id === id);
  return `#learner/chapters${chapter ? `/${chapter.id}` : ''}${block ? `/sequence/${encodeURIComponent(block.id)}` : ''}?level=alfa-c&help=${help}`;
}
