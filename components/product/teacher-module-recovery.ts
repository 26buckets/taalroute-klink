const recoveryKey = 'klink.docent.module-recovery.v1';

export async function loadTeacherWithRecovery<T>(load: () => Promise<T>): Promise<T> {
  try {
    const loaded = await load();
    try { window.sessionStorage.removeItem(recoveryKey); } catch { /* Storage may be blocked. */ }
    return loaded;
  } catch (error) {
    if (typeof window === 'undefined' || !navigator.onLine || !(error instanceof Error) ||
      !/Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|Loading chunk [\w-]+ failed/i.test(error.message)) throw error;
    try {
      if (window.sessionStorage.getItem(recoveryKey)) throw error;
      // Persist before reloading so a missing current file cannot cause a reload loop.
      window.sessionStorage.setItem(recoveryKey, '1');
    } catch { throw error; }
    window.location.reload();
    return new Promise<never>(() => {});
  }
}
