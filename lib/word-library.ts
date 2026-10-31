import { allPackageWords, wordLabel } from './package-content.ts';

export const wordLibraryPageSize = 24;
export type WordLibrarySource = 'all' | 'saved';
export type WordLibraryIndex = {
  chapters: { id: string; title: string; activities: string[] }[];
  activities: { id: string; label: string }[];
  collections: { id: string; activity: string; title: string; levels: Record<string, string[]> }[];
  unmappedTargetIds: string[];
};
export type WordLibraryFilter = { source: WordLibrarySource; query: string; level: string; chapter: string; collection: string };
export const defaultWordLibraryFilter: WordLibraryFilter = { source: 'all', query: '', level: 'all', chapter: 'all', collection: 'all' };
const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('nl').trim();
const sortedWords = [...allPackageWords].sort((a, b) => wordLabel(a).localeCompare(wordLabel(b), 'nl'));

export function libraryCollections(index: WordLibraryIndex, filter: Pick<WordLibraryFilter, 'level' | 'chapter'>) {
  const chapter = index.chapters.find(item => item.id === filter.chapter);
  return index.collections.filter(item => (filter.chapter === 'all' || chapter?.activities.includes(item.activity)) && (filter.level === 'all' || item.levels[filter.level]?.length));
}

export function libraryWords(filter: WordLibraryFilter, savedWordIds: string[], index: WordLibraryIndex | null) {
  const filtered = filter.level !== 'all' || filter.chapter !== 'all' || filter.collection !== 'all';
  const memberships = filtered ? new Set(index ? libraryCollections(index, filter).filter(item => filter.collection === 'all' || item.id === filter.collection).flatMap(item => filter.level === 'all' ? Object.values(item.levels).flat() : item.levels[filter.level] ?? []) : []) : null;
  const query = normalize(filter.query), saved = new Set(savedWordIds);
  return sortedWords.filter(word => (filter.source === 'all' || saved.has(word.id)) && (!query || normalize(wordLabel(word)).includes(query)) && (!memberships || memberships.has(word.id)));
}
