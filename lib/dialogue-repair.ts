import repair from '../data/klink-dialogue-repair.json' with { type: 'json' };

type Source = { id: string; kind: string; blocks: { id: string; text: string; speaker?: string; audio: { src: string; audioId: string } }[] };
const repairs = new Map(repair.dialogues.map(item => [item.id, item]));
export function repairedDialogue<T extends Source>(source: T): T {
  const replacement = repairs.get(source.id);
  if (!replacement || source.kind !== 'dialogue') return source;
  if (replacement.turns.length !== source.blocks.length) throw new Error(`Incomplete dialogue repair: ${source.id}`);
  const blocks = source.blocks.map((block, index) => {
    const turn = replacement.turns[index];
    if (turn.id !== block.id || turn.text !== block.text || turn.originalSrc !== block.audio.src || !turn.metadataVerified || turn.status !== 'candidate') throw new Error(`Dialogue source mismatch: ${block.id}`);
    return { ...block, speaker: turn.speaker, personId: turn.personId, voiceId: turn.voiceId, originalAudio: block.audio, audio: { src: turn.src, audioId: `${block.id}:cast-v1` } };
  });
  return { ...source, blocks };
}
export const dialogueScene = (id: string) => repairs.get(id)?.image;
