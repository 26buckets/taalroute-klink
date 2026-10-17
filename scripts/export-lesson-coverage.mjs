import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { lessonPlan, phaseLabels } from '../lib/lesson-plan.ts';
import { buildChecklist, buildStatusLabels, sentenceBridge } from '../lib/build-checklist.ts';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };

const output = new URL('../outputs/lesson-extension-20261016/', import.meta.url);
mkdirSync(output, { recursive: true });
const routes = packs.flatMap(pack => pack.lessons.map(lesson => ({
  packageId: pack.id, packageTitle: pack.title, lessonId: lesson.id, title: lesson.title,
  known: lesson.known, newWords: lesson.newWords, returning: lesson.returning,
  route: exercisesForLesson(pack, lesson).map(item => ({ id: item.exerciseId, type: item.activityTypeId, phase: item.phase, wordId: item.wordId, mode: item.mode, objective: item.objective, assessment: item.assessment })),
  coverage: lessonPlan(pack, lesson),
  buildChecklist: buildChecklist(pack, lesson),
  sentenceBridge: sentenceBridge(pack, lesson),
})));
const report = {
  curriculum: curriculum.release.id, owner: 'Taalroute', status: 'concept', published: false,
  summary: { wordForms: new Set(curriculum.words.map(word => word.word)).size, meanings: curriculum.words.length,
    groups: packs.filter(pack => pack.kind === 'group').length, coreSteps: curriculum.steps.filter(step => step.kind === 'klanklijst').length,
    recallSteps: curriculum.steps.filter(step => step.kind === 'herhaalronde').length, extensionSets: curriculum.extensions.length,
    individualWordRoutes: routes.filter(route => route.lessonId.startsWith('woord-')).length,
    selectableRoutes: routes.length, exerciseInstances: packs.reduce((sum, pack) => sum + pack.exercises.length, 0),
    guidedInstances: routes.reduce((sum, route) => sum + route.route.length, 0), longestRoute: Math.max(...routes.map(route => route.route.length)) },
  phases: phaseLabels,
  buildStatuses: buildStatusLabels,
  review: { technical: 'See browser-check.json and existing-player-integration/browser-check.json', didactic: 'human-review-open', pronunciation: 'human-review-open', images: 'human-review-open', instructionAudio: 'recorded-review-open', learnerPilot: 'waived-by-owner', standaloneT: 'parked' },
  routes,
};
writeFileSync(new URL('leesstappen-overzicht.json', output), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
