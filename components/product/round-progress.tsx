'use client';
import { useEffect, useState } from 'react';
import { roundProgressEvent, roundStorageFailed } from '@/lib/round-progress';

export function useRoundProgress() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const update = () => setRevision(value => value + 1);
    update();
    window.addEventListener(roundProgressEvent, update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener(roundProgressEvent, update); window.removeEventListener('storage', update); };
  }, []);
  return revision > 0;
}

export function RoundProgressNotice() {
  const ready = useRoundProgress();
  return ready && roundStorageFailed() ? <p role="alert">Je voortgang kan niet worden bewaard op dit apparaat. Je kunt wel verder oefenen.</p> : null;
}
