export const classroomHash = '#teacher/plus';
export const classroomMaterialsHash = '#teacher/materials';
export const classroomKey = 'klink.docent.les.v1';
let active = false;

export function rememberClassroomActive(value: boolean) { active = value; }

// Match restoreClassroom's fail-closed rule without loading lesson content on the landing page.
export function readClassroomActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(classroomKey);
    if (raw !== null) {
      if (!raw) active = false;
      else {
        try {
          const value = JSON.parse(raw);
          active = !value || typeof value !== 'object' || value.active !== false;
        } catch { active = true; }
      }
    }
  } catch { /* Keep the current lesson when storage is unavailable. */ }
  return active;
}
