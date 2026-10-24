import type { LessonPosition, PackageDefinition } from './package-content';
import { lessonContentLevel, type RouteSettings } from './learner-route.ts';

export const progressKey = 'klink.taalroute.route.v1';
export type RouteProgress = { position?: LessonPosition; completed: string[] };

export function homeLessonPosition(packs: PackageDefinition[], progress: RouteProgress, literacy: RouteSettings['literacy']): LessonPosition | undefined {
  const lessons = packs.flatMap(pack => pack.lessons
    .filter(lesson => lesson.guidedExerciseIds?.length && (literacy === 'all' || lessonContentLevel(pack, lesson) === literacy))
    .map(lesson => ({ packageId: pack.id, lessonId: lesson.id, exerciseId: lesson.guidedExerciseIds![0] })));
  if (lessons.some(lesson => lesson.packageId === progress.position?.packageId && lesson.lessonId === progress.position.lessonId)) return progress.position;
  return lessons.find(lesson => !progress.completed.includes(lesson.lessonId)) ?? lessons[0];
}

export function parseProgress(raw: string | null, packs: PackageDefinition[]): RouteProgress {
  try {
    const data: unknown = JSON.parse(raw ?? '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { completed: [] };
    const value = data as Record<string, unknown>;
    const lessons = new Set(packs.flatMap(pack => pack.lessons.map(lesson => lesson.id)));
    const completed = Array.isArray(value.completed) ? [...new Set(value.completed.filter((id): id is string => typeof id === 'string' && lessons.has(id)))] : [];
    const position = value.position as Partial<LessonPosition> | null;
    const pack = packs.find(item => item.id === position?.packageId || (position?.packageId && item.aliases?.includes(position.packageId)));
    const lesson = pack?.lessons.find(item => item.id === position?.lessonId);
    if (!lesson || !position?.exerciseId) return { completed };
    const exerciseId = lesson.guidedExerciseIds?.includes(position.exerciseId) ? position.exerciseId
      : pack!.exercises.find(item => item.lessonId === lesson.id && item.replacesExerciseId === position.exerciseId && lesson.guidedExerciseIds?.includes(item.exerciseId))?.exerciseId;
    if (!exerciseId) return { completed };
    return { completed, position: { packageId: pack!.id, lessonId: lesson.id, exerciseId } };
  } catch { return { completed: [] }; }
}

// Resume a place, not a claim of mastery. Completion never means pronunciation was approved.
export function nextLessonPosition(packs: PackageDefinition[], packId: string, lessonId: string): LessonPosition | undefined {
  const pack = packs.find(item => item.id === packId || item.aliases?.includes(packId));
  const index = pack?.lessons.findIndex(item => item.id === lessonId) ?? -1;
  if (!pack || index < 0) return;
  let nextPack = pack;
  let lesson = pack.lessons[index + 1];
  if (!lesson && lessonId === 'klink-leesstap-05') {
    const continuation = packs.find(item => item.lessons.some(next => next.id === 'klink-leesstap-06'));
    if (!continuation) return;
    nextPack = continuation;
    lesson = continuation.lessons.find(item => item.id === 'klink-leesstap-06')!;
  }
  if (!lesson?.guidedExerciseIds?.length) return;
  return { packageId: nextPack.id, lessonId: lesson.id, exerciseId: lesson.guidedExerciseIds[0] };
}
