import { contentLevels, type ContentLevel } from './content-levels.ts';
import { parseChapterHash } from './practice-chapters.ts';
import type { RouteSettings } from './learner-route';

export const practicePreferencesKey = 'klink.taalroute.practice-navigation.v1';
export type PracticePreferences = { level: ContentLevel; help: 'practice' | 'guided' };
export const defaultPracticePreferences: PracticePreferences = { level: 'alfa-a', help: 'practice' };

export function parsePracticePreferences(raw: string | null, settings?: RouteSettings): PracticePreferences {
  const fallback = settings?.literacy !== undefined && settings.literacy !== 'all' ? settings.literacy : settings?.language !== undefined && settings.language !== 'all' ? settings.language : 'alfa-a';
  try {
    const value = JSON.parse(raw ?? '{}');
    return {
      level: contentLevels.some(item => item.id === value?.level) ? value.level : fallback,
      help: value?.help === 'guided' ? 'guided' : 'practice',
    };
  } catch { return { level: fallback, help: 'practice' }; }
}

export function practiceLocation(hash: string, preferences: PracticePreferences) {
  const location = parseChapterHash(hash);
  // Old inner links without a filter retain their original complete collections.
  const explicitLevel = location.chapter || new URLSearchParams(hash.split('?')[1]).has('level');
  return { ...location, level: explicitLevel ? location.level : preferences.level, help: location.help ?? (location.chapter ? undefined : preferences.help) };
}
