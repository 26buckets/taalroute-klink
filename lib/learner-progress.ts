import type { LessonPosition, PackageDefinition } from './package-content';

export const progressKey = 'klink.taalroute.route.v1';
export type RouteProgress = { position?: LessonPosition; completed: string[] };

export function parseProgress(raw: string | null, packs: PackageDefinition[]): RouteProgress {
  try {
    const data: unknown = JSON.parse(raw ?? '{}');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { completed: [] };
    const value = data as Record<string, unknown>;
    const lessons = new Set(packs.flatMap(pack => pack.lessons.map(lesson => lesson.id)));
    const completed = Array.isArray(value.completed) ? [...new Set(value.completed.filter((id): id is string => typeof id === 'string' && lessons.has(id)))] : [];
    const position = value.position as Partial<LessonPosition> | null;
    const pack = packs.find(item => item.id === position?.packageId);
    const lesson = pack?.lessons.find(item => item.id === position?.lessonId);
    if (!lesson || !position?.exerciseId || !lesson.guidedExerciseIds?.includes(position.exerciseId)) return { completed };
    return { completed, position: { packageId: pack!.id, lessonId: lesson.id, exerciseId: position.exerciseId } };
  } catch { return { completed: [] }; }
}

// Resume a place, not a claim of mastery. Completion never means pronunciation was approved.
export function nextLessonPosition(packs: PackageDefinition[], packId: string, lessonId: string): LessonPosition | undefined {
  const pack = packs.find(item => item.id === packId);
  const index = pack?.lessons.findIndex(item => item.id === lessonId) ?? -1;
  if (!pack || index < 0) return;
  const lesson = pack.lessons[index + 1];
  if (!lesson?.guidedExerciseIds?.length) return;
  return { packageId: pack.id, lessonId: lesson.id, exerciseId: lesson.guidedExerciseIds[0] };
}
