import { lessonPackages } from './package-content.ts';
import { exercisesForLesson } from './taalroute-packages.ts';
import { learnerListName } from './learner-copy.ts';

export type TeachingGroup = { id: string; name: string };
export type TeachingLearner = { id: string; group_id: string; name: string };
export type TeachingAssignment = {
  id: string;
  learner_id: string;
  package_id: string;
  lesson_id: string;
  created_at: string;
  completed_at: string | null;
};
export type TeachingWorkspace = {
  person: { id: string; name: string };
  groups: TeachingGroup[];
  learners: TeachingLearner[];
  assignments: TeachingAssignment[];
};
export const teachingCatalog = lessonPackages.map((pack) => ({
  id: pack.id,
  title: learnerListName(pack),
  lessons: pack.lessons
    .filter((lesson) => exercisesForLesson(pack, lesson).length > 0)
    .map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      count: exercisesForLesson(pack, lesson).length,
    })),
}));
export function assignedLesson(packageId: string, lessonId: string) {
  const pack = lessonPackages.find((p) => p.id === packageId);
  const lesson = pack?.lessons.find((l) => l.id === lessonId);
  if (!pack || !lesson) return null;
  const exercises = exercisesForLesson(pack, lesson);
  return exercises.length ? { pack, lesson, exercises } : null;
}
export function assignmentTitle(
  a: Pick<TeachingAssignment, 'package_id' | 'lesson_id'>,
) {
  const entry = assignedLesson(a.package_id, a.lesson_id);
  return entry
    ? `${learnerListName(entry.pack)} · ${entry.lesson.title}`
    : 'Deze leesstap is niet beschikbaar';
}
