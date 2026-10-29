'use client';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import alignment from '@/data/klink-alfa-c-readalong.json';
import { playMedia } from './shared';
import type { AudioOptions } from '@/lib/package-content';

const clips = new Map(alignment.clips.map(clip => [clip.src, clip]));
type Reading = { clip: typeof alignment.clips[number]; active: number };
export function useAlfaCReadAlong() {
  const [reading, setReading] = useState<Reading>();
  async function play(source: string, options: AudioOptions, visible: boolean) {
    const clip = visible ? clips.get(source) : undefined;
    if (clip) setReading({ clip, active: -1 });
    else if (!visible) setReading(undefined);
    try {
      return await playMedia(source, { ...options, ...(clip ? { onProgress: (seconds: number) => {
        const active = clip.words.findIndex(word => word.start <= seconds && seconds < word.end);
        setReading(previous => previous?.clip === clip && previous.active !== active ? { clip, active } : previous);
      } } : {}) });
    } finally {
      if (clip) setReading(previous => previous?.clip === clip ? { clip, active: -1 } : previous);
    }
  }
  return { reading, play, clear: () => setReading(undefined) };
}

export function AlfaCExplanation({ reading, onClose }: { reading: Reading; onClose: () => void }) {
  return <aside className="ac-explanation"><h3>Uitleg</h3><p aria-label={reading.clip.text}>{reading.clip.words.map((word, index) => <span key={index} className={index === reading.active ? 'is-spoken' : undefined} data-word={index}>{word.text}{' '}</span>)}</p><button className="secondary-button" onClick={onClose}>Naar de opdracht<ArrowRight /></button></aside>;
}
