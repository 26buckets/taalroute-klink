let rounds: Promise<typeof import('./learner-rounds')> | undefined;

// Keep preload failures attached to the player, including a failed stylesheet download.
export function loadLearnerRounds() {
  return rounds ??= import('./learner-rounds');
}
