import { pilotBlocks, pilotStorageKey, readPilotProgress, type PilotProgress } from './alfa-c-practice.ts';
import { functionalBlocks, functionalStorageKey, readFunctionalProgress, type FunctionalProgress } from './alfa-c-functioneel.ts';
import { dailyBlocks, dailyStorageKey, readDailyProgress, type DailyProgress } from './alfa-c-dagelijks.ts';
import { functionalActions, functionalResponseReady } from './alfa-c-response.ts';
import { recordRoundSteps, sequenceProgressId } from './round-progress.ts';

export function recordPilotRounds(progress: PilotProgress) {
  for (const block of pilotBlocks) recordRoundSteps(sequenceProgressId('pilot', block.id), block.steps.map(s => s.id), block.steps.filter(s => progress.records[s.id]?.correct).map(s => s.id));
}
export function recordFunctionalRounds(progress: FunctionalProgress) {
  for (const block of functionalBlocks) recordRoundSteps(sequenceProgressId('functional', block.id), block.steps.map(s => s.id), block.steps.filter(s => {
    const record = progress.records[s.id];
    if (!record) return false;
    if (s.kind === 'choice') return record.correct === true;
    if (s.responseSetup || functionalActions(s).length) return record.completed === true && Boolean(record.response && functionalResponseReady(s, record.response));
    return record.assessment === 'participation';
  }).map(s => s.id));
}
export function recordDailyRounds(progress: DailyProgress) {
  for (const block of dailyBlocks) recordRoundSteps(sequenceProgressId('daily', block.id), block.steps.map(s => s.id), block.steps.filter(s => progress.records[s.id]?.last?.correct).map(s => s.id));
}
export function importExistingSequenceProgress() {
  try { recordPilotRounds(readPilotProgress(localStorage.getItem(pilotStorageKey))); } catch { /* Other stores remain independent. */ }
  try { recordFunctionalRounds(readFunctionalProgress(localStorage.getItem(functionalStorageKey))); } catch { /* Other stores remain independent. */ }
  try { recordDailyRounds(readDailyProgress(localStorage.getItem(dailyStorageKey))); } catch { /* Other stores remain independent. */ }
}
