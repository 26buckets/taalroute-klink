import assets from '../../../../data/klink-grammar-aa-assets.json' with { type: 'json' };

type Asset = { mime: string; sha256: string; bytes: number; body: string };
type Context = { params: Promise<{ name: string }> };

async function respond(request: Request, context: Context) {
  const { name } = await context.params;
  if (!Object.hasOwn(assets, name)) return new Response(null, { status: 404 });
  const asset = (assets as Record<string, Asset>)[name];
  const etag = `"${asset.sha256}"`;
  const headers = new Headers({ 'Content-Type': asset.mime, 'ETag': etag,
    'Cache-Control': 'public, max-age=31536000, immutable', 'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff' });
  if (request.headers.get('If-None-Match')?.split(',').some(tag => ['*', etag, `W/${etag}`].includes(tag.trim()))) {
    return new Response(null, { status: 304, headers });
  }
  let start = 0, end = asset.bytes - 1, status = 200;
  const range = request.headers.get('Range');
  const ifRange = request.headers.get('If-Range');
  if (request.method !== 'HEAD' && range && (!ifRange || ifRange === etag)) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const a = Number(match?.[1]), b = Number(match?.[2]);
    if (match && (match[1] || match[2]) && Number.isSafeInteger(a) && Number.isSafeInteger(b)) {
      start = match[1] ? a : Math.max(0, asset.bytes - b);
      end = match[1] && match[2] ? Math.min(b, end) : end;
      status = 206;
    }
    if (status !== 206 || start > end || start >= asset.bytes) {
      headers.set('Content-Range', `bytes */${asset.bytes}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${asset.bytes}`);
  }
  headers.set('Content-Length', String(end - start + 1));
  const body = request.method === 'HEAD' ? null : new Uint8Array(Buffer.from(asset.body, 'base64').subarray(start, end + 1));
  return new Response(body, { status, headers });
}

export const GET = respond;
export const HEAD = respond;
