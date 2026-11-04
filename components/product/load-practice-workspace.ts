export function loadPracticeWorkspace(portal: 'learner' | 'teacher') {
  // Start the selected app download before the shared exercise data finishes evaluating.
  return Promise.all([
    import('./practice-workspace'),
    portal === 'learner' ? import('./learner-app') : import('./staff-apps'),
  ]).then(([workspace]) => workspace);
}
