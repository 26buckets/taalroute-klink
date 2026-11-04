export function loadPracticeWorkspace(portal: 'learner' | 'teacher') {
  // These workspaces mount after hydration; keep their data graph out of the Worker.
  if (import.meta.env.SSR) throw new Error('Practice workspaces load in the browser.');
  // Start the selected app download before the shared exercise data finishes evaluating.
  return Promise.all([
    import('./practice-workspace'),
    portal === 'learner' ? import('./learner-app') : import('./staff-apps'),
  ]).then(([workspace]) => workspace);
}
