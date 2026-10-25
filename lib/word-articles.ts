import articles from '../data/klink-word-articles.json' with { type: 'json' };

// Meaning IDs, never spelling, decide the article; exercise answers keep the bare word.
export function wordWithArticle(word: { id: string; word: string } | undefined) {
  const article = word && (articles as Record<string, string>)[word.id];
  return article ? `${article} ${word!.word}` : undefined;
}
