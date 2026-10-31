import originalWorksheets from '../data/klink-docent-worksheets.json' with { type: 'json' };
import additionalLessons from '../data/klink-docent-extra-lessons.json' with { type: 'json' };
import nextLessons from '../data/klink-docent-extra-lessons-10-15.json' with { type: 'json' };
import type { ClassroomRoute } from './teacher-classroom.ts';

export const worksheets = [...originalWorksheets, ...[...additionalLessons, ...nextLessons].map(lesson => lesson.worksheet)];
export function worksheetSelection(hash: string) {
  const query = new URLSearchParams(hash.split('?')[1] ?? '');
  const lesson = worksheets.find(lesson => lesson.id === query.get('lesson'));
  const round = query.get('round');
  return { lesson, round: (round === 'b' || round === 'c' ? round : 'a') as ClassroomRoute, fromLesson: query.get('from') === 'lesson' };
}
export function worksheetHash(lessonId: string, round: ClassroomRoute = 'a', fromLesson = false) {
  return `#teacher/materials?lesson=${encodeURIComponent(lessonId)}&round=${round}${fromLesson ? '&from=lesson' : ''}`;
}
