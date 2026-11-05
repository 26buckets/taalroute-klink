import daily from '../data/klink-alfa-c-dagelijks-audio.json' with { type: 'json' };
import functional from '../data/klink-alfa-c-functioneel-audio.json' with { type: 'json' };

// Audio lookup data is needed by the selected player, not by menus or saved-progress validation.
const dailySources = new Map(daily.clips.map(clip => [clip.id, clip.src]));
export const dailyAudio = (id: string) => dailySources.get(id) ?? '';
const functionalSources = new Map(functional.clips.map(clip => [clip.role + '|' + clip.text, clip.src]));
export const functionalAudio = (role: 'guide' | 'target', text: string) => functionalSources.get(role + '|' + text);
