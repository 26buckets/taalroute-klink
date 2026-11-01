'use client';
import { useRef, useState } from 'react';
export async function api<T>(
  path: string,
  school: string,
  body?: unknown,
  key?: string,
): Promise<T> {
  const response = await fetch(
    `/api/inzicht/${path}${path.includes('?') ? '&' : '?'}school=${encodeURIComponent(school)}`,
    {
      cache: 'no-store',
      credentials: 'same-origin',
      ...(body !== undefined
        ? {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': key ?? crypto.randomUUID(),
            },
            body: JSON.stringify(body),
          }
        : {}),
    },
  );
  const result: unknown = await response.json();
  if (!response.ok)
    throw new Error(
      (result as { error?: string }).error ?? 'Ophalen is niet gelukt.',
    );
  return result as T;
}
export function useSave() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const retry = useRef({ signature: '', key: '' });
  async function save<T>(
    path: string,
    school: string,
    body: unknown,
    success: (result: T) => void,
  ) {
    const signature = JSON.stringify({ path, school, body });
    if (retry.current.signature !== signature)
      retry.current = { signature, key: crypto.randomUUID() };
    setBusy(true);
    setError('');
    try {
      const data = await api<T>(path, school, body, retry.current.key);
      retry.current = { signature: '', key: '' };
      success(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan is niet gelukt.');
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, save };
}
