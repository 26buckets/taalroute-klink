import bindings from '../data/klink-audio-bindings.json' with { type: 'json' };

export type AudioBinding = {
  src: string;
  transcript: string;
  role: string;
  voiceId: string;
  review: string; // JSON statuses are validated by the resolver before playback.
  metadataApproved: boolean;
};
export type AudioRegisterRow = {
  id: string;
  kind: string;
  role: string;
  text: string;
  src?: string;
  candidateSrc?: string;
  status: 'connected' | 'missing' | 'archive' | 'parked' | 'review';
  placement: 'active' | 'preparation' | 'unplaced';
  wordIds: string[];
  lessonIds: string[];
  sectionIds: string[];
  voiceId?: string;
  review: string;
  note?: string;
  existingAudioId?: string;
};
export const audioStatusLabels = {
  connected: 'Bestand gekoppeld',
  missing: 'Opname ontbreekt',
  archive: 'Archiefkandidaat',
  parked: 'Geparkeerd',
  review: 'Opname klaar — beoordelen',
};

// A later recording may fill an empty slot, never silently replace existing approved audio.
export function resolveRegisteredAudio(
  id: string,
  transcript: string,
  role: string,
  existing?: string,
  registry: Record<string, AudioBinding> = bindings,
) {
  if (existing) return existing;
  const entry = registry[id];
  if (
    !entry ||
    entry.review !== 'approved' ||
    !entry.metadataApproved ||
    !entry.voiceId ||
    entry.transcript !== transcript ||
    entry.role !== role ||
    !/^\/package-audio\/[a-zA-Z0-9_./-]+\.(wav|mp3|ogg|m4a)$/.test(entry.src) ||
    entry.src.includes('..')
  )
    return undefined;
  return entry.src;
}
