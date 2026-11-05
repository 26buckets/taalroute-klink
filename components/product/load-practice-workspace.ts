export function loadPracticeWorkspace(portal: 'learner' | 'teacher') {
  // These workspaces mount after hydration; keep their data graph out of the Worker.
  if (import.meta.env.SSR) throw new Error('Practice workspaces load in the browser.');
  // Start the selected app download before the shared exercise data finishes evaluating.
  const workspace = import('./practice-workspace');
  // Separate call sites prevent the bundler from preloading the other portal's dependencies.
  if (portal === 'learner') return Promise.all([workspace, import('./learner-app')]).then(([loaded]) => loaded);
  return Promise.all([workspace, import('./staff-apps')]).then(([loaded]) => loaded);
}
