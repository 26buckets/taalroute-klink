import delivery from '../data/klink-practice-delivery.json' with { type: 'json' };

type Entry = { bundleUrl: string; id: string };
export async function practiceBundleResponse(request: Request, assets: Pick<Fetcher, 'fetch'>) {
  const path = new URL(request.url).pathname;
  if (!Object.hasOwn(delivery, path)) return new Response(null, { status: 404 });
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const entry = (delivery as Record<string, Entry>)[path];
  try {
    const response = await assets.fetch(new URL(entry.bundleUrl, request.url));
    if (!response.ok) throw new Error('Missing practice bundle');
    const bundle = await response.json() as { bundleType?: string; banks?: Record<string, unknown> };
    if (bundle.bundleType !== 'klink-production-rounds-v1' || !bundle.banks || !Object.hasOwn(bundle.banks, entry.id)) throw new Error('Invalid practice bundle');
    const text = bundle.banks[entry.id];
    if (typeof text !== 'string') throw new Error('Invalid practice bank');
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const etag = '"' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('') + '"';
    const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'ETag': etag,
      'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' });
    if (request.headers.get('If-None-Match')?.split(',').some(tag => ['*', etag, `W/${etag}`].includes(tag.trim()))) return new Response(null, { status: 304, headers });
    headers.set('Content-Length', String(bytes.length));
    return new Response(request.method === 'HEAD' ? null : bytes, { headers });
  } catch {
    return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
