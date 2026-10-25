import { allPackageWords, lessonPackages } from './package-content.ts';

export type WordLibrarySource = 'lessons' | 'extra' | 'saved';
const lessonIds = new Set(lessonPackages.map(pack => pack.id));
export const wordLengths = [
  { id: '2-4', label: '2 tot 4 letters', min: 2, max: 4 },
  { id: '5-6', label: '5 of 6 letters', min: 5, max: 6 },
  { id: '7-9', label: '7 tot 9 letters', min: 7, max: 9 },
  { id: '10-12', label: '10 tot 12 letters', min: 10, max: 12 },
  { id: '13+', label: '13 letters of meer', min: 13, max: Infinity },
];

export function libraryWords(source: WordLibrarySource, filter: string, savedWordIds: string[]) {
  const length = wordLengths.find(item => item.id === filter);
  const words = allPackageWords.filter(word => {
    if (source === 'saved') return savedWordIds.includes(word.id);
    if (source === 'lessons') return lessonIds.has(word.packageId) && (filter === 'all' || filter === word.packageId);
    if (lessonIds.has(word.packageId)) return false;
    if (filter === 'all') return true;
    if (filter === 'signs') return /['’-]/u.test(word.word);
    const count = word.word.match(/\p{L}/gu)?.length ?? 0;
    return !!length && count >= length.min && count <= length.max;
  });
  return source === 'extra' ? words.sort((a, b) => a.word.localeCompare(b.word, 'nl')) : words;
}
