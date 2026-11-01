import catalogue from '../data/klink-learning-goals.json' with { type: 'json' };
import type {PackageExercise} from './package-content';
import type {ImportedItem} from './imported-practice-contract';

const goals = catalogue.goals as Record<string, {family: keyof typeof catalogue.families;displayLabels: string[];learnerText: string}>;
export function learningGoalFor(exercise: PackageExercise) {
  const task = exercise.contentTask as ImportedItem | undefined;
  let id: string | undefined;
  if (task) id = (catalogue.contentGoals as Record<string,string>)[`${task.domain}:${task.teacherWorkflow?.kind ?? ''}:${task.objective}`];
  else if (typeof exercise.ruleId === 'string') id = (catalogue.rules as Record<string,string>)[exercise.ruleId];
  if (!id && !task) {
    if (exercise.mode === 'word-sort') id = ({meaning:'sorteer-betekenis',spelling:'sorteer-spelling',letter:'sorteer-letter'} as Record<string,string>)[String((exercise.standardTask as {basis?:string})?.basis)];
    else if (exercise.mode === 'word-build' || exercise.mode === 'recall-word') id = exercise.requiresAudio || exercise.mode === 'recall-word' ? 'bouw-gehoord' : 'bouw-model';
    else if ((exercise.mode === 'learning-example' || exercise.mode === 'learning-choice') && exercise.groupActivity === 'spelling-path') id = 'woordspelling';
    else id = (catalogue.modes as Record<string,string>)[exercise.mode];
  }
  const goal = id ? goals[id] : undefined;
  return goal ? {id:id!, ...goal, learnerText:exercise.answerPolicy==='exact-copy'?'Je oefent om de tekst precies over te nemen.':goal.learnerText, colors:catalogue.families[goal.family]} : undefined;
}
