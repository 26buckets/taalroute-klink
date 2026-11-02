'use client';
import { useRef, useState } from 'react';
export async function api<T>(
  path: string,
  school: string,
  body?: unknown,
  key?: string,
): Promise<T> {
  // A read can be retried; a cancelled write may already be committed.
  const signal = body === undefined ? AbortSignal.timeout(10000) : undefined;
  try {
    const response = await fetch(
      `/api/inzicht/${path}${path.includes('?') ? '&' : '?'}school=${encodeURIComponent(school)}`,
      {
        cache: 'no-store',
        credentials: 'same-origin',
        signal,
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
      throw Object.assign(
        new Error(
          (result as { error?: string }).error ?? 'Ophalen is niet gelukt.',
        ),
        { status: response.status },
      );
    return result as T;
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof Error && error.name === 'TimeoutError')
    )
      throw new Error('Ophalen duurt te lang. Probeer opnieuw.');
    throw error;
  }
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
